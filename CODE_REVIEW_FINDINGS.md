# Code Review Findings - Regressions, Minimal Implementations, and Performance Issues

**Date**: April 1, 2026  
**Scope**: Complete app review across src/ directory  
**Severity Classification**: Critical | High | Medium | Low

---

## 1. CONSOLE LOGGING IN PRODUCTION CODE 🔴 Critical

### Issue
Debug/log statements left in production code that should be removed or replaced with proper logging.

### Locations
- [src/app/contracts/page.tsx](src/app/contracts/page.tsx#L43) - `console.log("Contract preview:", preview);`
- [src/lib/context/user-journey-context.ts](src/lib/context/user-journey-context.ts#L107) - `console.warn('Failed to save user journey context:', error);`
- [src/lib/context/user-journey-context.ts](src/lib/context/user-journey-context.ts#L256) - `console.warn('Failed to add simulation to journey:', error);`
- [src/lib/context/user-journey-context.ts](src/lib/context/user-journey-context.ts#L292) - `console.warn('Failed to add document to journey:', error);`
- [src/lib/server/suggested-companies-store.ts](src/lib/server/suggested-companies-store.ts#L32) - `console.error("[suggested_companies] insert failed", error);`
- [src/lib/server/moderation-queue.ts](src/lib/server/moderation-queue.ts#L50) - `console.error("monrh moderation queue upsert failed", error);`
- [src/lib/server/moderation-queue.ts](src/lib/server/moderation-queue.ts#L84) - `console.error("monrh audit_events insert failed", error);`

### Impact
- **Data leakage**: Sensitive errors logged to client console
- **Performance**: Extra I/O in production
- **Debugging confusion**: Developers may miss real issues

### Fix
Replace with proper error tracking service (Sentry, LogRocket, etc.) or remove in production builds.

---

## 2. TYPE SAFETY - USE OF `any` TYPE 🔴 Critical

### Issue
Multiple instances of `any` type used, defeating TypeScript's type safety.

### Locations
- [src/lib/document-prefilling.ts](src/lib/document-prefilling.ts#L12) - Parameter with `any` type in conditions function
- [src/lib/document-prefilling.ts](src/lib/document-prefilling.ts#L276) - `function getNestedValue(obj: any, path: string): any`
- [src/lib/contracts/types.ts](src/lib/contracts/types.ts#L158) - Field value with `any` type
- [src/lib/contracts/validation-engine.ts](src/lib/contracts/validation-engine.ts#L89) - `getFieldValue()` returns `any`
- [src/lib/contracts/validation-engine.ts](src/lib/contracts/validation-engine.ts#L94) - `isRequiredSatisfied()` parameter `any`
- [src/lib/contracts/validation-engine.ts](src/lib/contracts/validation-engine.ts#L187) - `formatValue()` parameter `any`
- [src/components/home-page-client.tsx](src/components/home-page-client.tsx#L23) - `function SafeImage({ src, alt, className, ...props }: any)`

### Disabled Rules
- [src/lib/server/verification-store.ts](src/lib/server/verification-store.ts#L1) - `/* eslint-disable @typescript-eslint/no-explicit-any */`
- [src/lib/server/suggested-companies-store.ts](src/lib/server/suggested-companies-store.ts#L1) - `/* eslint-disable @typescript-eslint/no-explicit-any */`
- [src/lib/server/protection-store.ts](src/lib/server/protection-store.ts#L1) - `/* eslint-disable @typescript-eslint/no-explicit-any */`
- [src/lib/server/document-templates-store.ts](src/lib/server/document-templates-store.ts#L1) - `/* eslint-disable @typescript-eslint/no-explicit-any */`
- [src/lib/server/articles-store.ts](src/lib/server/articles-store.ts#L1) - `/* eslint-disable @typescript-eslint/no-explicit-any */`
- [src/lib/server/app-store.ts](src/lib/server/app-store.ts#L1) - `/* eslint-disable @typescript-eslint/no-explicit-any */`

### Impact
- **Potential runtime errors**: No compile-time type checking
- **Maintenance burden**: Future developers can't rely on types
- **Regression risk**: Refactoring becomes unsafe

### Fix
Create proper interfaces for all data structures, especially in store functions and document utilities.

---

## 3. UNHANDLED PROMISE REJECTIONS 🔴 Critical

### Issue
Promise chains with no catch handlers or improper error handling in async operations.

### Locations

#### Admin Shell - Fetch without error handling
[src/components/admin-shell.tsx](src/components/admin-shell.tsx#L24):
```typescript
await fetch("/api/user/session", { method: "DELETE" });
// No error handling, no try-catch visible
```

#### Document Generator - Silent promise failures
[src/components/document-generator-client.tsx](src/components/document-generator-client.tsx#L188-L210):
```typescript
const results = await Promise.all(
  unmatchedCompanies.map(async (entry) => {
    try {
      // ... but the entire promise chain can fail
    } catch {
      return null;
    }
  }),
);
// If Promise.all fails, where's the catch?
```

#### Site Navigation - .then without .catch
[src/components/site-nav.tsx](src/components/site-nav.tsx#L106-L108):
```typescript
.then((response) => response.json())
.then((data: { ok?: boolean; authenticated?: boolean }) => {
// No .catch() handler!
```

### Impact
- **Unhandled errors silently fail**: UX degradation without error feedback
- **Memory leaks**: Failed promises can hold state
- **Production crashes**: Uncaught rejections in some Node versions cause process termination

---

## 4. ERROR MESSAGES WITH NO USER FEEDBACK 🟠 High

### Issue
Generic error codes thrown without corresponding user-facing error messages:

### Examples
- [src/components/admin-evidence-purge-button.tsx](src/components/admin-evidence-purge-button.tsx#L28) - `throw new Error("purge_failed");`
- [src/components/admin-evidence-moderation-form.tsx](src/components/admin-evidence-moderation-form.tsx#L66) - `throw new Error("moderation_save_failed");`
- [src/components/admin-verification-decision-form.tsx](src/components/admin-verification-decision-form.tsx#L28) - `throw new Error("decision_failed");`
- [src/components/company-context-card.tsx](src/components/company-context-card.tsx#L70) - `throw new Error("company-context-unavailable");`
- [src/components/case-workflow-panel.tsx](src/components/case-workflow-panel.tsx#L133) - `throw new Error("case-update-failed");`
- [src/components/case-workflow-panel.tsx](src/components/case-workflow-panel.tsx#L232) - `throw new Error("upload-failed");`
- [src/components/simulator-tool-page.tsx](src/components/simulator-tool-page.tsx#L188) - `throw new Error("simulation-failed");`

### Impact
- Users see cryptic error codes instead of helpful messages
- Error codes not translated to FR/AR
- Difficult to debug user-facing issues

### Fix
Implement proper error translation layer mapping error codes to localized user messages.

---

## 5. PERFORMANCE ISSUES 🟠 High

### A. Missing React Memoization Opportunities
Many components re-render unnecessarily:

**Example - SafeImage component**
[src/components/home-page-client.tsx](src/components/home-page-client.tsx#L23):
```typescript
function SafeImage({ src, alt, className, ...props }: any) {
  const [hasError, setHasError] = useState(false); // Re-renders parent on every error
  // Should be wrapped with React.memo
```

**Similar patterns in:**
- [src/components/library-page-client.tsx](src/components/library-page-client.tsx#L12) - `ImagePlaceholder` component
- Multiple document and form components

### B. Image Placeholder - Not Using Next.js Image Optimization
[src/components/home-page-client.tsx](src/components/home-page-client.tsx#L11-L21):
```typescript
// Image placeholder component (manual SVG)
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br...`}>
      <svg...>
```
Missing proper image optimization, responsive images, lazy loading.

### C. Multiple Ad Slot Initializations Without Cleanup
[src/components/ad-slot.tsx](src/components/ad-slot.tsx#L60-L85):
```typescript
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // ResizeObserver polling all entries even when not needed
    if (entry.target === adNode) { ... }
  }
});
```

### D. Large Components Rendering All List Items
- Contract lists rendering without pagination
- No virtual scrolling for large datasets

### Impact
- **LCP (Largest Contentful Paint)**: Delayed
- **Memory usage**: Unnecessary DOM nodes retained
- **CPU**: Excessive re-renders

---

## 6. INCOMPLETE/MINIMAL IMPLEMENTATIONS 🟠 High

### A. Placeholder-based Image Fallback
[src/components/home-page-client.tsx](src/components/home-page-client.tsx#L22-L32):
```typescript
function SafeImage({ src, alt, className, ...props }: any) {
  // Simple fallback, but what about loading states?
  if (hasError || !src) {
    return <ImagePlaceholder className={className} />;
  }
```
**Issues**: No loading skeleton, no srcSet, no responsive images

### B. Clipboard Copy Without Feedback Duration
[src/components/document-generator-client.tsx](src/components/document-generator-client.tsx#L163-L172):
```typescript
async function copyDocument() {
  if (!ensureReady()) return;
  setCopyStatus(undefined);
  try {
    await navigator.clipboard.writeText(previewText);
    setCopyStatus(t("documentGenerator.copySuccess")); // No timeout to reset
```
**Issues**: Success message never clears; user doesn't know when to try again

### C. Form Validation - Silent Failures
[src/components/document-generator-client.tsx](src/components/document-generator-client.tsx#L187-L224]:
```typescript
const results = await Promise.all(
  unmatchedCompanies.map(async (entry) => {
    try {
      const response = await fetch("/api/reviewly/companies/resolve", {
        // No timeout handling
        // No retry logic
```

### D. Unimplemented Error Boundaries
No Error Boundary component visible for critical pages. Crashes will unmount entire page.

### Impact
- Poor UX: Users unsure if action succeeded
- Missing retry mechanisms
- No graceful degradation

---

## 7. ASYNC/AWAIT WITHOUT ERROR HANDLING 🟡 Medium

### Issue Pattern: Catch blocks missing or generic

[src/components/company-search-input.tsx](src/components/company-search-input.tsx#L71-L106):
```typescript
const fetchOptions = useCallback(async (q: string) => {
  try {
    const res = await fetch(`/api/reviewly/companies?${params.toString()}`, {
      // ...
    });
    const data = (await res.json()) as { /* types */ };
    // ...
  } finally {
    setLoading(false);
  }
  // Missing catch block!
}, []);
```

Similar patterns in:
- [src/components/company-context-card.tsx](src/components/company-context-card.tsx#L64-L81)
- [src/components/company-trust-summary.tsx](src/components/company-trust-summary.tsx#L91-L125)

### Impact
- Silent API failures
- Inconsistent loading state
- Users left wondering what happened

---

## 8. MISSING CLEANUP IN useEffects 🟡 Medium

### Issue: ResizeObserver Setup in ad-slot
[src/components/ad-slot.tsx](src/components/ad-slot.tsx#L67-L85):
```typescript
useEffect(() => {
  // ... ResizeObserver logic
  resizeObserver.observe(adNode);
  
  return () => {
    resizeObserver.disconnect();
  };
}, [adsenseClient, format, responsive, slot]);
```
**Problem**: Effect dependencies may cause multiple observers stacked

---

## 9. TYPE-UNSAFE RESPONSE PARSING 🟡 Medium

### Issue Pattern: Unsafe JSON type casts

[src/components/admin-health-check.tsx](src/components/admin-health-check.tsx#L32-L33):
```typescript
const response = await fetch("/api/health?scope=all", { cache: "no-store" });
const data = (await response.json()) as HealthPayload;
// What if JSON doesn't match HealthPayload?
```

Similar in:
- [src/components/company-context-card.tsx](src/components/company-context-card.tsx#L73)
- [src/components/company-trust-summary.tsx](src/components/company-trust-summary.tsx#L103-L104)
- [src/components/enhanced-simulator-tool-page.tsx](src/components/enhanced-simulator-tool-page.tsx#L223)

Impact: Runtime type mismatch crashes

---

## 10. MISSING RESPONSE.OK CHECKS 🟡 Medium

### Issue: Not all fetch responses check `.ok` status

[src/components/admin-shell.tsx](src/components/admin-shell.tsx#L23-L26):
```typescript
async function logout() {
  await fetch("/api/user/session", { method: "DELETE" });
  // Never checks if logout succeeded!
  window.location.href = "/";
}
```

---

## 11. HARDCODED VALUES / MAGIC NUMBERS 🟡 Medium

### Locations
- [src/components/case-workflow-panel.tsx](src/components/case-workflow-panel.tsx#L596) - "Max 10 Mo" hardcoded
- Various placeholder strings throughout form components

---

## 12. MISSING LOADING STATES 🟡 Medium

### Issue: Some async operations don't show loading indicators

[src/components/admin-shell.tsx](src/components/admin-shell.tsx#L23-L26):
```typescript
async function logout() {
  await fetch("/api/user/session", { method: "DELETE" });
  window.location.href = "/"; // Instant redirect, no loading state
}
```

---

## 13. POTENTIAL SECURITY ISSUES 🟡 Medium

### URL Encoding Inconsistency
[src/components/company-context-card.tsx](src/components/company-context-card.tsx#L68):
```typescript
const response = await fetch(`/api/reviewly/companies/${encodeURIComponent(companyId)}/context-card`);
```

But in other places:
[src/components/admin-verification-decision-form.tsx](src/components/admin-verification-decision-form.tsx#L21):
```typescript
const response = await fetch(`/api/admin/verifications/${encodeURIComponent(verificationId)}/decision`, {
```

**Issue**: Inconsistency in URL encoding approach - some use encodeURIComponent, others might not

---

## PRIORITY FIX EXECUTION PLAN

### Phase 1 - CRITICAL (Do First)
1. **Remove all console.log/warn/error** from production code
   - Replace with proper error tracking
   - Impact: High-value, quick fix

2. **Fix type safety violations**
   - Replace `any` with proper interfaces
   - Remove `eslint-disable` comments
   - Impact: Prevents future bugs

3. **Add .catch() to all promise chains**
   - Audit all .then().then() patterns
   - Impact: Prevents silent failures

### Phase 2 - HIGH (This Sprint)
4. **Implement error feedback UI**
   - Map error codes to user messages
   - Add toast notifications
   - Impact: Better UX

5. **Performance optimization**
   - Add React.memo to image components
   - Implement proper loading states
   - Impact: LCP improvement

### Phase 3 - MEDIUM (Next Sprint)
6. **Complete async/await patterns**
   - Add catch blocks to all try blocks
   - Implement retry logic
   - Impact: Resilience

7. **Add Error Boundaries**
   - Wrap critical sections
   - Impact: Production stability

---

## QUICK WINS (< 30 mins each)

- [ ] Remove console statements (15 mins)
- [ ] Fix admin logout error handling (5 mins)
- [ ] Add response.ok checks (20 mins)
- [ ] Fix site-nav promise chain (10 mins)

---

## TESTING RECOMMENDATIONS

- Add unit tests for error paths
- Add integration tests for async operations
- Simulate network failures
- Test with slow networks (Network throttle to 4G)

