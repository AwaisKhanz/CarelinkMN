import { ReactNode } from "react";
import {
  Heart,
  Shield,
  Zap,
  Users,
  Building2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left Side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Right Side - Branding & Features */}
        <div className="hidden lg:flex lg:flex-1 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 healthcare-gradient opacity-90"></div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accent/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-center p-12 text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  CareLinkMN
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Minnesota's Premier Care Coordination Platform
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-6 mb-8">
              <Card variant="healthcare" className="p-6 text-left">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Lightning-Fast Search
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sub-1 second search results with advanced filtering and
                      real-time availability tracking.
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="healthcareSuccess" className="p-6 text-left">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      HIPAA Compliant
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enterprise-grade security with end-to-end encryption and
                      audit logging.
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="healthcareInfo" className="p-6 text-left">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      AI-Powered Matching
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Intelligent algorithms that consider care needs, location,
                      and payer requirements.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>500+ Organizations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>10K+ Providers</span>
                </div>
              </div>

              <Badge
                variant="healthcarePrimary"
                className="inline-flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Trusted by Minnesota Healthcare
              </Badge>
            </div>

            {/* Bottom Quote */}
            <div className="mt-12 p-6 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
              <blockquote className="text-muted-foreground italic mb-4">
                "CareLinkMN has revolutionized how we coordinate care in
                Minnesota. The platform's speed and accuracy have improved our
                placement success rate by 40%."
              </blockquote>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground text-sm">
                    Sarah Johnson
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Case Manager, HealthPartners
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
