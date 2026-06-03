import {
  Controller, Post, Body, Headers, RawBodyRequest, Req,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('premium/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCheckout(@Request() req) {
    return this.paymentsService.getPremiumCheckoutSession(
      req.user.id,
      req.user.email,
    );
  }

  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
