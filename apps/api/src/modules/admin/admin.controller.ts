import {
  Controller, Get, Patch, Delete, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@edp/shared';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Patch('users/:id/toggle-active')
  toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('establishments/:id/verify')
  verifyEstablishment(@Param('id') id: string) {
    return this.adminService.verifyEstablishment(id);
  }

  @Get('reviews/flagged')
  getFlaggedReviews(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getFlaggedReviews(+page, +limit);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  @Get('analytics/growth')
  getGrowth(@Query('days') days = 30) {
    return this.adminService.getGrowthData(+days);
  }
}
