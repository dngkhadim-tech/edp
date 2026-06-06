import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { verificationTemplate } from './templates/verification.template';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM', 'noreply@edp.app');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.resend.com'),
      port: Number(config.get<string>('SMTP_PORT', '587')),
      auth: {
        user: config.get<string>('SMTP_USER', 'resend'),
        pass: config.get<string>('SMTP_PASS', ''),
      },
    });
  }

  async sendVerificationEmail(
    user: { email: string; firstName: string },
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/auth/verify-email?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: 'Vérifie ton adresse email — EDP',
        html: verificationTemplate(user.firstName, link),
      });
    } catch (err) {
      console.error('[EmailService] sendVerificationEmail failed:', err);
    }
  }

  async sendPasswordResetEmail(
    user: { email: string; firstName: string },
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/auth/reset-password?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: 'Réinitialise ton mot de passe — EDP',
        html: passwordResetTemplate(user.firstName, link),
      });
    } catch (err) {
      console.error('[EmailService] sendPasswordResetEmail failed:', err);
    }
  }
}
