import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2024-04-10',
    });
  }

  async createPaymentIntent(amount: number, currency = 'eur', metadata?: object) {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: metadata as any,
      automatic_payment_methods: { enabled: true },
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async createCustomer(email: string, name: string) {
    return this.stripe.customers.create({ email, name });
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', '');
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  }

  async getPremiumCheckoutSession(userId: string, userEmail: string) {
    const priceId = this.config.get('STRIPE_PREMIUM_PRICE_ID', '');
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.config.get('APP_URL')}/premium/success`,
      cancel_url: `${this.config.get('APP_URL')}/premium/cancel`,
      customer_email: userEmail,
      metadata: { userId },
    });
    return session;
  }
}
