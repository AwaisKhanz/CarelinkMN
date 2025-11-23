/**
 * Contact page constants
 * Contact methods, FAQs, and response time information
 */

import type { LucideIcon } from "lucide-react";
import { Mail, Phone, MapPin, Clock, CheckCircle, MessageSquare } from "lucide-react";

export interface ContactMethod {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  link: string | null;
}

export interface ContactFAQ {
  question: string;
  answer: string;
}

export interface ResponseTimeInfo {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Contact Methods
export const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@carelinkmn.com",
    description: "Send us an email anytime",
    link: "mailto:hello@carelinkmn.com",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "(612) 555-0100",
    description: "Mon-Fri from 8am to 6pm CST",
    link: "tel:+16125550100",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Minneapolis, MN",
    description: "123 Healthcare Ave, Suite 100",
    link: null,
  },
];

// Contact FAQs
export const CONTACT_FAQS: ContactFAQ[] = [
  {
    question: "How quickly will I get a response?",
    answer:
      "We typically respond to all inquiries within 24 hours during business days.",
  },
  {
    question: "Do you offer demos?",
    answer:
      "Yes! We'd be happy to schedule a personalized demo of the platform. Just mention it in your message.",
  },
  {
    question: "Can I schedule a call?",
    answer:
      "Absolutely. Let us know your preferred time in the message, and we'll coordinate a call.",
  },
];

// Response Time Information
export const RESPONSE_TIME_INFO: ResponseTimeInfo[] = [
  {
    icon: CheckCircle,
    title: "Email Inquiries",
    description: "Within 24 hours on business days",
  },
  {
    icon: CheckCircle,
    title: "Phone Support",
    description: "Monday-Friday, 8am-6pm CST",
  },
  {
    icon: CheckCircle,
    title: "Emergency Support",
    description: "Premium customers: 24/7 availability",
  },
];

// Contact Form Configuration
export const CONTACT_FORM_CONFIG = {
  maxMessageLength: 1000,
  requiredFields: ["name", "email", "message"],
  optionalFields: ["organization", "role"],
} as const;

// Support Links
export const SUPPORT_LINKS = {
  helpCenter: "/help",
  documentation: "/docs",
  status: "/status",
  security: "/security",
} as const;
