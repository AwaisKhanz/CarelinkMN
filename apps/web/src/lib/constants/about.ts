/**
 * About page constants
 * Company values, team info, milestones, and mission/vision
 */

import type { LucideIcon } from "lucide-react";
import { Heart, Shield, Zap, Users, Target, Globe } from "lucide-react";

export interface CompanyValue {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TeamDepartment {
  role: string;
  description: string;
}

export interface CompanyMilestone {
  year: string;
  title: string;
  description: string;
}

export interface MissionVision {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Company Values
export const COMPANY_VALUES: CompanyValue[] = [
  {
    icon: Heart,
    title: "Care-First Approach",
    description:
      "Every decision we make prioritizes the well-being of individuals seeking care and the providers serving them.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "We build trust through transparent operations, fair marketplace practices, and unwavering commitment to data security.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "We leverage cutting-edge technology to solve real problems, making care coordination faster and more efficient.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "We believe in the power of connection, bringing together families, case managers, and providers in one platform.",
  },
];

// Team Departments
export const TEAM_DEPARTMENTS: TeamDepartment[] = [
  {
    role: "Leadership",
    description:
      "Experienced healthcare and technology leaders committed to transforming care coordination.",
  },
  {
    role: "Engineering",
    description:
      "World-class developers building secure, scalable, and user-friendly solutions.",
  },
  {
    role: "Healthcare Experts",
    description:
      "Former case managers and social workers who understand the challenges firsthand.",
  },
  {
    role: "Support",
    description:
      "Dedicated team ensuring every user has the help they need to succeed.",
  },
];

// Company Milestones
export const COMPANY_MILESTONES: CompanyMilestone[] = [
  {
    year: "2024",
    title: "Platform Launch",
    description: "CareLinkMN goes live in Minnesota",
  },
  {
    year: "2024",
    title: "500+ Providers",
    description: "Reached 500 verified care providers",
  },
  {
    year: "2025",
    title: "10,000+ Placements",
    description: "Facilitated 10,000 successful care placements",
  },
  {
    year: "2025",
    title: "AI Integration",
    description: "Launched AI-powered matching and search",
  },
];

// Mission and Vision
export const MISSION: MissionVision = {
  icon: Target,
  title: "Our Mission",
  description:
    "To become Minnesota's trusted digital infrastructure for care coordination, reducing placement time from weeks to days while ensuring fair, transparent, and compliant care matching for all stakeholders.",
};

export const VISION: MissionVision = {
  icon: Globe,
  title: "Our Vision",
  description:
    "A future where every Minnesotan has instant access to appropriate, high-quality care through a transparent, technology-enabled marketplace that serves families, providers, and care coordinators equally.",
};

// Problem Statement
export const PROBLEM_STATEMENT = {
  title: "The Problem We Solve",
  description:
    "Before CareLinkMN, finding appropriate care in Minnesota was a fragmented, time-consuming process. Families spent weeks calling facilities, case managers relied on outdated spreadsheets, and providers struggled to fill openings efficiently.",
  statistics: [
    {
      icon: "TrendingUp",
      label: "70% Slower",
      description: "Traditional placement process vs. CareLinkMN",
    },
    {
      icon: "Users",
      label: "Fragmented",
      description: "No single source of truth for availability",
    },
    {
      icon: "Shield",
      label: "Compliance Risk",
      description: "Manual processes prone to errors",
    },
  ],
} as const;

// Solution Highlights
export const SOLUTION_HIGHLIGHTS = [
  {
    icon: Zap,
    title: "Speed",
    features: [
      "Sub-1 second search results",
      "Real-time availability updates",
      "Instant messaging and coordination",
    ],
  },
  {
    icon: Shield,
    title: "Security",
    features: [
      "HIPAA-compliant infrastructure",
      "PHI minimization by design",
      "Immutable audit logging",
    ],
  },
  {
    icon: Heart,
    title: "Quality",
    features: [
      "AI-powered matching",
      "Verified provider credentials",
      "Fair, transparent marketplace",
    ],
  },
] as const;
