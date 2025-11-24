"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  CheckCircle,
  ArrowRight,
  Star,
  Activity,
  MessageSquare,
  BarChart3,
  Target,
  Clock,
  MapPin,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getDashboardPath } from "@/lib/routing";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-background">
          <div className="healthcare-container relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-background/50 backdrop-blur-sm border-border text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <Zap className="w-4 h-4 fill-current text-primary" />
                <span>Now serving 500+ Minnesota organizations</span>
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                Care Coordination, <br />
                <span className="text-primary">Simplified.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                Connect families, case managers, and providers through intelligent, 
                payer-aware search with real-time availability tracking.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 shadow-sm hover:shadow-md transition-all"
                    asChild
                  >
                    <Link href={user ? getDashboardPath(user.role) : "/search"}>
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="text-lg px-8 py-6 shadow-sm hover:shadow-md transition-all"
                      asChild
                    >
                      <Link href="/auth/signup">
                        Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6 hover:bg-muted/50"
                      asChild
                    >
                      <Link href="/search">
                        Browse Providers
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>AI Matching</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 bg-background">
          <div className="healthcare-container">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Everything you need to coordinate care
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built specifically for Minnesota's unique healthcare ecosystem with compliance and efficiency at its core.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Large Feature - Search */}
              <Card className="md:col-span-2 bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Lightning-Fast Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg mb-6">
                    Find the perfect placement in milliseconds. Our search engine filters by payer, location, care needs, and real-time availability.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span>Sub-1s response</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>48h freshness</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Geo-location</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>Payer matching</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature - AI Matching */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">AI-Powered Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Smart algorithms analyze care needs and provider capabilities to suggest the highest-probability matches instantly.
                  </p>
                </CardContent>
              </Card>

              {/* Feature - Real-time */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">Real-Time Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No more calling around. Providers update their openings instantly, so you only see what's actually available.
                  </p>
                </CardContent>
              </Card>

              {/* Large Feature - Security */}
              <Card className="md:col-span-2 bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Enterprise-Grade Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg mb-6">
                    Your data is protected by industry-leading security measures, fully HIPAA compliant, with immutable audit logs and row-level security.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">SOC 2 Ready</Badge>
                    <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">HIPAA Compliant</Badge>
                    <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">End-to-End Encryption</Badge>
                    <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">Audit Logging</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-24 bg-background">
          <div className="healthcare-container">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Tailored for every role
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Whether you're seeking care or providing it, we have tools designed specifically for your workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  title: "For Families",
                  desc: "Find the perfect care facility with transparency and ease.",
                },
                {
                  icon: Heart,
                  title: "For Case Managers",
                  desc: "Streamline placements and manage referrals efficiently.",
                },
                {
                  icon: Building2,
                  title: "For Providers",
                  desc: "Fill openings faster and manage your facilities.",
                },
                {
                  icon: Smartphone,
                  title: "For Social Workers",
                  desc: "Facilitate urgent hospital discharges in record time.",
                }
              ].map((item, i) => (
                <div key={i} className="group p-6 rounded-2xl border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-300">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-background">
          <div className="healthcare-container">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                About CareLinkMN
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transforming care coordination in Minnesota through intelligent technology and a commitment to better outcomes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To streamline the placement process for Minnesota's most vulnerable populations by connecting case managers, hospital social workers, and care providers in a real-time, transparent marketplace.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    A healthcare ecosystem where no patient languishes in a hospital bed unnecessarily and every care facility operates at optimal capacity, improving outcomes for all Minnesotans.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Innovation</h3>
                <p className="text-sm text-muted-foreground">Leveraging AI and real-time data to solve complex coordination challenges.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Trust</h3>
                <p className="text-sm text-muted-foreground">Building a secure, compliant platform that prioritizes patient privacy.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Community</h3>
                <p className="text-sm text-muted-foreground">Fostering collaboration across the entire continuum of care.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-background border-y border-border">
          <div className="healthcare-container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl lg:text-5xl font-bold text-foreground">500+</div>
                <div className="text-muted-foreground font-medium">Organizations</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl lg:text-5xl font-bold text-foreground">10k+</div>
                <div className="text-muted-foreground font-medium">Providers</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl lg:text-5xl font-bold text-foreground">50k+</div>
                <div className="text-muted-foreground font-medium">Placements</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl lg:text-5xl font-bold text-foreground">&lt;1s</div>
                <div className="text-muted-foreground font-medium">Search Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-background">
          <div className="healthcare-container">
            <div className="bg-card rounded-3xl p-8 md:p-16 text-center space-y-8 border border-border shadow-sm">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground max-w-2xl mx-auto">
                Ready to transform your care coordination?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of organizations already using CareLinkMN to deliver better care, faster.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/auth/signup">
                    Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/contact">
                    Contact Sales
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
