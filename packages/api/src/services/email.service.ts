import nodemailer from "nodemailer";
import { User, Organization, UserRole } from "@prisma/client";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private baseUrl: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || "noreply@carelinkMN.com";
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "localhost",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    });
  }

  /**
   * Send email verification to user
   */
  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.baseUrl}/auth/verify-email?token=${token}`;

    const template = this.getEmailVerificationTemplate(user, verificationUrl);

    await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${this.baseUrl}/auth/reset-password?token=${token}`;

    const template = this.getPasswordResetTemplate(user, resetUrl);

    await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(
    user: User,
    organization?: Organization
  ): Promise<void> {
    const template = this.getWelcomeTemplate(user, organization);

    await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send organization verification needed email
   */
  async sendOrganizationVerificationEmail(
    user: User,
    organization: Organization
  ): Promise<void> {
    const template = this.getOrganizationVerificationTemplate(
      user,
      organization
    );

    await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(user: User, token: string): Promise<void> {
    await this.sendVerificationEmail(user, token);
  }

  /**
   * Generic email sender
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Skip email sending in development mode
    const isDevelopment = process.env.NODE_ENV === "development";
    
    // Check for RFC 2606 reserved domains (example.com, example.org, example.net, test.com, etc.)
    const reservedDomains = ['example.com', 'example.org', 'example.net', 'test.com', 'localhost'];
    const emailDomain = options.to.split('@')[1]?.toLowerCase();
    const isReservedDomain = emailDomain && reservedDomains.some(domain => emailDomain.includes(domain));
    
    // Skip if: development mode AND (no email host OR localhost OR reserved domain)
    const skipEmail = isDevelopment && (
      !process.env.EMAIL_HOST || 
      process.env.EMAIL_HOST === "localhost" ||
      isReservedDomain
    );
    
    if (skipEmail) {
      console.log("📧 [DEV MODE] Email sending skipped:");
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      const urlMatch = options.html.match(/https?:\/\/[^\s"<>]+/);
      if (urlMatch) {
        console.log(`   Verification URL: ${urlMatch[0]}`);
      }
      return;
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log("✅ Email sent successfully:", result.messageId);
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      // In development, don't throw error if email fails
      if (isDevelopment) {
        console.warn("⚠️  [DEV MODE] Continuing despite email failure");
        return;
      }
      throw new Error("Failed to send email");
    }
  }

  /**
   * Email verification template
   */
  private getEmailVerificationTemplate(
    user: User,
    verificationUrl: string
  ): EmailTemplate {
    const subject = "Verify your CareLinkMN account";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account - CareLinkMN</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .highlight { background: #fef3c7; padding: 3px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to CareLinkMN!</h1>
          <p>Please verify your email address to get started</p>
        </div>

        <div class="content">
          <h2>Hello ${user.firstName},</h2>

          <p>Thank you for registering with CareLinkMN as a <span class="highlight">${this.getRoleDisplayName(user.role)}</span>. To complete your account setup and start using our platform, please verify your email address.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Click the verification button above</li>
            <li>Your account will be activated</li>
            <li>You'll be able to sign in and access your dashboard</li>
            ${user.role !== "PUBLIC" ? "<li>Complete your organization profile setup</li>" : ""}
          </ul>

          <p><strong>Didn't request this?</strong><br>
          If you didn't create a CareLinkMN account, you can safely ignore this email.</p>

          <div class="footer">
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you're having trouble clicking the button, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${verificationUrl}</span></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to CareLinkMN!

      Hello ${user.firstName},

      Thank you for registering with CareLinkMN as a ${this.getRoleDisplayName(user.role)}. To complete your account setup, please verify your email address by visiting:

      ${verificationUrl}

      This verification link will expire in 24 hours.

      If you didn't create a CareLinkMN account, you can safely ignore this email.

      Best regards,
      The CareLinkMN Team
    `;

    return { subject, html, text };
  }

  /**
   * Password reset template
   */
  private getPasswordResetTemplate(
    user: User,
    resetUrl: string
  ): EmailTemplate {
    const subject = "Reset your CareLinkMN password";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - CareLinkMN</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request</h1>
          <p>We received a request to reset your password</p>
        </div>

        <div class="content">
          <h2>Hello ${user.firstName},</h2>

          <p>We received a request to reset the password for your CareLinkMN account (<strong>${user.email}</strong>).</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>

          <div class="warning">
            <strong>Important Security Information:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>Only use this link if you requested the password reset</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your current password remains unchanged until you set a new one</li>
            </ul>
          </div>

          <p>If you're having trouble accessing your account or didn't request this reset, please contact our support team.</p>

          <div class="footer">
            <p>For security reasons, this link will expire in 1 hour.</p>
            <p>If you're having trouble clicking the button, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - CareLinkMN

      Hello ${user.firstName},

      We received a request to reset the password for your CareLinkMN account (${user.email}).

      To reset your password, visit:
      ${resetUrl}

      IMPORTANT:
      - This link will expire in 1 hour
      - Only use this link if you requested the password reset
      - If you didn't request this, please ignore this email

      Best regards,
      The CareLinkMN Team
    `;

    return { subject, html, text };
  }

  /**
   * Welcome email template
   */
  private getWelcomeTemplate(
    user: User,
    organization?: Organization
  ): EmailTemplate {
    const subject = `Welcome to CareLinkMN, ${user.firstName}!`;

    const dashboardUrl = `${this.baseUrl}/${this.getDashboardPath(user.role)}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CareLinkMN</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .feature-box { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #059669; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to CareLinkMN!</h1>
          <p>Your account is now active and ready to use</p>
        </div>

        <div class="content">
          <h2>Hello ${user.firstName},</h2>

          <p>Congratulations! Your CareLinkMN account has been successfully verified${organization ? ` for <strong>${organization.name}</strong>` : ""}. You're now part of Minnesota's premier care coordination network.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="button">Go to Your Dashboard</a>
          </div>

          ${this.getWelcomeContentByRole(user.role)}

          <div class="feature-box">
            <h3>🚀 Getting Started Tips</h3>
            <ul>
              <li>Complete your profile to maximize your visibility</li>
              <li>Explore the platform features in your dashboard</li>
              <li>Check out our help documentation</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </div>

          <p>Thank you for joining CareLinkMN. Together, we're improving care coordination across Minnesota!</p>

          <div class="footer">
            <p>Need help? Contact our support team at <a href="mailto:support@carelinkMN.com">support@carelinkMN.com</a></p>
            <p>Follow us for updates and tips on making the most of CareLinkMN.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to CareLinkMN!

      Hello ${user.firstName},

      Congratulations! Your CareLinkMN account has been successfully verified${organization ? ` for ${organization.name}` : ""}. You're now part of Minnesota's premier care coordination network.

      Access your dashboard at: ${dashboardUrl}

      ${this.getWelcomeTextContentByRole(user.role)}

      Thank you for joining CareLinkMN!

      Best regards,
      The CareLinkMN Team
    `;

    return { subject, html, text };
  }

  /**
   * Organization verification template
   */
  private getOrganizationVerificationTemplate(
    user: User,
    organization: Organization
  ): EmailTemplate {
    const subject = "Organization verification required - CareLinkMN";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Organization Verification - CareLinkMN</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .info-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Organization Verification Needed</h1>
          <p>Complete your organization setup</p>
        </div>

        <div class="content">
          <h2>Hello ${user.firstName},</h2>

          <p>Your CareLinkMN account has been created, but we need to verify your organization details for <strong>${organization.name}</strong> before you can access all platform features.</p>

          <div class="info-box">
            <h3>What's needed for verification:</h3>
            <ul>
              <li>Organization licenses and certifications</li>
              <li>Business registration documents</li>
              <li>Contact information verification</li>
              <li>Service area confirmation</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.baseUrl}/organization/verification" class="button">Complete Verification</a>
          </div>

          <p><strong>Verification Timeline:</strong><br>
          Our team will review your organization details within 48 hours. You'll receive an email confirmation once verification is complete.</p>

          <p>During the verification process, you can still access basic platform features and explore the interface.</p>

          <div class="footer">
            <p>Questions about verification? Contact us at <a href="mailto:verification@carelinkMN.com">verification@carelinkMN.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Organization Verification Needed - CareLinkMN

      Hello ${user.firstName},

      Your CareLinkMN account has been created, but we need to verify your organization details for ${organization.name} before you can access all platform features.

      What's needed for verification:
      - Organization licenses and certifications
      - Business registration documents
      - Contact information verification
      - Service area confirmation

      Complete verification at: ${this.baseUrl}/organization/verification

      Our team will review your details within 48 hours.

      Best regards,
      The CareLinkMN Team
    `;

    return { subject, html, text };
  }

  /**
   * Send license expiry reminder email
   */
  async sendLicenseExpiryReminder(params: {
    to: string;
    licenseId: string;
    licenseType: string;
    licenseNumber: string;
    expirationDate: Date;
    daysUntilExpiry: number;
  }): Promise<void> {
    const template = this.getLicenseExpiryReminderTemplate(params);

    await this.sendEmail({
      to: params.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send opening expired notification email
   */
  async sendOpeningExpiredNotification(params: {
    to: string;
    openingId: string;
    homeName: string;
    spotsAvailable: number;
  }): Promise<void> {
    const template = this.getOpeningExpiredNotificationTemplate(params);

    await this.sendEmail({
      to: params.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send opening expiry reminder email (24 hours before expiry)
   */
  async sendOpeningExpiryReminder(params: {
    to: string;
    openingId: string;
    homeName: string;
    hoursUntilExpiry: number;
    spotsAvailable: number;
  }): Promise<void> {
    const template = this.getOpeningExpiryReminderTemplate(params);

    await this.sendEmail({
      to: params.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Get license expiry reminder email template
   */
  private getLicenseExpiryReminderTemplate(params: {
    licenseId: string;
    licenseType: string;
    licenseNumber: string;
    expirationDate: Date;
    daysUntilExpiry: number;
  }): EmailTemplate {
    const expirationDateStr = params.expirationDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const subject = `License Expiring Soon - ${params.licenseType} (${params.daysUntilExpiry} days)`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>License Expiring Soon</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">License Expiring Soon</h1>
          </div>
          <div style="background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your license is expiring in <strong>${params.daysUntilExpiry} days</strong>.
            </p>
            <div style="background: hsl(var(--muted)); padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>License Type:</strong> ${params.licenseType}</p>
              <p style="margin: 5px 0;"><strong>License Number:</strong> ${params.licenseNumber}</p>
              <p style="margin: 5px 0;"><strong>Expiration Date:</strong> ${expirationDateStr}</p>
            </div>
            <p style="font-size: 16px; margin-top: 20px;">
              Please renew your license to avoid service interruption. You can manage your licenses in your provider dashboard.
            </p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${this.baseUrl}/provider/licenses" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Manage Licenses
              </a>
            </div>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground)); margin-top: 30px;">
              This is an automated reminder. Please ensure your license information is up to date.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
License Expiring Soon

Your license is expiring in ${params.daysUntilExpiry} days.

License Type: ${params.licenseType}
License Number: ${params.licenseNumber}
Expiration Date: ${expirationDateStr}

Please renew your license to avoid service interruption. You can manage your licenses at:
${this.baseUrl}/provider/licenses

This is an automated reminder.
    `;

    return { subject, html, text };
  }

  /**
   * Get opening expired notification email template
   */
  private getOpeningExpiredNotificationTemplate(params: {
    openingId: string;
    homeName: string;
    spotsAvailable: number;
  }): EmailTemplate {
    const subject = `Opening Expired - ${params.homeName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Opening Expired</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: hsl(var(--destructive)); color: hsl(var(--destructive-foreground)); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Opening Expired</h1>
          </div>
          <div style="background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              An opening has been automatically marked as expired due to inactivity (48-hour freshness requirement).
            </p>
            <div style="background: hsl(var(--muted)); padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Home:</strong> ${params.homeName}</p>
              <p style="margin: 5px 0;"><strong>Spots Available:</strong> ${params.spotsAvailable}</p>
            </div>
            <p style="font-size: 16px; margin-top: 20px;">
              To reactivate this opening, please refresh it in your dashboard. This ensures that families see current availability.
            </p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${this.baseUrl}/provider/openings/${params.openingId}" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Opening
              </a>
            </div>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground)); margin-top: 30px;">
              This is an automated notification. Openings are automatically expired after 48 hours of inactivity to ensure data freshness.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Opening Expired

An opening has been automatically marked as expired due to inactivity (48-hour freshness requirement).

Home: ${params.homeName}
Spots Available: ${params.spotsAvailable}

To reactivate this opening, please refresh it in your dashboard:
${this.baseUrl}/provider/openings/${params.openingId}

This is an automated notification.
    `;

    return { subject, html, text };
  }

  /**
   * Get opening expiry reminder email template
   */
  private getOpeningExpiryReminderTemplate(params: {
    openingId: string;
    homeName: string;
    hoursUntilExpiry: number;
    spotsAvailable: number;
  }): EmailTemplate {
    const subject = `Opening Expiring Soon - ${params.homeName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Opening Expiring Soon</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: hsl(var(--warning)); color: hsl(var(--warning-foreground)); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Opening Expiring Soon</h1>
          </div>
          <div style="background: hsl(var(--background)); border: 1px solid hsl(var(--border)); border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              This opening will expire in <strong>${params.hoursUntilExpiry} hours</strong> if not refreshed.
            </p>
            <div style="background: hsl(var(--muted)); padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Home:</strong> ${params.homeName}</p>
              <p style="margin: 5px 0;"><strong>Spots Available:</strong> ${params.spotsAvailable}</p>
            </div>
            <p style="font-size: 16px; margin-top: 20px;">
              Please refresh this opening to maintain data freshness and visibility in search results.
            </p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${this.baseUrl}/provider/openings/${params.openingId}" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Refresh Opening
              </a>
            </div>
            <p style="font-size: 14px; color: hsl(var(--muted-foreground)); margin-top: 30px;">
              This is an automated reminder sent 24 hours before expiry per platform policy.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Opening Expiring Soon

This opening will expire in ${params.hoursUntilExpiry} hours if not refreshed.

Home: ${params.homeName}
Spots Available: ${params.spotsAvailable}

Refresh the opening:
${this.baseUrl}/provider/openings/${params.openingId}

This is an automated reminder.
    `;

    return { subject, html, text };
  }

  /**
   * Helper methods
   */
  private getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      SUPER_ADMIN: "Super Administrator",
      ADMIN: "Administrator",
      PROVIDER_OWNER: "Provider Owner",
      PROVIDER_STAFF: "Provider Staff",
      CASE_MANAGER: "Case Manager",
      HOSPITAL_SW: "Hospital Social Worker",
      VRS_SPECIALIST: "VRS Specialist",
      VENDOR: "Vendor",
      PUBLIC: "Family Member",
    };
    return roleNames[role] || role;
  }

  private getDashboardPath(role: UserRole): string {
    const paths = {
      SUPER_ADMIN: "admin/dashboard",
      ADMIN: "admin/dashboard",
      PROVIDER_OWNER: "provider/dashboard",
      PROVIDER_STAFF: "provider/dashboard",
      CASE_MANAGER: "case-manager/dashboard",
      HOSPITAL_SW: "hospital/dashboard",
      VRS_SPECIALIST: "vrs/dashboard",
      VENDOR: "vendor/dashboard",
      PUBLIC: "search",
    };
    return paths[role] || "dashboard";
  }

  private getWelcomeContentByRole(role: UserRole): string {
    const content: Partial<Record<UserRole, string>> = {
      PROVIDER_OWNER: `
        <div class="feature-box">
          <h3>🏥 As a Provider Owner, you can now:</h3>
          <ul>
            <li>Manage multiple care facilities</li>
            <li>Update availability and openings in real-time</li>
            <li>Receive and respond to referrals</li>
            <li>Track placement analytics and performance</li>
            <li>Manage your team and staff access</li>
          </ul>
        </div>
      `,
      PROVIDER_STAFF: `
        <div class="feature-box">
          <h3>👥 As Provider Staff, you can:</h3>
          <ul>
            <li>Update facility openings and availability</li>
            <li>Respond to referral inquiries</li>
            <li>Communicate with case managers</li>
            <li>Track placement status</li>
          </ul>
        </div>
      `,
      CASE_MANAGER: `
        <div class="feature-box">
          <h3>📋 As a Case Manager, you can:</h3>
          <ul>
            <li>Create and manage client referrals</li>
            <li>Search for appropriate care placements</li>
            <li>Use AI-powered CareBot for smart matching</li>
            <li>Track your referral pipeline</li>
            <li>Communicate directly with providers</li>
          </ul>
        </div>
      `,
      HOSPITAL_SW: `
        <div class="feature-box">
          <h3>🏥 As a Hospital Social Worker, you can:</h3>
          <ul>
            <li>Coordinate urgent discharge placements</li>
            <li>Use AI matching for complex medical needs</li>
            <li>Send provider invitations with time limits</li>
            <li>Arrange transportation (NEMT)</li>
            <li>Track discharge checklists and follow-ups</li>
          </ul>
        </div>
      `,
      VRS_SPECIALIST: `
        <div class="feature-box">
          <h3>💼 As a VRS Specialist, you can:</h3>
          <ul>
            <li>Manage client job placement cases</li>
            <li>Connect with inclusive employers</li>
            <li>Track job placement success rates</li>
            <li>Monitor client retention metrics</li>
          </ul>
        </div>
      `,
      VENDOR: `
        <div class="feature-box">
          <h3>🛍️ As a Vendor, you can:</h3>
          <ul>
            <li>List your services in our marketplace</li>
            <li>Receive qualified leads from care coordinators</li>
            <li>Manage your vendor profile and offerings</li>
            <li>Track lead conversion and performance</li>
          </ul>
        </div>
      `,
      PUBLIC: `
        <div class="feature-box">
          <h3>🔍 As a Family Member, you can:</h3>
          <ul>
            <li>Search for care facilities near you</li>
            <li>Compare providers and services</li>
            <li>View real-time availability</li>
            <li>Contact providers directly</li>
            <li>Save your favorite facilities</li>
          </ul>
        </div>
      `,
      ADMIN: `
        <div class="feature-box">
          <h3>⚙️ As an Administrator, you can:</h3>
          <ul>
            <li>Manage user accounts and organizations</li>
            <li>View system analytics and reports</li>
            <li>Configure platform settings</li>
            <li>Monitor compliance and audit logs</li>
          </ul>
        </div>
      `,
      SUPER_ADMIN: `
        <div class="feature-box">
          <h3>🔧 As a Super Administrator, you can:</h3>
          <ul>
            <li>Full system administration access</li>
            <li>Manage administrators and permissions</li>
            <li>System maintenance and monitoring</li>
            <li>Advanced configuration and security</li>
          </ul>
        </div>
      `,
    };
    return content[role] || "";
  }

  private getWelcomeTextContentByRole(role: UserRole): string {
    const content: Partial<Record<UserRole, string>> = {
      PROVIDER_OWNER:
        "As a Provider Owner, you can manage multiple facilities, track analytics, and receive referrals.",
      PROVIDER_STAFF:
        "As Provider Staff, you can update openings and respond to referrals.",
      CASE_MANAGER:
        "As a Case Manager, you can create referrals and use our AI-powered search.",
      HOSPITAL_SW:
        "As a Hospital Social Worker, you can coordinate discharges and arrange transport.",
      VRS_SPECIALIST:
        "As a VRS Specialist, you can manage job placements and track retention.",
      VENDOR: "As a Vendor, you can list services and receive qualified leads.",
      PUBLIC:
        "As a Family Member, you can search for care facilities and compare options.",
      ADMIN:
        "As an Administrator, you can manage users and view system analytics.",
      SUPER_ADMIN:
        "As a Super Administrator, you have full system access and control.",
    };
    return content[role] || "";
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(data: {
    to: string;
    subject: string;
    message: string;
    actionUrl?: string;
    userName: string;
  }): Promise<void> {
    const template = this.getNotificationEmailTemplate(data);
    await this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Notification email template
   */
  private getNotificationEmailTemplate(data: {
    subject: string;
    message: string;
    actionUrl?: string;
    userName: string;
  }): EmailTemplate {
    const subject = data.subject;
    const actionButton = data.actionUrl
      ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.baseUrl}${data.actionUrl}" class="button">View Details</a>
        </div>
      `
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject} - CareLinkMN</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .message { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CareLinkMN</h1>
        </div>
        <div class="content">
          <h2>${data.subject}</h2>
          <p>Hello ${data.userName},</p>
          <div class="message">
            <p>${data.message}</p>
          </div>
          ${actionButton}
          <div class="footer">
            <p>This is an automated notification from CareLinkMN.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${data.subject}

      Hello ${data.userName},

      ${data.message}

      ${data.actionUrl ? `View details: ${this.baseUrl}${data.actionUrl}` : ""}

      This is an automated notification from CareLinkMN.
      If you have any questions, please contact our support team.
    `;

    return { subject, html, text };
  }
}
