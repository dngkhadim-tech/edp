import { Controller, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  followUser(@Request() req, @Param('id') id: string) {
    return this.followsService.followUser(req.user.id, id);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unfollowUser(@Request() req, @Param('id') id: string) {
    return this.followsService.unfollowUser(req.user.id, id);
  }

  @Post('establishments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  followEstablishment(@Request() req, @Param('id') id: string) {
    return this.followsService.followEstablishment(req.user.id, id);
  }

  @Delete('establishments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unfollowEstablishment(@Request() req, @Param('id') id: string) {
    return this.followsService.unfollowEstablishment(req.user.id, id);
  }
}
