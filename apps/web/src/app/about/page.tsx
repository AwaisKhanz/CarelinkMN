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
  Heart,
  TrendingUp,
  Users,
  Shield,
  CheckCircle,
  Sparkles,
  Target,
  Globe,
  Zap,
  Award,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  COMPANY_VALUES,
  TEAM_DEPARTMENTS,
  COMPANY_MILESTONES,
  MISSION,
  VISION,
  PROBLEM_STATEMENT,
  SOLUTION_HIGHLIGHTS,
} from "@/lib/constants/about";

export default function AboutPage() {
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
          <div className="text-center max-w-4xl mx-auto mb-20">
            <Badge variant="healthcarePrimary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              About Us
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Transforming Care Coordination in Minnesota
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              CareLinkMN is Minnesota's premier digital platform connecting
              families, case managers, and care providers through intelligent,
              real-time coordination.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <Card variant="healthcare" className="p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-4">{MISSION.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {MISSION.description}
              </CardDescription>
            </Card>

            <Card variant="healthcareSuccess" className="p-8">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl mb-4">{VISION.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {VISION.description}
              </CardDescription>
            </Card>
          </div>

          {/* Values */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Values
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {COMPANY_VALUES.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <Card key={idx} variant="healthcare" className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg mb-3">
                      {value.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {value.description}
                    </CardDescription>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* The Problem We Solve */}
          <div className="mb-20">
            <Card variant="healthcareInfo" className="p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  The Problem We Solve
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Before CareLinkMN, finding appropriate care in Minnesota was
                  a fragmented, time-consuming process. Families spent weeks
                  calling facilities, case managers relied on outdated
                  spreadsheets, and providers struggled to fill openings
                  efficiently.
                </p>
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">70% Slower</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Traditional placement process vs. CareLinkMN
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">Fragmented</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No single source of truth for availability
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Compliance Risk</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manual processes prone to errors
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Our Solution */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Solution
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A comprehensive platform that brings everyone together
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card variant="healthcare" className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-3">Speed</CardTitle>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Sub-1 second search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Real-time availability updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Instant messaging and coordination</span>
                  </li>
                </ul>
              </Card>

              <Card variant="healthcareSuccess" className="p-8">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-xl mb-3">Security</CardTitle>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>HIPAA-compliant infrastructure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>PHI minimization by design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Immutable audit logging</span>
                  </li>
                </ul>
              </Card>

              <Card variant="healthcareInfo" className="p-8">
                <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-info" />
                </div>
                <CardTitle className="text-xl mb-3">Quality</CardTitle>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>AI-powered matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Verified provider credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Fair, transparent marketplace</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Team */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Team
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Passionate professionals dedicated to improving care coordination
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {TEAM_DEPARTMENTS.map((dept, idx) => (
                <Card key={idx} variant="healthcare" className="p-6">
                  <CardTitle className="text-lg mb-3">{dept.role}</CardTitle>
                  <CardDescription className="text-sm">
                    {dept.description}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Journey
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Key milestones in our mission to transform care coordination
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {COMPANY_MILESTONES.map((milestone, idx) => (
                <Card key={idx} variant="healthcare" className="p-6">
                  <Badge variant="healthcarePrimary" className="mb-4">
                    {milestone.year}
                  </Badge>
                  <CardTitle className="text-lg mb-2">
                    {milestone.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {milestone.description}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card variant="healthcare" className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Join Us in Transforming Care
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're a family seeking care, a provider offering
              services, or a care coordinator, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="healthcare" asChild>
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
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
