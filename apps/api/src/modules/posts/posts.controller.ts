import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
  Request, Query, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { MediaService } from '../media/media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostType, PaginationQuery } from '@edp/shared';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaService: MediaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  async create(
    @Request() req,
    @Body() dto: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const media = [];
    if (files?.length) {
      for (const file of files) {
        const url = await this.mediaService.uploadFile(file, 'posts');
        media.push({ url, type: file.mimetype.startsWith('video') ? 'video' : 'image' });
      }
    }

    const hashtags = dto.caption
      ? (dto.caption.match(/#\w+/g) || []).map((h: string) => h.slice(1))
      : [];

    if (dto.type === PostType.STORY) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      dto.expiresAt = expiresAt;
    }

    return this.postsService.create(req.user.id, 'USER', { ...dto, media, hashtags });
  }

  @Get('trending')
  @UseGuards(JwtAuthGuard)
  getTrending(@Query() query: PaginationQuery) {
    return this.postsService.getTrending(query);
  }

  @Get('stories')
  @UseGuards(JwtAuthGuard)
  getStories() {
    return this.postsService.getActiveStories();
  }

  @Get('hashtag/:tag')
  @UseGuards(JwtAuthGuard)
  getByHashtag(@Param('tag') tag: string, @Query() query: PaginationQuery) {
    return this.postsService.getByHashtag(tag, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  delete(@Param('id') id: string, @Request() req) {
    return this.postsService.delete(id, req.user.id);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  view(@Param('id') id: string) {
    return this.postsService.incrementViews(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getUserPosts(@Param('userId') userId: string, @Query() query: PaginationQuery) {
    return this.postsService.getUserPosts(userId, query);
  }

  @Get('establishment/:estId')
  @UseGuards(JwtAuthGuard)
  getEstPosts(@Param('estId') estId: string, @Query() query: PaginationQuery) {
    return this.postsService.getEstablishmentPosts(estId, query);
  }
}
