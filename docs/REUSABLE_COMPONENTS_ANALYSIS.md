# Reusable Components Analysis & Recommendations

## Executive Summary

After reviewing all dashboards and complete pages across the CareLinkMN platform, I've identified **significant opportunities** for creating reusable components that will improve code maintainability, consistency, and developer productivity.

**Key Findings:**
- ✅ Some reusable components already exist (StatsCard, DataTable, BulkActionsToolbar, SearchFilterBar)
- ❌ Many patterns are duplicated across dashboards with slight variations
- 🔄 Consolidation opportunities exist in filters, headers, empty states, loading states, error states
- 🎨 Status badges, date formatting, and action menus could be standardized
- 📊 Dashboard-specific components that could become generic

---

## 📋 Component Categories

### 1. **Dashboard & Page Layout Components**

#### 1.1 Page Header Component
**Current State:** Duplicated across many pages with similar patterns
**Examples:**
- `apps/web/src/app/case-manager/(dashboard)/referrals/components/referrals-header.tsx`
- Similar headers in provider, admin, hospital-sw, vrs dashboards

**Recommended Component:**
```typescript
// apps/web/src/components/shared/page-header.tsx
<PageHeader
  title="My Cases"
  description="Manage your referrals and placements"
  actions={[
    { label: "New Referral", onClick: () => router.push("/create"), icon: Plus },
    { label: "Refresh", onClick: handleRefresh, variant: "outline" }
  ]}
  loading={isRefreshing}
/>
```

**Benefits:**
- Consistent header styling across all pages
- Standardized action button patterns
- Reusable loading states
- Accessibility built-in

---

#### 1.2 Stats Grid Component
**Current State:** Multiple implementations with slight variations
**Examples:**
- `AdminStatsGrid` (supports trends, icons)
- `HospitalSWStatsGrid` (uses StatsCard)
- `ReferralsStats` (specific layout)
- Manual stats cards in dashboards

**Recommended Component:**
```typescript
// apps/web/src/components/shared/stats-grid.tsx
<StatsGrid
  stats={[
    { label: "Total", value: 100, icon: Users, description: "+12%", trend: { value: "+12%", isPositive: true } },
    { label: "Active", value: 50, icon: CheckCircle, valueClassName: "text-success" }
  ]}
  columns={4} // Responsive: 1 on mobile, 2 on tablet, 4 on desktop
  variant="healthcare"
/>
```

**Benefits:**
- Single source of truth for stats display
- Consistent responsive behavior
- Supports trends, icons, custom styling
- Works across all dashboards

---

### 2. **Data Display Components**

#### 2.1 Enhanced DataTable Wrapper
**Current State:** Good base component, but many wrappers add similar logic
**Examples:**
- `ReferralsTable`, `JobsTable`, `ClientsTable`, `EmployersTable` all have similar patterns

**Recommended Enhancement:**
```typescript
// apps/web/src/components/shared/data-table-wrapper.tsx
<DataTableWrapper
  title="Referrals"
  description="Manage your referrals"
  columns={columns}
  data={data}
  isLoading={isLoading}
  pagination={pagination}
  onPageChange={handlePageChange}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  filters={<ReferralsFilters {...filterProps} />}
  emptyState={{
    icon: FileText,
    title: "No referrals found",
    description: "Get started by creating your first referral",
    action: { label: "Create Referral", onClick: () => router.push("/create") }
  }}
  bulkActions={selectedItems.length > 0 ? [
    { label: "Delete", onClick: handleBulkDelete, variant: "destructive" },
    { label: "Export", onClick: handleBulkExport }
  ] : []}
  headerActions={[
    { label: "New", onClick: () => router.push("/create"), icon: Plus }
  ]}
/>
```

**Benefits:**
- Encapsulates common table patterns
- Handles loading, empty, error states
- Built-in bulk actions support
- Consistent filter integration

---

