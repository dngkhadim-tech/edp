import {
  Controller, Post, Delete, Get, Body, Param, UseGuards,
  Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Interactions')
@Controller()
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleLike(@Param('id') id: string, @Request() req) {
    return this.service.toggleLike(req.user.id, id);
  }

  @Post('posts/:id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleSave(@Param('id') id: string, @Request() req) {
    return this.service.toggleSave(req.user.id, id);
  }

  @Get('posts/:id/likes')
  @UseGuards(JwtAuthGuard)
  getLikes(@Param('id') id: string, @Request() req) {
    return this.service.getPostLikes(id, req.user?.id);
  }

  @Get('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  getComments(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.getComments(id, +page, +limit);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addComment(
    @Param('id') id: string,
    @Request() req,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.service.addComment(req.user.id, id, content, parentId);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteComment(@Param('id') id: string, @Request() req) {
    return this.service.deleteComment(id, req.user.id);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param('id') id: string) {
    return this.service.likeComment(id);
  }

  @Get('users/me/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getSaved(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.getSavedPosts(req.user.id, +page, +limit);
  }
}
