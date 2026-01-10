/**
 * Email Service for Team Invitations
 * Handles sending invitation, reminder, cancellation, and welcome emails
 */

import { createClient } from '@supabase/supabase-js';

export interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteToken: string;
  expiresAt: Date;
}

export interface SendReminderEmailParams {
  to: string;
  workspaceName: string;
  inviteToken: string;
  expiresAt: Date;
}

export interface SendCancellationEmailParams {
  to: string;
  workspaceName: string;
}

export interface SendWelcomeEmailParams {
  to: string;
  workspaceName: string;
  inviterName: string;
}

class EmailService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Generate the invite acceptance URL
   */
  private getInviteUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/invites/accept?token=${token}`;
  }

  /**
   * Format expiry date for display
   */
  private formatExpiryDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  /**
   * Send workspace invitation email
   */
  async sendInviteEmail(params: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const inviteUrl = this.getInviteUrl(params.inviteToken);
      const expiryFormatted = this.formatExpiryDate(params.expiresAt);

      // Use Supabase Auth to send email via OTP (as a workaround for now)
      // In production, you would use a proper email service like SendGrid, Postmark, etc.
      
      const emailHtml = this.generateInviteEmailHtml({
        ...params,
        inviteUrl,
        expiryFormatted,
      });

      // For now, we'll log the email content
      // In production, integrate with your email provider
      console.log('[EmailService] Sending invite email:', {
        to: params.to,
        subject: `${params.inviterName} invited you to join ${params.workspaceName}`,
        html: emailHtml,
      });

      // TODO: Integrate with actual email service
      // Example with SendGrid:
      // await sendgridClient.send({
      //   to: params.to,
      //   from: 'invites@yourdomain.com',
      //   subject: `${params.inviterName} invited you to join ${params.workspaceName}`,
      //   html: emailHtml,
      // });

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send invite email';
      console.error('[EmailService] Error sending invite email:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send reminder email for pending invitation
   */
  async sendReminderEmail(params: SendReminderEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const inviteUrl = this.getInviteUrl(params.inviteToken);
      const expiryFormatted = this.formatExpiryDate(params.expiresAt);

      const emailHtml = this.generateReminderEmailHtml({
        ...params,
        inviteUrl,
        expiryFormatted,
      });

      console.log('[EmailService] Sending reminder email:', {
        to: params.to,
        subject: `Reminder: Join ${params.workspaceName}`,
        html: emailHtml,
      });

      // TODO: Integrate with actual email service

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send reminder email';
      console.error('[EmailService] Error sending reminder email:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send cancellation notification email
   */
  async sendCancellationEmail(params: SendCancellationEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const emailHtml = this.generateCancellationEmailHtml(params);

      console.log('[EmailService] Sending cancellation email:', {
        to: params.to,
        subject: `Invitation to ${params.workspaceName} has been cancelled`,
        html: emailHtml,
      });

      // TODO: Integrate with actual email service

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send cancellation email';
      console.error('[EmailService] Error sending cancellation email:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send welcome email upon invitation acceptance
   */
  async sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const emailHtml = this.generateWelcomeEmailHtml(params);

      console.log('[EmailService] Sending welcome email:', {
        to: params.to,
        subject: `Welcome to ${params.workspaceName}!`,
        html: emailHtml,
      });

      // TODO: Integrate with actual email service

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send welcome email';
      console.error('[EmailService] Error sending welcome email:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Generate HTML for invitation email
   */
  private generateInviteEmailHtml(params: SendInviteEmailParams & { inviteUrl: string; expiryFormatted: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You've Been Invited!</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p><strong>${params.inviterName}</strong> has invited you to join the <strong>${params.workspaceName}</strong> workspace.</p>
      <p>Click the button below to accept the invitation and get started:</p>
      <div style="text-align: center;">
        <a href="${params.inviteUrl}" class="button">Accept Invitation</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This invitation will expire on ${params.expiryFormatted}.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2026 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate HTML for reminder email
   */
  private generateReminderEmailHtml(params: SendReminderEmailParams & { inviteUrl: string; expiryFormatted: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reminder: Pending Invitation</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>This is a friendly reminder that you have a pending invitation to join the <strong>${params.workspaceName}</strong> workspace.</p>
      <p>Don't miss out! Click the button below to accept:</p>
      <div style="text-align: center;">
        <a href="${params.inviteUrl}" class="button">Accept Invitation</a>
      </div>
      <p style="color: #dc2626; font-weight: 600;">⏰ This invitation will expire on ${params.expiryFormatted}.</p>
    </div>
    <div class="footer">
      <p>© 2026 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate HTML for cancellation email
   */
  private generateCancellationEmailHtml(params: SendCancellationEmailParams): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invitation Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>The invitation to join <strong>${params.workspaceName}</strong> has been cancelled.</p>
      <p>If you have any questions, please contact the workspace administrator.</p>
    </div>
    <div class="footer">
      <p>© 2026 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate HTML for welcome email
   */
  private generateWelcomeEmailHtml(params: SendWelcomeEmailParams): string {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ${params.workspaceName}!</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>Welcome aboard! You've successfully joined <strong>${params.workspaceName}</strong>.</p>
      <p>You can now collaborate with <strong>${params.inviterName}</strong> and other team members.</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>
      <p>If you have any questions, feel free to reach out to your team administrator.</p>
    </div>
    <div class="footer">
      <p>© 2026 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

// Singleton instance
export const emailService = new EmailService();
