import { Request, Response } from "express";
import { z } from "zod";

/**
 * Contact form submission schema
 */
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  organization: z.string().optional(),
  role: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Submit contact form
 * POST /api/contact/submit
 */
export const submitContactForm = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = contactFormSchema.parse(req.body);

    // TODO: In production, you would:
    // 1. Save to database
    // 2. Send email notification to support team
    // 3. Send confirmation email to user
    // 4. Create a support ticket in your system

    // For now, just log the submission
    console.log("Contact form submission:", {
      ...validatedData,
      submittedAt: new Date().toISOString(),
    });

    // Simulate email sending (replace with actual email service)
    // await sendEmail({
    //   to: 'support@carelinkmn.com',
    //   subject: `New Contact Form Submission from ${validatedData.name}`,
    //   body: `
    //     Name: ${validatedData.name}
    //     Email: ${validatedData.email}
    //     Organization: ${validatedData.organization || 'N/A'}
    //     Role: ${validatedData.role || 'N/A'}
    //     Message: ${validatedData.message}
    //   `
    // });

    res.status(200).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you within 24 hours.",
      data: {
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Contact form submission error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit contact form. Please try again later.",
    });
  }
};
