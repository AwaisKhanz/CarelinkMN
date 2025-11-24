"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import {
  CONTACT_METHODS,
  CONTACT_FAQS,
  RESPONSE_TIME_INFO,
} from "@/lib/constants/contact";
import { contactService } from "@/lib/api/services/contact.service";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    role: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await contactService.submitContactForm(formData);

      if (response.success) {
        toast.success("Message sent successfully!", {
          description: response.message || "We'll get back to you within 24 hours.",
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          organization: "",
          role: "",
          message: "",
        });
      } else {
        toast.error("Failed to send message", {
          description: "Please try again later.",
        });
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message", {
        description: error.response?.data?.error || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };





  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="healthcare-container py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">CareLinkMN</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button size="sm" variant="healthcare" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="healthcare-container">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge variant="healthcarePrimary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              We're Here to Help
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions about CareLinkMN? Want to schedule a demo? Our team
              is ready to assist you.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {CONTACT_METHODS.map((method, idx) => {
              const Icon = method.icon;
              return (
                <Card key={idx} variant="healthcare" className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">{method.title}</CardTitle>
                  <CardDescription className="mb-4">
                    {method.description}
                  </CardDescription>
                  {method.link ? (
                    <a
                      href={method.link}
                      className="text-primary font-semibold hover:underline"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <p className="text-foreground font-semibold">
                      {method.value}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <Card variant="healthcare" className="p-8">
              <CardHeader className="px-0 pt-0">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      placeholder="Your organization name"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organization: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Input
                      id="role"
                      placeholder="e.g., Case Manager, Provider, Family Member"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="healthcare"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ & Info */}
            <div className="space-y-8">
              <Card variant="healthcareInfo" className="p-8">
                <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-info" />
                </div>
                <CardTitle className="text-xl mb-4">
                  Response Time
                </CardTitle>
                <div className="space-y-4">
                  {RESPONSE_TIME_INFO.map((info, idx) => {
                    const Icon = info.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {info.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card variant="healthcare" className="p-8">
                <CardTitle className="text-xl mb-6">
                  Frequently Asked Questions
                </CardTitle>
                <div className="space-y-6">
                  {CONTACT_FAQS.map((faq, idx) => (
                    <div key={idx} className="space-y-2">
                      <p className="font-semibold text-foreground">
                        {faq.question}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="healthcareSuccess" className="p-8">
                <CardTitle className="text-xl mb-4">
                  Looking for Support?
                </CardTitle>
                <CardDescription className="mb-6">
                  If you're an existing user and need technical support, please
                  visit our help center or contact support directly.
                </CardDescription>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/help">Visit Help Center</Link>
                </Button>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <Card variant="healthcare" className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of organizations already using CareLinkMN to
              streamline care coordination.
            </p>
      
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="healthcare-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 CareLinkMN. All rights reserved.
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