#### 2.2 List Item Card Component
**Current State:** Many custom card components for list items
**Examples:**
- `UrgentCaseCard`, `ReferralKanbanCard`, Recent items in dashboards

**Recommended Component:**
```typescript
// apps/web/src/components/shared/list-item-card.tsx
<ListItemCard
  title="Referral #12345"
  subtitle="Client: J.D. • Age 75"
  badges={[
    { label: "URGENT", variant: "healthcareError" },
    { label: "NEW", variant: "healthcarePrimary" }
  ]}
  metadata={[
    { icon: Calendar, text: "Target: Mar 15, 2024" },
    { icon: MapPin, text: "Minneapolis, MN" }
  ]}
  actions={[
    { label: "View", onClick: handleView },
    { label: "Edit", onClick: handleEdit }
  ]}
  onClick={handleClick}
  variant="healthcare"
/>
```

**Benefits:**
- Consistent list item styling
- Flexible badge and metadata display
- Built-in action menu
- Click handling for navigation

---

### 3. **Status & Badge Components**

#### 3.1 Smart Status Badge
**Current State:** Status badge logic duplicated across pages
**Examples:**
- `getUrgencyBadgeConfig`, `getReferralStatusBadgeConfig`, `getPlacementStatusBadgeConfig`

**Recommended Component:**
```typescript
// apps/web/src/components/shared/smart-status-badge.tsx
<SmartStatusBadge
  type="referral" // or "urgency", "placement", "opening", etc.
  status={referral.status}
  config={customConfig} // Optional override
/>

// Or with context-aware configuration:
<SmartStatusBadge
  status={status}
  variant="referral" // Uses centralized configs
/>
```

**Benefits:**
- Single source of truth for status colors/icons
- Consistent status display
- Easy to update across all pages
- Type-safe status enums

---

#### 3.2 Status Badge Config Utility
**Current State:** Multiple utility files with similar logic
**Recommended:**
```typescript
// apps/web/src/lib/utils/status-badges.ts
export const STATUS_BADGE_CONFIGS = {
  referral: {
    [ReferralStatus.NEW]: { label: "New", variant: "healthcarePrimary", icon: Clock },
    [ReferralStatus.PLACED]: { label: "Placed", variant: "healthcareSuccess", icon: CheckCircle },
    // ... all statuses
  },
  urgency: {
    [Urgency.URGENT]: { label: "Urgent", variant: "healthcareError", icon: AlertCircle },
    // ... all urgency levels
  },
  // ... other types
};

export function getStatusBadgeConfig(type: string, status: string) {
  return STATUS_BADGE_CONFIGS[type]?.[status] || { label: status, variant: "outline" };
}
```

---

### 4. **Filter Components**

#### 4.1 Generic Filter Bar
**Current State:** Many filter components with similar patterns
**Examples:**
- `ReferralsFilters`, `JobsFilters`, `ClientsFilters`, `UrgentCasesFilters`

**Recommended Component:**
```typescript
// apps/web/src/components/shared/filter-bar.tsx
<FilterBar
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search referrals..."
  filters={[
    {
      key: "status",
      label: "Status",
      type: "select",
      options: STATUS_OPTIONS,
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      key: "urgency",
      label: "Urgency",
      type: "select",
      options: URGENCY_OPTIONS,
      value: urgencyFilter,
      onChange: setUrgencyFilter
    },
    {
      key: "dateRange",
      label: "Date Range",
      type: "dateRange",
      value: dateRange,
      onChange: setDateRange
    }
  ]}
  onClear={() => {
    setSearchQuery("");
    setStatusFilter("all");
    setUrgencyFilter("all");
  }}
/>
```

**Benefits:**
- Consistent filter UI across all pages
- Supports multiple filter types (select, dateRange, multiselect)
- Built-in clear functionality
- Responsive design

---

### 5. **Empty, Loading & Error States**

