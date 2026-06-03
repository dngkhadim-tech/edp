import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get('AWS_REGION', 'eu-west-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.bucket = config.get('AWS_S3_BUCKET', 'edp-media');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    optimize = true,
  ): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;
    let buffer = file.buffer;
    let contentType = file.mimetype;

    if (optimize && file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif') {
      buffer = await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      contentType = 'image/webp';
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );

    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async deleteFile(url: string): Promise<void> {
    const key = url.split('.amazonaws.com/')[1];
    if (!key) return;
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getPresignedUrl(folder: string, filename: string, contentType: string) {
    const key = `${folder}/${uuidv4()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { url, key, publicUrl: `https://${this.bucket}.s3.amazonaws.com/${key}` };
  }
}
