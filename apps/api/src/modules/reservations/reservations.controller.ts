import {
  Controller, Get, Post, Patch, Body, Param, UseGuards,
  Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQuery } from '@edp/shared';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() dto: CreateReservationDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyReservations(@Request() req, @Query() query: PaginationQuery) {
    return this.service.getUserReservations(req.user.id, query);
  }

  @Get('establishment/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getEstablishmentReservations(
    @Param('id') id: string,
    @Query() query: PaginationQuery,
  ) {
    return this.service.getEstablishmentReservations(id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  confirm(@Param('id') id: string, @Request() req) {
    return this.service.confirm(id, req.user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancel(@Param('id') id: string, @Request() req) {
    return this.service.cancel(id, req.user.id);
  }
}
