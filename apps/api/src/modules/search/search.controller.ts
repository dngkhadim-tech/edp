import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  search(@Query('q') q: string, @Query('limit') limit = 10) {
    return this.searchService.globalSearch(q, +limit);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  searchUsers(@Query('q') q: string, @Query('limit') limit = 20) {
    return this.searchService.searchUsers(q, +limit);
  }

  @Get('establishments')
  @UseGuards(JwtAuthGuard)
  searchEstablishments(@Query('q') q: string, @Query('limit') limit = 20) {
    return this.searchService.searchEstablishments(q, +limit);
  }
}