#### 5.1 Unified Empty State
**Current State:** Multiple empty state components per dashboard
**Examples:**
- `AdminEmptyState`, `HospitalSWEmptyState`, `VRSEmptyState`, `ProviderEmptyState`, `PublicEmptyState`

**Recommended Component:**
```typescript
// apps/web/src/components/shared/empty-state.tsx
<EmptyState
  icon={FileText}
  title="No referrals found"
  description={searchQuery 
    ? "Try adjusting your search or filters"
    : "Get started by creating your first referral"
  }
  action={!searchQuery ? {
    label: "Create Referral",
    onClick: () => router.push("/create"),
    icon: Plus
  } : undefined}
  variant="healthcare"
/>
```

**Benefits:**
- Single component for all empty states
- Consistent styling and messaging
- Context-aware descriptions
- Optional action buttons

---

#### 5.2 Unified Loading State
**Current State:** Multiple loading state components
**Examples:**
- `AdminLoadingState`, `CaseManagerLoadingState`, `ProviderLoadingState`, `VRSEmptyState`, etc.

**Recommended Component:**
```typescript
// apps/web/src/components/shared/loading-state.tsx
<LoadingState
  message="Loading referrals..."
  fullHeight={true}
  variant="healthcare"
/>

// With skeleton support:
<LoadingState
  type="skeleton"
  skeletonConfig={{
    rows: 10,
    columns: 5,
    showHeader: true
  }}
/>
```

**Benefits:**
- Consistent loading indicators
- Optional skeleton screens
- Configurable messages
- Full-height support

---

#### 5.3 Unified Error State
**Current State:** Multiple error state components
**Examples:**
- `AdminErrorState`, `CaseManagerErrorState`, `ProviderErrorState`, `VRSErrorState`, etc.

**Recommended Component:**
```typescript
// apps/web/src/components/shared/error-state.tsx
<ErrorState
  title="Error Loading Dashboard"
  message="Failed to load dashboard data"
  description="Please try refreshing the page or contact support if the issue persists."
  action={{
    label: "Retry",
    onClick: handleRetry,
    variant: "healthcare"
  }}
  variant="healthcare"
/>
```

**Benefits:**
- Consistent error handling UI
- Standardized retry actions
- User-friendly error messages
- Support for multiple error types

---

### 6. **Action & Menu Components**

#### 6.1 Action Menu Component
**Current State:** Dropdown menus duplicated across pages
**Examples:**
- Action menus in tables for view, edit, delete, etc.

**Recommended Component:**
```typescript
// apps/web/src/components/shared/action-menu.tsx
<ActionMenu
  actions={[
    { label: "View", icon: Eye, onClick: handleView },
    { label: "Edit", icon: Edit, onClick: handleEdit },
    { type: "separator" },
    { label: "Delete", icon: Trash2, onClick: handleDelete, variant: "destructive" }
  ]}
  align="end"
/>
```

**Benefits:**
- Consistent action menu styling
- Type-safe action definitions
- Built-in separators and variants
- Accessibility support

---

#### 6.2 Quick Actions Card
**Current State:** Similar quick action cards in dashboards
**Examples:**
- Quick actions in case manager, provider, admin dashboards

**Recommended Component:**
```typescript
// apps/web/src/components/shared/quick-actions-card.tsx
<QuickActionsCard
  title="Quick Actions"
  description="Common tasks"
  actions={[
    { label: "Create Referral", icon: Plus, onClick: () => router.push("/create"), variant: "healthcare" },
    { label: "Search Providers", icon: Search, onClick: () => router.push("/search"), variant: "healthcareSecondary" }
  ]}
/>
```

**Benefits:**
- Consistent quick action UI
- Flexible action definitions
- Icon support
- Healthcare variant styling

---

### 7. **Alert & Notification Components**

#### 7.1 Alert Card Component
**Current State:** Alert cards duplicated across dashboards
**Examples:**
- Expiring openings, licenses, subscription warnings

