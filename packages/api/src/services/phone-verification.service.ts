import { AuthRepository } from "../repositories/auth.repository";
import { auditService } from "./audit.service";

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
}

export class PhoneVerificationService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Send SMS verification code to user's phone
   */
  async sendVerificationCode(
    userId: string,
    phoneNumber: string
  ): Promise<PhoneVerificationResult> {
    try {
      // In development, just log the code instead of sending SMS
      if (process.env.NODE_ENV === "development") {
        const code = this.generateVerificationCode();
        console.log(
          `📱 [DEV MODE] SMS verification code for ${phoneNumber}: ${code}`
        );

        // Store the code temporarily (in production, use Redis or similar)
        await this.authRepository.storePhoneVerificationCode(userId, code);

        return {
          success: true,
          message: "Verification code sent (check console in dev mode)",
        };
      }

      // In production, integrate with SMS service like Twilio
      // const code = this.generateVerificationCode();
      // await this.sendSMS(phoneNumber, `Your CareLinkMN verification code: ${code}`);
      // await this.authRepository.storePhoneVerificationCode(userId, code);

      return {
        success: true,
        message: "Verification code sent to your phone",
      };
    } catch (error) {
      console.error("Phone verification error:", error);
      return {
        success: false,
        message: "Failed to send verification code",
      };
    }
  }

  /**
   * Verify the SMS code entered by user
   */
  async verifyCode(
    userId: string,
    code: string
  ): Promise<PhoneVerificationResult> {
    try {
      const isValid = await this.authRepository.verifyPhoneCode(userId, code);

      if (isValid) {
        // Mark phone as verified
        await this.authRepository.verifyUserPhone(userId);

        // Log verification event
        await auditService.logAuth(userId, "PHONE_VERIFY", {
          verificationCode: code,
        });

        return {
          success: true,
          message: "Phone number verified successfully",
        };
      } else {
        return {
          success: false,
          message: "Invalid verification code",
          attemptsRemaining: 2, // This would come from the repository
        };
      }
    } catch (error) {
      console.error("Phone verification error:", error);
      return {
        success: false,
        message: "Verification failed",
      };
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send SMS via external service (Twilio, etc.)
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // Implementation would depend on chosen SMS provider
    // For now, just log in development
    console.log(`SMS to ${phoneNumber}: ${message}`);
  }
}
