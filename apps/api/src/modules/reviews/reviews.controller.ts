import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
  Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto, PaginationQuery } from '@edp/shared';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('establishment/:id')
  getForEstablishment(
    @Param('id') id: string,
    @Query() query: PaginationQuery,
  ) {
    return this.reviewsService.getForEstablishment(id, query);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  respond(
    @Param('id') id: string,
    @Request() req,
    @Body('content') content: string,
  ) {
    return this.reviewsService.respondToReview(id, req.user.id, content);
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  markHelpful(@Param('id') id: string, @Request() req) {
    return this.reviewsService.markHelpful(id, req.user.id);
  }

  @Post(':id/flag')
  @UseGuards(JwtAuthGuard)
  flag(@Param('id') id: string) {
    return this.reviewsService.flagReview(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  delete(@Param('id') id: string, @Request() req) {
    return this.reviewsService.delete(id, req.user.id);
  }
}
