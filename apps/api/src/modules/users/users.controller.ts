import {
  Controller, Get, Patch, Body, Param, UseGuards,
  Request, Query, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto, PaginationQuery } from '@edp/shared';
import { MediaService } from '../media/media.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMe(@Request() req) {
    return req.user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const url = await this.mediaService.uploadFile(file, 'avatars');
    return this.usersService.updateAvatar(req.user.id, url);
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getUserPosts(@Param('id') id: string, @Query() query: PaginationQuery) {
    return this.usersService.getPostsByUser(id, query);
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Param('username') username: string, @Request() req) {
    return this.usersService.findByUsername(username, req.user?.id);
  }

  @Get(':id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getFollowers(@Param('id') id: string, @Query() query: PaginationQuery) {
    return this.usersService.getFollowers(id, query);
  }

  @Get(':id/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getFollowing(@Param('id') id: string, @Query() query: PaginationQuery) {
    return this.usersService.getFollowing(id, query);
  }

  @Patch('me/fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateFcmToken(@Request() req, @Body('token') token: string) {
    return this.usersService.updateFcmToken(req.user.id, token);
  }
}
