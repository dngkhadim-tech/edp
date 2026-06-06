import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const BUCKET = 'edp-media';

@Injectable()
export class MediaService {
  private supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL', ''),
      config.get<string>('SUPABASE_SERVICE_KEY', ''),
    );
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

    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType, upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    return this.supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  }

  async deleteFile(url: string): Promise<void> {
    const marker = `/object/public/${BUCKET}/`;
    const key = url.split(marker)[1];
    if (!key) return;
    await this.supabase.storage.from(BUCKET).remove([key]);
  }

  async getPresignedUrl(folder: string, filename: string, contentType: string) {
    const key = `${folder}/${uuidv4()}-${filename}`;
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(key);

    if (error || !data) throw new Error(`Presign failed: ${error?.message}`);

    const publicUrl = this.supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    return { url: data.signedUrl, key, publicUrl };
  }
}
