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

interface LayoutOptions {
  title: string;
  content: string;
  previewText?: string;
  actionUrl?: string;
  actionLabel?: string;
  themeColor?: string;
  footerText?: string;
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
   * Send staff invitation email
   */
  async sendStaffInvitationEmail(
    staffUser: User,
    inviterName: string,
    organizationName: string,
    resetToken: string
  ): Promise<void> {
    const invitationUrl = `${this.baseUrl}/auth/reset-password?token=${resetToken}`;
    const template = this.getStaffInvitationTemplate(
      staffUser,
      inviterName,
      organizationName,
      invitationUrl
    );

    await this.sendEmail({
      to: staffUser.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
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
    const reservedDomains = [
      "example.com",
      "example.org",
      "example.net",
      "test.com",
      "localhost",
    ];
    const emailDomain = options.to.split("@")[1]?.toLowerCase();
    const isReservedDomain =
      emailDomain &&
      reservedDomains.some((domain) => emailDomain.includes(domain));

    // Skip if: development mode AND (no email host OR localhost OR reserved domain)
    const skipEmail =
      isDevelopment &&
      (!process.env.EMAIL_HOST ||
        process.env.EMAIL_HOST === "localhost" ||
        isReservedDomain);

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
   * Unified Email Layout Generator
   */
  private getLayout(options: LayoutOptions): string {
    const themeColor = options.themeColor || "#1D4ED8"; // Default to Primary Blue
    const previewText = options.previewText || options.title;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1E293B; max-width: 600px; margin: 0 auto; padding: 0; background-color: #F8FAFC; }
          .container { background-color: #FFFFFF; border-radius: 8px; overflow: hidden; margin: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: ${themeColor}; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px 20px; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; background-color: ${themeColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background-color 0.2s; }
          .button:hover { opacity: 0.9; }
          .footer { background-color: #F1F5F9; padding: 20px; text-align: center; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0; }
          .footer a { color: ${themeColor}; text-decoration: none; }
          .highlight { background-color: #FEF3C7; padding: 2px 6px; border-radius: 4px; color: #92400E; }
          .info-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid ${themeColor}; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .warning-box { background-color: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid #EF4444; padding: 15px; border-radius: 4px; margin: 20px 0; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          p { margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          ${previewText}
        </div>
        
        <div class="container">
          <div class="header">
            <h1>${options.title}</h1>
          </div>
          
          <div class="content">
            ${options.content}
            
            ${
              options.actionUrl && options.actionLabel
                ? `
              <div class="button-container">
                <a href="${options.actionUrl}" class="button">${options.actionLabel}</a>
              </div>
            `
                : ""
            }
            
            ${
              options.footerText
                ? `<p style="font-size: 14px; color: #64748B; margin-top: 30px;">${options.footerText}</p>`
                : ""
            }
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CareLinkMN. All rights reserved.</p>
            <p>Minnesota's Premier Care Coordination Platform</p>
            <p>
              <a href="${this.baseUrl}/privacy">Privacy Policy</a> | 
              <a href="${this.baseUrl}/terms">Terms of Service</a> | 
              <a href="${this.baseUrl}/contact">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email verification template
   */
  private getEmailVerificationTemplate(
    user: User,
    verificationUrl: string
  ): EmailTemplate {
    const subject = "Verify your CareLinkMN account";
    const title = "Welcome to CareLinkMN!";
    
    const content = `
      <h2>Hello ${user.firstName},</h2>
      <p>Thank you for registering with CareLinkMN as a <span class="highlight">${this.getRoleDisplayName(user.role)}</span>. To complete your account setup and start using our platform, please verify your email address.</p>
      
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>Click the verification button below</li>
        <li>Your account will be activated</li>
        <li>You'll be able to sign in and access your dashboard</li>
        ${user.role !== "PUBLIC" ? "<li>Complete your organization profile setup</li>" : ""}
      </ul>
      
      <p><strong>Didn't request this?</strong><br>
      If you didn't create a CareLinkMN account, you can safely ignore this email.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: verificationUrl,
      actionLabel: "Verify Email Address",
      previewText: "Please verify your email address to get started with CareLinkMN.",
      footerText: `This verification link will expire in 24 hours. If you're having trouble, copy this link: ${verificationUrl}`
    });

    const text = `
      Welcome to CareLinkMN!
      
      Hello ${user.firstName},
      
      Thank you for registering with CareLinkMN as a ${this.getRoleDisplayName(user.role)}. To complete your account setup, please verify your email address by visiting:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create a CareLinkMN account, you can safely ignore this email.
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
    const title = "Password Reset Request";
    
    const content = `
      <h2>Hello ${user.firstName},</h2>
      <p>We received a request to reset the password for your CareLinkMN account (<strong>${user.email}</strong>).</p>
      
      <div class="warning-box">
        <strong>Important Security Information:</strong>
        <ul>
          <li>This link will expire in 1 hour</li>
          <li>Only use this link if you requested the password reset</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
      </div>
      
      <p>If you're having trouble accessing your account or didn't request this reset, please contact our support team.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: resetUrl,
      actionLabel: "Reset Password",
      themeColor: "#DC2626", // Red for security actions
      previewText: "We received a request to reset your password.",
      footerText: `For security reasons, this link will expire in 1 hour. If you're having trouble, copy this link: ${resetUrl}`
    });

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
    const title = "🎉 Welcome to CareLinkMN!";
    const dashboardUrl = `${this.baseUrl}/${this.getDashboardPath(user.role)}`;
    
    const content = `
      <h2>Hello ${user.firstName},</h2>
      <p>Congratulations! Your CareLinkMN account has been successfully verified${organization ? ` for <strong>${organization.name}</strong>` : ""}. You're now part of Minnesota's premier care coordination network.</p>
      
      ${this.getWelcomeContentByRole(user.role)}
      
      <div class="info-box">
        <h3>🚀 Getting Started Tips</h3>
        <ul>
          <li>Complete your profile to maximize your visibility</li>
          <li>Explore the platform features in your dashboard</li>
          <li>Check out our help documentation</li>
        </ul>
      </div>
      
      <p>Thank you for joining CareLinkMN. Together, we're improving care coordination across Minnesota!</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: dashboardUrl,
      actionLabel: "Go to Your Dashboard",
      themeColor: "#059669", // Green for welcome/success
      previewText: "Your account is now active and ready to use."
    });

    const text = `
      Welcome to CareLinkMN!
      
      Hello ${user.firstName},
      
      Congratulations! Your CareLinkMN account has been successfully verified${organization ? ` for ${organization.name}` : ""}.
      
      Access your dashboard at: ${dashboardUrl}
      
      ${this.getWelcomeTextContentByRole(user.role)}
      
      Thank you for joining CareLinkMN!
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
    const title = "Organization Verification Needed";
    
    const content = `
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
      
      <p><strong>Verification Timeline:</strong><br>
      Our team will review your organization details within 48 hours. You'll receive an email confirmation once verification is complete.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: `${this.baseUrl}/organization/verification`,
      actionLabel: "Complete Verification",
      themeColor: "#D97706", // Amber for warning/action needed
      previewText: "Complete your organization setup to access all features."
    });

    const text = `
      Organization Verification Needed - CareLinkMN
      
      Hello ${user.firstName},
      
      Your CareLinkMN account has been created, but we need to verify your organization details for ${organization.name}.
      
      Complete verification at: ${this.baseUrl}/organization/verification
      
      Our team will review your details within 48 hours.
    `;

    return { subject, html, text };
  }

  /**
   * Staff invitation email template
   */
  private getStaffInvitationTemplate(
    staffUser: User,
    inviterName: string,
    organizationName: string,
    invitationUrl: string
  ): EmailTemplate {
    const subject = `You've been invited to join ${organizationName} on CareLinkMN`;
    const title = "You've Been Invited!";
    
    const content = `
      <h2>Hello ${staffUser.firstName},</h2>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a staff member on CareLinkMN, Minnesota's premier care coordination platform.</p>
      
      <div class="info-box">
        <h3>What you'll be able to do:</h3>
        <ul>
          <li>Update facility openings and availability</li>
          <li>Respond to referral inquiries</li>
          <li>Communicate with case managers</li>
          <li>Track placement status</li>
        </ul>
      </div>
      
      <p>To get started, please set up your account by clicking the button below. You'll be asked to create a password for your account.</p>
      
      <p><strong>Important:</strong> This invitation link will expire in 24 hours.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: invitationUrl,
      actionLabel: "Accept Invitation & Set Up Account",
      previewText: `Join ${organizationName} on CareLinkMN.`,
      footerText: `If you didn't expect this invitation, you can safely ignore this email. Link: ${invitationUrl}`
    });

    const text = `
      You've Been Invited to Join ${organizationName} on CareLinkMN
      
      Hello ${staffUser.firstName},
      
      ${inviterName} has invited you to join ${organizationName} as a staff member on CareLinkMN.
      
      To get started, please set up your account by visiting:
      ${invitationUrl}
      
      This invitation link will expire in 24 hours.
    `;

    return { subject, html, text };
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
    const subject = `${data.subject} - CareLinkMN`;
    const title = data.subject;
    
    const content = `
      <h2>Hello ${data.userName},</h2>
      <div class="info-box" style="background-color: white;">
        <p>${data.message}</p>
      </div>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: data.actionUrl ? `${this.baseUrl}${data.actionUrl}` : undefined,
      actionLabel: "View Details",
      previewText: data.message.substring(0, 100) + "..."
    });

    const text = `
      ${data.subject}
      
      Hello ${data.userName},
      
      ${data.message}
      
      ${data.actionUrl ? `View details: ${this.baseUrl}${data.actionUrl}` : ""}
    `;

    return { subject, html, text };
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
    const title = "License Expiring Soon";
    
    const content = `
      <p style="font-size: 16px;">Your license is expiring in <strong>${params.daysUntilExpiry} days</strong>.</p>
      
      <div class="info-box">
        <p style="margin: 5px 0;"><strong>License Type:</strong> ${params.licenseType}</p>
        <p style="margin: 5px 0;"><strong>License Number:</strong> ${params.licenseNumber}</p>
        <p style="margin: 5px 0;"><strong>Expiration Date:</strong> ${expirationDateStr}</p>
      </div>
      
      <p>Please renew your license to avoid service interruption. You can manage your licenses in your provider dashboard.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: `${this.baseUrl}/provider/licenses`,
      actionLabel: "Manage Licenses",
      themeColor: "#D97706", // Amber
      previewText: `Your ${params.licenseType} license expires in ${params.daysUntilExpiry} days.`
    });

    const text = `
      License Expiring Soon
      
      Your license is expiring in ${params.daysUntilExpiry} days.
      
      License Type: ${params.licenseType}
      License Number: ${params.licenseNumber}
      Expiration Date: ${expirationDateStr}
      
      Please renew your license to avoid service interruption. Manage licenses at:
      ${this.baseUrl}/provider/licenses
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
    const title = "Opening Expired";
    
    const content = `
      <p>An opening has been automatically marked as expired due to inactivity (48-hour freshness requirement).</p>
      
      <div class="info-box">
        <p style="margin: 5px 0;"><strong>Home:</strong> ${params.homeName}</p>
        <p style="margin: 5px 0;"><strong>Spots Available:</strong> ${params.spotsAvailable}</p>
      </div>
      
      <p>To reactivate this opening, please refresh it in your dashboard. This ensures that families see current availability.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: `${this.baseUrl}/provider/openings/${params.openingId}`,
      actionLabel: "View Opening",
      themeColor: "#DC2626", // Red
      previewText: "An opening has expired due to inactivity."
    });

    const text = `
      Opening Expired
      
      An opening has been automatically marked as expired due to inactivity.
      
      Home: ${params.homeName}
      Spots Available: ${params.spotsAvailable}
      
      To reactivate, refresh it in your dashboard:
      ${this.baseUrl}/provider/openings/${params.openingId}
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
    const title = "Opening Expiring Soon";
    
    const content = `
      <p>This opening will expire in <strong>${params.hoursUntilExpiry} hours</strong> if not refreshed.</p>
      
      <div class="info-box">
        <p style="margin: 5px 0;"><strong>Home:</strong> ${params.homeName}</p>
        <p style="margin: 5px 0;"><strong>Spots Available:</strong> ${params.spotsAvailable}</p>
      </div>
      
      <p>Please refresh this opening to maintain data freshness and visibility in search results.</p>
    `;

    const html = this.getLayout({
      title,
      content,
      actionUrl: `${this.baseUrl}/provider/openings/${params.openingId}`,
      actionLabel: "Refresh Opening",
      themeColor: "#D97706", // Amber
      previewText: `Opening expires in ${params.hoursUntilExpiry} hours.`
    });

    const text = `
      Opening Expiring Soon
      
      This opening will expire in ${params.hoursUntilExpiry} hours if not refreshed.
      
      Home: ${params.homeName}
      Spots Available: ${params.spotsAvailable}
      
      Refresh the opening:
      ${this.baseUrl}/provider/openings/${params.openingId}
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
}
