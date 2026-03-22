import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { ConfigUtil } from '../common/utils/config.util';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private config: ConfigUtil;
  private provider: 'smtp' | 'resend';

  constructor(private configService: ConfigService) {
    this.config = new ConfigUtil(configService);
    this.provider = (this.config.get('EMAIL_PROVIDER', 'smtp').toLowerCase() as 'smtp' | 'resend');
    
    if (this.provider === 'resend') {
      const apiKey = this.config.get('RESEND_API_KEY');
      if (apiKey) {
        this.resend = new Resend(apiKey);
        this.logger.log('Email Service initialized with Resend provider');
      } else {
        this.logger.error('Resend API Key is missing. Falling back to SMTP.');
        this.provider = 'smtp';
      }
    }

    // Initialize SMTP if provider is smtp or as fallback
    if (this.provider === 'smtp') {
      const port = this.config.getNumber('SMTP_PORT', 587);
      this.transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST'),
        port: port,
        secure: port === 465,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      this.logger.log('Email Service initialized with SMTP provider');
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = this.config.get('SMTP_FROM', 'noreply@estatehub.com');
    
    try {
      if (this.provider === 'resend' && this.resend) {
        const { data, error } = await this.resend.emails.send({
          from,
          to,
          subject,
          html,
        });

        if (error) {
          throw error;
        }

        this.logger.log(`Email sent via Resend: ${data?.id}`);
        return data;
      } else if (this.transporter) {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent via SMTP: ${info.messageId}`);
        return info;
      } else {
        throw new Error('No email provider configured');
      }
    } catch (error: any) {
      this.logger.error(`Error sending email (${this.provider}): ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    const subject = 'Reset Your EstateHub Password';
    const html = `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; background-color: #059669; border-radius: 12px; margin-bottom: 12px; line-height: 48px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
              Estate<span style="color: #059669;">Hub</span>
            </h1>
          </div>
          <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Reset your password</h2>
            <p style="margin-bottom: 24px; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              We received a request to reset the password for your EstateHub account. Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
                Reset Password
              </a>
            </div>
            <div style="padding: 16px; background-color: #f1f5f9; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                <strong>Security Note:</strong> This link will expire in 15 minutes. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
            <p style="margin: 0; color: #94a3b8; font-size: 14px; text-align: center;">
              Questions? Reply to this email or visit our help center.
            </p>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
              &copy; 2026 EstateHub CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendMail(to, subject, html);
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to EstateHub CRM';
    const html = `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; background-color: #059669; border-radius: 12px; margin-bottom: 12px; line-height: 48px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
              Estate<span style="color: #059669;">Hub</span>
            </h1>
          </div>
          <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Welcome, ${name}!</h2>
            <p style="margin-bottom: 24px; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              We're excited to have you on board. EstateHub is designed to help you manage your leads, properties, and deals more effectively.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="http://localhost:5173" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
                Go to Dashboard
              </a>
            </div>
            <p style="margin: 0; color: #94a3b8; font-size: 14px; text-align: center;">
              If you have any questions, just reply to this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
              &copy; 2026 EstateHub CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendMail(to, subject, html);
  }

  async sendInvitationEmail(to: string, orgName: string, token: string, isNewUser: boolean) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const invitationLink = `${frontendUrl}/invite/${token}`;
    
    const subject = `You've been invited to join ${orgName} on EstateHub`;
    const html = `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; background-color: #059669; border-radius: 12px; margin-bottom: 12px; line-height: 48px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
              Estate<span style="color: #059669;">Hub</span>
            </h1>
          </div>
          <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Join ${orgName}</h2>
            <p style="margin-bottom: 24px; color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              You have been invited to join <strong>${orgName}</strong> on EstateHub CRM. 
              ${isNewUser ? 'Create your account to get started.' : 'Click the button below to accept the invitation.'}
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${invitationLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none;">
                ${isNewUser ? 'Create Account & Join' : 'Accept Invitation'}
              </a>
            </div>
            <div style="padding: 16px; background-color: #f1f5f9; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                <strong>Security Note:</strong> This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
            <p style="margin: 0; color: #94a3b8; font-size: 14px; text-align: center;">
              Questions? Reply to this email or visit our help center.
            </p>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
              &copy; 2026 EstateHub CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendMail(to, subject, html);
  }
}