**Recommended Component:**
```typescript
// apps/web/src/components/shared/alert-card.tsx
<AlertCard
  variant="warning" // warning, error, info, success
  title="3 Openings Expiring Soon"
  description="These openings will expire within 12 hours. Refresh them to keep them active."
  items={expiringOpenings.slice(0, 3).map(opening => ({
    label: opening.home?.name || "Unknown Home",
    subtitle: `${opening.spotsAvailable} spots available`,
    action: { label: "View", onClick: () => router.push(`/openings/${opening.id}`) }
  }))}
  action={{
    label: "Manage Openings",
    onClick: () => router.push("/openings")
  }}
/>
```

**Benefits:**
- Consistent alert styling
- Support for item lists
- Built-in action buttons
- Multiple variants

---

### 8. **Date & Time Components**

#### 8.1 Smart Date Display
**Current State:** Inconsistent date formatting across pages
**Examples:**
- `format(new Date(...), "MMM d, yyyy")` repeated everywhere
- `formatDistanceToNow` used inconsistently

**Recommended Component:**
```typescript
// apps/web/src/components/shared/smart-date.tsx
<SmartDate
  date={referral.createdAt}
  format="relative" // "relative", "short", "long", "dateOnly", "timeOnly", "dateTime"
/>

// Examples:
<SmartDate date={date} format="relative" /> // "2 hours ago"
<SmartDate date={date} format="short" /> // "Mar 15, 2024"
<SmartDate date={date} format="long" /> // "March 15, 2024 at 3:45 PM"
```

**Benefits:**
- Consistent date formatting
- Configurable formats
- Relative time support
- Timezone handling

---

### 9. **Detail Page Components**

#### 9.1 Detail Page Header
**Current State:** Similar detail headers across pages
**Examples:**
- `AdminDetailHeader`, `ProviderDetailHeader`, `VRSDetailHeader`

**Recommended Component:**
```typescript
// apps/web/src/components/shared/detail-header.tsx
<DetailHeader
  title={referral.referralNumber}
  subtitle={`Client: ${referral.clientInitials} • Age ${referral.clientAge}`}
  badges={[
    { type: "referral", status: referral.status },
    { type: "urgency", status: referral.urgency }
  ]}
  breadcrumbs={[
    { label: "Referrals", href: "/referrals" },
    { label: referral.referralNumber }
  ]}
  actions={[
    { label: "Edit", icon: Edit, onClick: handleEdit },
    { label: "Delete", icon: Trash2, onClick: handleDelete, variant: "destructive" }
  ]}
  metadata={[
    { label: "Created", value: <SmartDate date={referral.createdAt} format="long" /> },
    { label: "Status", value: <SmartStatusBadge type="referral" status={referral.status} /> }
  ]}
/>
```

**Benefits:**
- Consistent detail page headers
- Built-in breadcrumbs
- Action menu integration
- Metadata display

---

#### 9.2 Detail Section Card
**Current State:** Similar section cards in detail pages
**Examples:**
- Client info cards, care needs cards, placement cards

**Recommended Component:**
```typescript
// apps/web/src/components/shared/detail-section-card.tsx
<DetailSectionCard
  title="Client Information"
  icon={Users}
  fields={[
    { label: "Name", value: referral.clientInitials },
    { label: "Age", value: `${referral.clientAge} years` },
    { label: "Gender", value: referral.clientGender }
  ]}
  actions={[
    { label: "Edit", onClick: handleEdit }
  ]}
/>
```

**Benefits:**
- Consistent section styling
- Flexible field display
- Optional actions
- Icon support

---

### 10. **Kanban Board Components**

#### 10.1 Generic Kanban Board
**Current State:** Custom kanban implementation for referrals
**Examples:**
- `ReferralsKanban`, custom kanban logic

