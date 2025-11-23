"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Building2,
  Heart,
  Shield,
  Zap,
  LogIn,
  UserPlus,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  BarChart3,
  Smartphone,
  Globe,
  Lock,
  Award,
  Target,
  TrendingUp,
  MessageSquare,
  Calendar,
  FileText,
  Activity,
  ShieldCheck,
  Briefcase,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getDashboardPath } from "@/lib/routing";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="healthcare-container py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">CareLinkMN</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#solutions"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Solutions
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="#contact"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.firstName}!
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={user ? getDashboardPath(user.role) : "/search"}>
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button size="sm" variant="healthcare" asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="healthcare-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge
                  variant="healthcareInfo"
                  className="inline-flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Sub-1 Second Search Performance
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Minnesota's Premier
                  <span className="text-primary"> Care Coordination</span>
                  Platform
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Connect families seeking care, case managers coordinating
                  services, hospital discharge planners, and licensed care
                  providers through intelligent, payer-aware search with
                  real-time availability tracking and AI-powered matching.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Button
                      size="lg"
                      variant="healthcare"
                      asChild
                      className="text-lg px-8 py-6"
                    >
                      <Link
                        href={user ? getDashboardPath(user.role) : "/search"}
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="text-lg px-8 py-6"
                    >
                      <Link href="/search">Search Providers</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant="healthcare"
                      asChild
                      className="text-lg px-8 py-6"
                    >
                      <Link href="/auth/signup">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Get Started Free
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="text-lg px-8 py-6"
                    >
                      <Link href="/auth/signin">
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>AI-Powered</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <Card variant="healthcare" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Search className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Search</h3>
                      <p className="text-sm text-muted-foreground">Find care</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-primary/20 rounded-full">
                      <div className="h-2 bg-primary rounded-full w-3/4"></div>
                    </div>
                    <div className="h-2 bg-secondary/20 rounded-full">
                      <div className="h-2 bg-secondary rounded-full w-1/2"></div>
                    </div>
                  </div>
                </Card>

                <Card variant="healthcareSuccess" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Match</h3>
                      <p className="text-sm text-muted-foreground">
                        AI powered
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-warning fill-current"
                      />
                    ))}
                  </div>
                </Card>

                <Card variant="healthcareInfo" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Connect</h3>
                      <p className="text-sm text-muted-foreground">Real-time</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">
                      Live updates
                    </span>
                  </div>
                </Card>

                <Card variant="healthcare" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Care</h3>
                      <p className="text-sm text-muted-foreground">
                        Coordinated
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Progress</span>
                      <span>100%</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="healthcare-container">
          <div className="text-center mb-16">
            <Badge variant="healthcarePrimary" className="mb-4">
              <Award className="w-4 h-4 mr-2" />
              Trusted by 500+ Organizations
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Powerful Features for Every User
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built specifically for Minnesota's care coordination needs with
              cutting-edge technology and compliance-first design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card variant="healthcare" className="p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Lightning-Fast Search
              </h3>
              <p className="text-muted-foreground mb-6">
                Sub-1 second search results with advanced filtering, real-time
                availability, and payer compatibility matching.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Sub-1 second response time (p95)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  48-hour freshness enforcement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Payer-aware results
                </li>
              </ul>
            </Card>

            <Card variant="healthcareSuccess" className="p-8">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                HIPAA Compliant
              </h3>
              <p className="text-muted-foreground mb-6">
                Enterprise-grade security with row-level security, PHI
                minimization, signed URLs, and immutable audit logs.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Row-level security (RLS)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  PHI minimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Immutable audit logs
                </li>
              </ul>
            </Card>

            <Card variant="healthcareInfo" className="p-8">
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                AI-Powered Matching
              </h3>
              <p className="text-muted-foreground mb-6">
                Intelligent matching algorithms that consider care needs,
                location, availability, and payer requirements.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Smart algorithms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Care needs analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Optimal placement
                </li>
              </ul>
            </Card>

            <Card variant="healthcareWarning" className="p-8">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Real-Time Updates
              </h3>
              <p className="text-muted-foreground mb-6">
                Real-time availability tracking with 48-hour freshness
                enforcement, instant notifications, and seamless coordination.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  48-hour freshness enforcement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Real-time updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Instant notifications
                </li>
              </ul>
            </Card>

            <Card variant="healthcare" className="p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Analytics Dashboard
              </h3>
              <p className="text-muted-foreground mb-6">
                Comprehensive analytics and reporting tools for data-driven
                decision making and performance tracking.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Performance metrics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Custom reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Data insights
                </li>
              </ul>
            </Card>

            <Card variant="healthcareError" className="p-8">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Communication Hub
              </h3>
              <p className="text-muted-foreground mb-6">
                Integrated messaging and collaboration tools for seamless
                communication between all stakeholders.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Secure messaging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  File sharing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Collaboration tools
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20">
        <div className="healthcare-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Solutions for Every Role
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tailored experiences designed for every role in Minnesota's care
              coordination ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card variant="healthcare" className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For Families
              </h3>
              <p className="text-muted-foreground mb-6">
                Find the perfect care facility for your loved one with advanced
                search, real-time availability, and comprehensive facility
                information.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Public search with filters</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Provider profiles with photos</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Save favorites functionality</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Referral handoff to case managers
                  </span>
                </li>
              </ul>
            </Card>

            <Card variant="healthcareSuccess" className="p-8 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For Case Managers
              </h3>
              <p className="text-muted-foreground mb-6">
                Streamline care coordination with AI-assisted search, referral
                management, and comprehensive tracking tools.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    AI-assisted search (CareBot Pro)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Referral creation and management
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Batch outreach capabilities</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Pipeline Kanban view</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Export functionality</span>
                </li>
              </ul>
            </Card>

            <Card variant="healthcareInfo" className="p-8 text-center">
              <div className="w-16 h-16 bg-info/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-info" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For Care Providers
              </h3>
              <p className="text-muted-foreground mb-6">
                Manage multiple facilities, update availability in real-time,
                and receive qualified referrals from case managers.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Multi-home management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Services mapping interface</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Opening management with Kanban
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Analytics dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Messaging center</span>
                </li>
              </ul>
            </Card>

            <Card variant="healthcareWarning" className="p-8 text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For Hospital Social Workers
              </h3>
              <p className="text-muted-foreground mb-6">
                Facilitate urgent discharges with AI-powered matching, provider
                invitations, and NEMT booking integration.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Discharge intake forms</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">AI-powered matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Provider invitation system</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">NEMT booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Follow-up checklists</span>
                </li>
              </ul>
            </Card>

            <Card variant="healthcare" className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For Administrators
              </h3>
              <p className="text-muted-foreground mb-6">
                Verify licenses, monitor compliance, track platform metrics, and
                support users with comprehensive admin tools.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Approval workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">License verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Compliance monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Analytics dashboards</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Audit log access</span>
                </li>
              </ul>
            </Card>

            <Card variant="healthcareSuccess" className="p-8 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For VRS Specialists
              </h3>
              <p className="text-muted-foreground mb-6">
                Match clients with employers, track job placements, and monitor
                retention metrics with dedicated VRS tools.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Client management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Job matching interface</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Employer CRM</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Retention analytics</span>
                </li>
              </ul>
            </Card>

            <Card variant="healthcareInfo" className="p-8 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                For Marketplace Vendors
              </h3>
              <p className="text-muted-foreground mb-6">
                List services, receive qualified leads, manage bookings (NEMT),
                and track performance with vendor tools.
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Vendor profiles</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Lead management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Booking queue (NEMT)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Analytics access</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="healthcare-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                500+
              </div>
              <div className="text-muted-foreground">Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-success mb-2">
                10K+
              </div>
              <div className="text-muted-foreground">Care Providers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-accent mb-2">
                50K+
              </div>
              <div className="text-muted-foreground">Successful Placements</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-info mb-2">
                &lt;1s
              </div>
              <div className="text-muted-foreground">Search Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="healthcare-container">
          <div className="text-center mb-16">
            <Badge variant="healthcarePrimary" className="mb-4">
              <Star className="w-4 h-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what our users are saying about CareLinkMN
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="healthcare" className="p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-warning fill-current"
                  />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "CareLinkMN has transformed how we coordinate care. What used
                to take weeks now takes days. The AI-powered search is
                incredibly accurate."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">
                    Case Manager, Hennepin County
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="healthcareSuccess" className="p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-warning fill-current"
                  />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "The real-time availability tracking is a game-changer. We can
                update our openings instantly and receive qualified referrals
                within hours."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">
                    Director, Sunrise Care Homes
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="healthcareInfo" className="p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-warning fill-current"
                  />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "As a hospital social worker, CareLinkMN helps me facilitate
                urgent discharges efficiently. The NEMT integration is
                fantastic."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Emily Rodriguez
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Social Worker, Mayo Clinic
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20">
        <div className="healthcare-container">
          <div className="text-center mb-16">
            <Badge variant="healthcarePrimary" className="mb-4">
              <Activity className="w-4 h-4 mr-2" />
              See It In Action
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Watch How CareLinkMN Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A quick 2-minute overview of our platform's key features
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Card variant="healthcare" className="overflow-hidden">
              <div className="aspect-video bg-muted/50 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform cursor-pointer">
                    <Activity className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Platform Demo Video
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Coming Soon - Interactive platform walkthrough
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Schedule a live demo to see CareLinkMN in action
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card variant="healthcare" className="p-6 text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">
                  Quick Setup
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get started in under 5 minutes
                </p>
              </Card>
              <Card variant="healthcareSuccess" className="p-6 text-center">
                <Users className="w-8 h-8 text-success mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">
                  Easy to Use
                </h3>
                <p className="text-sm text-muted-foreground">
                  Intuitive interface for all users
                </p>
              </Card>
              <Card variant="healthcareInfo" className="p-6 text-center">
                <Shield className="w-8 h-8 text-info mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">
                  Fully Secure
                </h3>
                <p className="text-sm text-muted-foreground">
                  HIPAA-compliant from day one
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="healthcare-container">
          <div className="text-center mb-16">
            <Badge variant="healthcarePrimary" className="mb-4">
              <MessageSquare className="w-4 h-4 mr-2" />
              FAQ
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about CareLinkMN
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card variant="healthcare" className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                How does CareLinkMN ensure data security?
              </h3>
              <p className="text-muted-foreground">
                We use enterprise-grade security with HIPAA-compliant
                infrastructure, row-level security, PHI minimization, and
                immutable audit logs. All data is encrypted in transit and at
                rest.
              </p>
            </Card>

            <Card variant="healthcare" className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                What makes CareLinkMN different from other platforms?
              </h3>
              <p className="text-muted-foreground">
                Our sub-1 second search, real-time availability tracking,
                AI-powered matching, and Minnesota-specific focus make us
                unique. We're built by care coordinators for care coordinators.
              </p>
            </Card>

            <Card variant="healthcare" className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Is there a free trial available?
              </h3>
              <p className="text-muted-foreground">
                Yes! We offer a 14-day free trial for Pro and Premium plans. No
                credit card required. The Free plan is available forever with no
                time limit.
              </p>
            </Card>

            <Card variant="healthcare" className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                How quickly can I get started?
              </h3>
              <p className="text-muted-foreground">
                Most users are up and running within 5 minutes. Simply sign up,
                complete your profile, and start searching or listing your
                facilities immediately.
              </p>
            </Card>

            <Card variant="healthcare" className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Do you offer training and support?
              </h3>
              <p className="text-muted-foreground">
                Absolutely! We provide comprehensive onboarding, video
                tutorials, documentation, and responsive email/phone support.
                Premium customers get dedicated account managers.
              </p>
            </Card>

            <Card variant="healthcare" className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Can I integrate CareLinkMN with my existing systems?
              </h3>
              <p className="text-muted-foreground">
                Yes! Premium plans include API access for custom integrations.
                We also offer pre-built integrations with popular EHR and case
                management systems.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Still have questions? We're here to help!
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="healthcare-container">
          <Card variant="healthcare" className="p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Ready to Transform Care Coordination?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of organizations already using CareLinkMN to
              streamline care coordination and improve patient outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  variant="healthcare"
                  asChild
                  className="text-lg px-8 py-6"
                >
                  <Link href={user ? getDashboardPath(user.role) : "/search"}>
                    <Search className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="healthcare"
                    asChild
                    className="text-lg px-8 py-6"
                  >
                    <Link href="/auth/signup">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Start Free Trial
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="text-lg px-8 py-6"
                  >
                    <Link href="/auth/signin">
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/50 py-12">
        <div className="healthcare-container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  CareLinkMN
                </h3>
              </div>
              <p className="text-muted-foreground">
                Minnesota's premier care coordination platform connecting
                families, case managers, and care providers.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#solutions"
                    className="hover:text-foreground transition-colors"
                  >
                    Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Status
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 CareLinkMN. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                HIPAA Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
