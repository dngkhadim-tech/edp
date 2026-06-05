import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQuery } from '@edp/shared';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPersonalized(@Request() req, @Query() query: PaginationQuery) {
    return this.feedService.getPersonalizedFeed(req.user.id, query);
  }

  @Get('explore')
  @UseGuards(JwtAuthGuard)
  explore(@Query() query: PaginationQuery) {
    return this.feedService.getExploreFeed(query);
  }

  @Get('reels')
  @UseGuards(JwtAuthGuard)
  reels(@Query() query: PaginationQuery) {
    return this.feedService.getReelsFeed(query);
  }
}