**Recommended Component:**
```typescript
// apps/web/src/components/shared/kanban-board.tsx
<KanbanBoard
  columns={[
    { id: "NEW", title: "New", status: ReferralStatus.NEW },
    { id: "IN_REVIEW", title: "In Review", status: ReferralStatus.IN_REVIEW },
    // ...
  ]}
  items={referrals}
  onItemMove={handleItemMove}
  renderCard={(item) => <ReferralKanbanCard referral={item} />}
  onCardClick={handleCardClick}
/>
```

**Benefits:**
- Reusable kanban logic
- Drag-and-drop support
- Flexible card rendering
- Works with any data type

---

## 📊 Priority Recommendations

### **High Priority (Implement First)**
1. ✅ **PageHeader Component** - Used on every page
2. ✅ **Unified Empty/Loading/Error States** - Reduces code duplication significantly
3. ✅ **SmartStatusBadge Component** - Used extensively across all pages
4. ✅ **FilterBar Component** - Duplicated in many list pages
5. ✅ **StatsGrid Component** - Consolidate existing implementations

### **Medium Priority**
6. **DataTableWrapper** - Enhance existing DataTable
7. **ActionMenu Component** - Standardize action menus
8. **SmartDate Component** - Consistent date formatting
9. **AlertCard Component** - Dashboard alert patterns
10. **DetailHeader Component** - Detail page consistency

### **Low Priority**
11. **ListItemCard Component** - Specific use cases
12. **QuickActionsCard Component** - Dashboard-specific
13. **DetailSectionCard Component** - Detail page sections
14. **GenericKanbanBoard** - When needed for other entities

---

## 🎯 Implementation Strategy

### Phase 1: Foundation (Week 1)
1. Create `apps/web/src/components/shared/` directory
2. Implement PageHeader component
3. Consolidate Empty/Loading/Error states
4. Create SmartStatusBadge component
5. Create FilterBar component

### Phase 2: Data Display (Week 2)
1. Enhance DataTable with wrapper
2. Create StatsGrid component
3. Create ActionMenu component
4. Create SmartDate component

### Phase 3: Dashboard Components (Week 3)
1. Create AlertCard component
2. Create QuickActionsCard component
3. Create DetailHeader component
4. Create DetailSectionCard component

### Phase 4: Migration (Week 4)
1. Migrate one dashboard at a time
2. Update all pages to use new components
3. Remove old duplicate components
4. Update documentation

---

## 📝 Component Structure

```
apps/web/src/components/
├── shared/                    # NEW: Shared reusable components
│   ├── page-header.tsx
│   ├── stats-grid.tsx
│   ├── filter-bar.tsx
│   ├── data-table-wrapper.tsx
│   ├── smart-status-badge.tsx
│   ├── smart-date.tsx
│   ├── action-menu.tsx
│   ├── empty-state.tsx
│   ├── loading-state.tsx
│   ├── error-state.tsx
│   ├── alert-card.tsx
│   ├── quick-actions-card.tsx
│   ├── list-item-card.tsx
│   ├── detail-header.tsx
│   ├── detail-section-card.tsx
│   ├── kanban-board.tsx
│   └── index.ts
├── ui/                        # EXISTING: Base UI components
├── forms/                     # EXISTING: Form components
├── auth/                      # EXISTING: Auth components
└── ...
```

---

## ✅ Benefits Summary

1. **Code Reduction**: ~30-40% reduction in duplicate code
2. **Consistency**: Unified UI patterns across all dashboards
3. **Maintainability**: Single source of truth for common patterns
4. **Developer Experience**: Faster page development with reusable components
5. **Accessibility**: Built-in accessibility features
6. **Performance**: Optimized components with proper memoization
7. **Type Safety**: TypeScript interfaces for all components
8. **Testing**: Easier to test reusable components

---

## 🔄 Next Steps

1. Review this analysis and prioritize components
2. Create component specifications for each component
3. Implement components one by one in priority order
4. Migrate existing pages to use new components
5. Update documentation and create Storybook stories

