# CareLinkMN - Product Requirements Document (PRD)

## Version: 1.0.0
## Date: January 2025
## Status: Ready for Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Vision & Objectives](#product-vision--objectives)
3. [Target Users & Personas](#target-users--personas)
4. [Core Features & Functionality](#core-features--functionality)
5. [User Stories & Requirements](#user-stories--requirements)
6. [Success Metrics & KPIs](#success-metrics--kpis)
7. [Constraints & Assumptions](#constraints--assumptions)
8. [Risks & Mitigation](#risks--mitigation)

---

## Executive Summary

CareLinkMN is a comprehensive care coordination platform designed specifically for Minnesota's healthcare ecosystem. The platform connects families seeking care, case managers coordinating services, hospital discharge planners, and licensed care providers through an intelligent, payer-aware search system with real-time availability tracking.

### Key Value Propositions
- **Sub-1 second search performance** with accurate, payer-aware results
- **Real-time availability tracking** with 48-hour freshness enforcement
- **Secure, HIPAA-compliant** referral and document exchange
- **AI-powered matching** for optimal care placement
- **Fair, transparent marketplace** with bounded paid boosts and anti-gaming measures

---

## Product Vision & Objectives

### Vision Statement
To become Minnesota's trusted digital infrastructure for care coordination, reducing placement time from weeks to days while ensuring fair, transparent, and compliant care matching for all stakeholders.

### Strategic Objectives

#### 1. Speed & Efficiency
- Reduce average time-to-placement by 70%
- Achieve sub-1 second search response times
- Enable same-day referral initiation
- Automate 80% of routine coordination tasks

#### 2. Quality & Trust
- Maintain 99.9% uptime for critical workflows
- Ensure 100% payer accuracy in search results
- Achieve 90%+ AI parsing accuracy for natural language queries
- Implement immutable audit logging for all PHI access

#### 3. Fairness & Transparency
- Enforce 48-hour freshness for all availability data
- Cap maximum paid boost influence on rankings
- Implement diversity caps (max 2 listings per org in top 10)
- Clearly label all sponsored content

#### 4. Scalability & Growth
- Support 10,000+ concurrent users
- Handle 1M+ searches per month
- Process 50,000+ referrals monthly
- Maintain performance at 10x current load

---

## Target Users & Personas

### 1. Public Users / Families
**Primary Needs:**
- Find appropriate care quickly
- Understand payer acceptance
- Compare facilities and services
- Contact providers directly

**Key Features:**
- Public search with filters
- Provider profiles with photos
- Save favorites functionality
- Referral handoff to case managers

### 2. Provider Organizations
**Primary Needs:**
- Manage multiple facilities
- Update availability in real-time
- Receive qualified referrals
- Track placement metrics

**Key Features:**
- Multi-home management
- Services mapping interface
- Opening management with Kanban
- Analytics dashboard
- Messaging center

### 3. Case Managers (CM)
**Primary Needs:**
- Find appropriate placements quickly
- Manage multiple referrals
- Communicate with providers
- Track placement pipeline

**Key Features:**
- AI-assisted search (CareBot Pro)
- Referral creation and management
- Batch outreach capabilities
- Pipeline Kanban view
- Export functionality

### 4. Hospital Social Workers (SW)
**Primary Needs:**
- Facilitate urgent discharges
- Match complex medical needs
- Coordinate with providers
- Arrange transportation

**Key Features:**
- Discharge intake forms
- AI-powered matching
- Provider invitation system
- NEMT booking
- Follow-up checklists

### 5. System Administrators
**Primary Needs:**
- Verify licenses and credentials
- Monitor compliance
- Track platform metrics
- Support users

**Key Features:**
- Approval workflows
- License verification
- Compliance monitoring
- Analytics dashboards
- Audit log access

### 6. VRS Specialists
**Primary Needs:**
- Match clients with employers
- Track job placements
- Monitor retention metrics
- Manage employer relationships

**Key Features:**
- Client management
- Job matching interface
- Employer CRM
- Retention analytics

### 7. Marketplace Vendors
**Primary Needs:**
- List services/products
- Receive qualified leads
- Manage bookings (NEMT)
- Track performance

**Key Features:**
- Vendor profiles
- Lead management
- Booking queue (NEMT)
- Analytics access

---

## Core Features & Functionality

### 1. Search & Discovery

#### Public Search Engine
- **Performance**: Sub-1 second response time (p95)
- **Filters**: 
  - Location (County/City/ZIP + radius)
  - License types with sub-categories
  - Service types (controlled vocabulary)
  - Payer acceptance (MA, Medicare, Private, CADI, BI/TBI, EW, DD)
  - Accessibility features
  - Availability (Open-only toggle)
- **Results**: 
  - 20 results per page
  - Grid/List/Map views
  - Deep-link safe URLs
  - Verified/New badges

#### AI-Powered Search (CareBot)
- Natural language to structured filters
- 90%+ accuracy on MN-specific vocabulary
- Rate limiting: 10 queries/min/user
- Graceful fallback to manual filters

### 2. Provider Management

#### Multi-Site Architecture
- Organization-level account with multiple homes
- Service selection at org and home levels
- Centralized billing and analytics
- Role-based access for staff

#### Availability Management
- Real-time opening updates
- 48-hour freshness enforcement
- Kanban board (Open/Pending/Filled)
- Atomic placement decrements

### 3. Referral & Coordination

#### Referral Creation
- De-identified client profiles
- Payer requirement enforcement
- Provider shortlisting
- Batch outreach capabilities

#### Messaging System
- Thread-based conversations
- Attachment support (signed URLs)
- Read receipts
- SLA tracking badges

### 4. Hospital Discharge

#### Intake & Matching
- Versioned consent capture
- Minimal PHI collection
- AI-powered provider matching
- "Why this match" explanations

#### Provider Coordination
- 48-hour invitation expiry
- Automatic reminders at 24 hours
- Escalation to alternates
- NEMT booking integration

### 5. Compliance & Security

#### Data Protection
- Row-level security (RLS)
- PHI minimization
- Signed URLs with TTL
- Immutable audit logs

#### License Management
- Automated expiry tracking
- 30/7 day reminder emails
- Verification workflows
- Compliance reporting

### 6. Analytics & Reporting

#### Provider Analytics
- Views → Inquiries → Placements funnel
- Fill time metrics
- Response time tracking
- Payer mix analysis

#### Platform Analytics
- Coverage heatmaps
- User engagement metrics
- Revenue tracking
- Performance monitoring

### 7. Marketplace & Monetization

#### Vendor Directory
- Category-based organization
- Sponsored placement options
- Lead generation (non-clinical only)
- Performance tracking

#### Subscription Tiers
- **Free**: Basic listing, 1 photo, 10 services
- **Pro**: Enhanced visibility, 5 photos, analytics
- **Premium**: Maximum boost, priority support

---

## User Stories & Requirements

### Epic 1: Public Search & Discovery

**US-001**: As a family member, I want to search for care facilities near my location so that I can find appropriate care for my loved one.
- **Acceptance Criteria**:
  - Search returns results in < 1 second
  - Results are sorted by relevance and distance
  - Filters work correctly (AND across groups, OR within)
  - Deep links preserve search state

**US-002**: As a public user, I want to see which payers a facility accepts so that I know if they match my coverage.
- **Acceptance Criteria**:
  - Payer information is prominently displayed
  - Open-only filter respects payer requirements
  - Results only show facilities accepting selected payers

### Epic 2: Provider Operations

**US-010**: As a provider, I want to map services to specific homes so that users see accurate information about what each location offers.
- **Acceptance Criteria**:
  - Checkbox UI for service selection
  - Services persist between sessions
  - Home-level overrides org-level defaults
  - Bulk operations available

**US-011**: As a provider, I want to manage openings so that families see current availability.
- **Acceptance Criteria**:
  - Openings update in real-time
  - 48-hour freshness enforcement works
  - Placements decrement atomically
  - Kanban view functions correctly

### Epic 3: Care Coordination

**US-020**: As a case manager, I want to create referrals with client needs so that I can find appropriate placements.
- **Acceptance Criteria**:
  - De-identified client profiles created
  - Payer information required
  - Shortlist functionality works
  - Batch messaging available

**US-021**: As a hospital social worker, I want to coordinate urgent discharges so that patients leave safely and timely.
- **Acceptance Criteria**:
  - Intake captures required information
  - AI matching returns results < 5 seconds
  - Invitation system works with timers
  - NEMT booking integrates properly

### Epic 4: Compliance & Administration

**US-030**: As an admin, I want to verify provider licenses so that only legitimate providers are listed.
- **Acceptance Criteria**:
  - Document upload and review workflow
  - Approval/rejection within 60 seconds of decision
  - Automated expiry tracking
  - Audit trail maintained

---

## Success Metrics & KPIs

### Performance Metrics
- **Search Response Time**: < 1s (p95)
- **Page Load Time**: < 2s (p90)
- **API Response Time**: < 200ms (p95)
- **Uptime**: 99.9% for critical paths

### Business Metrics
- **Monthly Active Users**: Target 50,000 by Month 6
- **Provider Adoption**: 500+ verified providers by Month 3
- **Referral Volume**: 10,000+ monthly by Month 6
- **Placement Success Rate**: > 60%

### Quality Metrics
- **AI Accuracy**: > 90% for NL parsing
- **Data Freshness**: 95% of openings < 48 hours old
- **User Satisfaction**: NPS > 50
- **Support Ticket Resolution**: < 24 hours average

### Compliance Metrics
- **License Verification Time**: < 48 hours
- **Audit Log Coverage**: 100% of PHI access
- **Consent Capture Rate**: 100% for required workflows
- **WCAG Compliance**: AA rating maintained

---

## Constraints & Assumptions

### Technical Constraints
- Must use PostgreSQL for primary database
- Limited to Railway infrastructure initially
- OpenAI API dependency for AI features
- Stripe for payment processing only

### Regulatory Constraints
- HIPAA compliance required
- Minnesota state licensing requirements
- WCAG 2.1 AA accessibility standards
- Fair marketplace regulations

### Business Constraints
- Limited marketing budget initially
- Phased rollout required
- Manual verification processes initially
- No EHR integration in Phase 1

### Assumptions
- Providers will update availability regularly
- Case managers will adopt AI tools
- Payer information is reliably available
- Users have modern browsers

---

## Risks & Mitigation

### High Priority Risks

**Risk**: Provider adoption is slower than expected
- **Impact**: Reduced value for users
- **Mitigation**: Free tier, onboarding support, import tools

**Risk**: AI accuracy below target
- **Impact**: User frustration, reduced efficiency
- **Mitigation**: Fallback UI, continuous training, manual override

**Risk**: PHI breach or compliance violation
- **Impact**: Legal liability, trust damage
- **Mitigation**: Security audits, encryption, minimal PHI policy

### Medium Priority Risks

**Risk**: Performance degradation at scale
- **Impact**: User experience decline
- **Mitigation**: Load testing, caching, database optimization

**Risk**: Gaming of ranking system
- **Impact**: Unfair marketplace
- **Mitigation**: Anti-gaming measures, monitoring, penalties

### Low Priority Risks

**Risk**: Competitor emergence
- **Impact**: Market share loss
- **Mitigation**: Fast iteration, unique features, partnerships

---

## Appendices

### A. Glossary of Terms
- **CADI**: Community Access for Disability Inclusion
- **BI/TBI**: Brain Injury / Traumatic Brain Injury
- **EW**: Elderly Waiver
- **DD**: Developmental Disabilities
- **NEMT**: Non-Emergency Medical Transportation
- **VRS**: Vocational Rehabilitation Services
- **RLS**: Row-Level Security
- **PHI**: Protected Health Information

### B. Compliance Requirements
- HIPAA Security Rule
- HIPAA Privacy Rule
- Minnesota Data Practices Act
- WCAG 2.1 Level AA
- PCI DSS (for payments)

### C. Success Criteria Summary
- All user stories completed
- Performance targets met
- Compliance verified
- Security audit passed
- User acceptance testing complete
