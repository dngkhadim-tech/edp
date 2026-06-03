import {
  Controller, Get, Post, Patch, Body, Param, UseGuards,
  Request, Query, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EstablishmentsService } from './establishments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchQuery } from '@edp/shared';

@ApiTags('Establishments')
@Controller('establishments')
export class EstablishmentsController {
  constructor(private readonly service: EstablishmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() dto: any) {
    return this.service.create(req.user.id, dto);
  }

  @Get('search')
  search(@Query() query: SearchQuery) {
    return this.service.search(query);
  }

  @Get('nearby')
  getNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('type') type?: string,
  ) {
    return this.service.getNearby(lat, lng, radius, type);
  }

  @Get('featured')
  getFeatured(@Query('type') type?: string) {
    return this.service.getFeatured(type);
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('slug') slug: string, @Request() req) {
    return this.service.findBySlug(slug, req.user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Request() req, @Body() dto: any) {
    return this.service.update(id, req.user.id, dto);
  }
}
