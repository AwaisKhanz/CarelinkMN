# Missing Pages Analysis

**Review Date:** January 2025  
**Status:** Analysis Complete

---

## Pages Referenced But Missing

### 1. `/provider/residents` - ⚠️ **REFERENCED BUT MISSING**

**References:**
- `apps/web/src/app/provider/(dashboard)/dashboard/page.tsx` - Line 931: Button links to `/provider/residents`
- `apps/web/src/app/provider/(dashboard)/layout.tsx` - Line 47: Comment mentions `/provider/residents`
- `apps/web/src/components/layout/sidebar.tsx` - Line 142: Permission `canViewResidents` exists
- Sidebar navigation does NOT include residents link (not added to nav items)

**Status:** 
- ❌ Page file does not exist at `/provider/(dashboard)/residents/page.tsx`
- ✅ Directory exists but is empty
- ✅ Permission check exists (`canViewResidents`)
- ⚠️ Referenced from dashboard but not in sidebar

**PRD Requirements:**
- PRD mentions "Track placement metrics" for providers
- PRD mentions "Residents" may be related to placements
- Not explicitly required in PRD but logically needed

**Recommendation:** 
- Create residents page for provider to manage current residents
- OR remove the button from dashboard if residents are managed through placements
- **Action Required:** Decide if residents page is needed

---

### 2. `/provider/availability` - ⚠️ **REFERENCED BUT MISSING**

**References:**
- `apps/web/src/app/provider/(dashboard)/layout.tsx` - Line 48: Comment mentions `/provider/availability`
- Sidebar navigation does NOT include availability link

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ❌ Not referenced in sidebar or actual code

**PRD Requirements:**
- PRD mentions "Opening management with Kanban" - this is at `/provider/openings`
- Availability may be managed through openings page
- Not explicitly required in PRD

**Recommendation:**
- Remove directory or redirect to openings page
- **Action Required:** Remove empty directory or create redirect

---

### 3. `/vendor/dashboard` - ⚠️ **DUPLICATE ROUTE**

**References:**
- `apps/web/src/app/vendor/onboarding/page.tsx` - Lines 112, 165: Redirects to `/vendor/dashboard`
- `apps/web/src/lib/routing.ts` - Line 26: Returns `/vendor/dashboard`
- `apps/web/src/components/auth/route-guard.tsx` - Lines 59, 149: References `/vendor/dashboard`
- `apps/web/src/middleware.ts` - Line 78: References `/vendor/dashboard`

**Status:**
- ❌ Empty directory at `/vendor/dashboard/`
- ✅ Actual dashboard exists at `/vendor/(dashboard)/dashboard/page.tsx`
- ⚠️ References point to `/vendor/dashboard` but actual route is `/vendor/(dashboard)/dashboard`

**PRD Requirements:**
- Dashboard is required for vendors
- Current implementation at `/vendor/(dashboard)/dashboard/page.tsx` is correct

**Recommendation:**
- Update all references from `/vendor/dashboard` to `/vendor/(dashboard)/dashboard`
- OR remove the route group and use `/vendor/dashboard` directly
- **Action Required:** Fix route references

---

### 4. `/hospital-sw/analytics` - ⚠️ **API REFERENCE BUT NO PAGE**

**References:**
- `apps/web/src/lib/api/services/discharge-case.service.ts` - Line 173: API endpoint `/api/hospital-sw/analytics`
- Sidebar navigation does NOT include analytics link

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ✅ Backend API endpoint exists
- ❌ Not in sidebar navigation

**PRD Requirements:**
- PRD doesn't explicitly require analytics page for Hospital SW
- Analytics may be displayed on dashboard instead

**Recommendation:**
- Create analytics page if needed
- OR remove empty directory if analytics are only on dashboard
- **Action Required:** Decide if analytics page is needed

---

### 5. `/case-manager/analytics` - ⚠️ **NOT REFERENCED**

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ❌ Not referenced anywhere
- ❌ Not in sidebar navigation

**PRD Requirements:**
- PRD doesn't explicitly require analytics page for Case Managers

**Recommendation:**
- Remove empty directory
- **Action Required:** Remove directory

---

### 6. `/case-manager/clients` - ⚠️ **NOT REFERENCED**

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ❌ Not referenced anywhere
- ❌ Not in sidebar navigation

**PRD Requirements:**
- PRD mentions "referrals" not "clients" for Case Managers

**Recommendation:**
- Remove empty directory
- **Action Required:** Remove directory

---

### 7. `/hospital-sw/patients` - ⚠️ **NOT REFERENCED**

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ❌ Not referenced anywhere
- ❌ Not in sidebar navigation

**PRD Requirements:**
- PRD mentions "discharges" not separate "patients" page

**Recommendation:**
- Remove empty directory
- **Action Required:** Remove directory

---

### 8. `/hospital-sw/placements` - ⚠️ **NOT REFERENCED**

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ❌ Not referenced anywhere
- ❌ Not in sidebar navigation

**PRD Requirements:**
- Placements may be part of discharges

**Recommendation:**
- Remove empty directory
- **Action Required:** Remove directory

---

### 9. `/search` (root level) - ⚠️ **NOT REFERENCED**

**Status:**
- ❌ Page file does not exist
- ✅ Directory exists but is empty
- ✅ Public search is at `/public/search`
- ⚠️ Default fallback in sidebar points to `/search` (line 367)

**References:**
- `apps/web/src/components/layout/sidebar.tsx` - Line 367: Default fallback uses `/search`

**Recommendation:**
- Update sidebar default to `/public/search`
- Remove empty directory
- **Action Required:** Fix sidebar default and remove directory

---

## Summary of Actions Required

### High Priority

1. **Fix `/vendor/dashboard` route references**
   - Update all references from `/vendor/dashboard` to match actual route
   - OR update route structure to use `/vendor/dashboard` directly

2. **Create `/provider/residents` page OR remove dashboard button**
   - Decide if residents page is needed
   - Either create the page or remove the button from dashboard

3. **Fix sidebar default route**
   - Update default fallback from `/search` to `/public/search`

### Medium Priority

4. **Create `/hospital-sw/analytics` page OR remove directory**
   - Decide if analytics page is needed for Hospital SW
   - Either create page or remove directory

### Low Priority (Cleanup)

5. **Remove unused empty directories:**
   - `/case-manager/(dashboard)/analytics/`
   - `/case-manager/(dashboard)/clients/`
   - `/hospital-sw/(dashboard)/patients/`
   - `/hospital-sw/(dashboard)/placements/`
   - `/provider/(dashboard)/availability/`
   - `/search/` (root level)

---

## Recommendations

1. **Immediate Actions:**
   - Fix vendor dashboard route references (high priority - affects redirects)
   - Fix sidebar default search route (high priority - affects navigation)
   - Decide on residents page for providers

2. **Cleanup Actions:**
   - Remove all unused empty directories
   - Verify all route references are correct

3. **Future Enhancements:**
   - Consider adding analytics pages for Case Manager and Hospital SW if needed
   - Consider adding residents page for providers if needed

