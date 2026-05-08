# CRITICAL ISSUES - IMMEDIATE ACTION REQUIRED

## Summary
Found **13 major issue categories** across the app with **30+ specific problems** requiring fixes.

---

## 🔴 CRITICAL ISSUES (Fix Before Production)

### 1. Console Logging in Production (7 instances)
**Files**: contracts page, user-journey-context, suggested-companies-store, moderation-queue
**Action**: Remove all console.log/warn/error statements
**Est. Time**: 15 minutes

### 2. Type Safety with `any` (7+ instances + 6 disabled rules)
**Files**: document-prefilling, contracts validation, SafeImage component, multiple stores
**Action**: Replace `any` with proper TypeScript interfaces
**Est. Time**: 45 minutes

### 3. Unhandled Promise Rejections (3+ instances)
**Files**: admin-shell, document-generator, site-nav
**Issues**:
- `admin-shell.tsx` logout has zero error handling
- `site-nav.tsx` .then().then() with no .catch()
- Multiple async operations without proper error handling
**Action**: Add proper try-catch or .catch() handlers
**Est. Time**: 20 minutes

---

## 🟠 HIGH PRIORITY (Fix This Week)

### 4. Generic Error Messages (7+ instances)
**Issue**: User sees "purge_failed", "moderation_save_failed" instead of helpful messages
**Action**: Create error translation layer
**Est. Time**: 30 minutes

### 5. Performance Regressions
- Missing React.memo on SafeImage component
- Manual image placeholders instead of Next.js Image optimization
- No lazy loading or responsive images
- Ad slot with inefficient ResizeObserver
**Action**: 
  - Wrap image components with React.memo
  - Use Next.js Image component properly
  - Optimize ad slot observer
**Est. Time**: 1 hour

### 6. Incomplete Implementations
- Clipboard copy feedback never clears
- No loading skeleton for images
- No retry logic for API calls
- Missing Error Boundaries
**Action**: Complete UI patterns
**Est. Time**: 1 hour

---

## 🟡 MEDIUM PRIORITY (This Sprint)

### 7. Async/Await Issues
- Missing catch blocks in try statements (5+ instances)
- No response.ok checks (multiple cases)
- Unsafe JSON type casting
**Action**: Add proper error handling
**Est. Time**: 45 minutes

### 8. Missing Loading States
- Logout redirects instantly without feedback
- No user indication during async operations
**Action**: Add loading states to all async operations
**Est. Time**: 30 minutes

---

## FILES REQUIRING IMMEDIATE ATTENTION

| File | Issues | Severity |
|------|--------|----------|
| src/components/admin-shell.tsx | No error handling on logout | 🔴 Critical |
| src/components/site-nav.tsx | Promise chain with no .catch() | 🔴 Critical |
| src/components/home-page-client.tsx | `any` type, unoptimized images | 🔴 Critical |
| src/components/document-generator-client.tsx | Incomplete error handling | 🔴 Critical |
| src/lib/document-prefilling.ts | Multiple `any` types | 🔴 Critical |
| src/lib/server/verification-store.ts | `any` type with disabled eslint | 🟠 High |
| src/components/company-context-card.tsx | Silent API failures | 🟠 High |
| src/components/ad-slot.tsx | Inefficient ResizeObserver | 🟠 High |

---

## REGRESSION RISKS

### High Risk Areas
1. **Error handling paths** - Silent failures will cause data loss
2. **Type safety** - Type mismatches will crash in production
3. **Async operations** - Unhandled rejections can crash the app

### Testing Before Deployment
```
- [ ] Test logout flow with network failure
- [ ] Test document save with timeout
- [ ] Test company search with 404 response
- [ ] Test with DevTools Network throttling
- [ ] Check console for errors (should be clean)
```

---

## RECOMMENDED FIX ORDER

1. **Today** - Remove console statements (15 min)
2. **Today** - Fix admin-shell logout error handling (10 min)  
3. **Today** - Fix site-nav promise chain (10 min)
4. **This Sprint** - Replace `any` types with interfaces (45 min)
5. **This Sprint** - Add .catch() to all promises (30 min)
6. **This Sprint** - Performance optimization (1 hour)
7. **Next Sprint** - Complete UI patterns (1+ hours)

---

## ESTIMATED TOTAL FIX TIME
- Quick Wins (< 1 hour): ~30 minutes
- Critical Fixes (1-2 hours): ~1.5 hours
- High Priority (today-week): ~3 hours
- Medium Priority (this sprint): ~2 hours

**Total: 6.5 hours across team**

---

## VERIFICATION CHECKLIST

- [ ] No console.log/warn/error in production build
- [ ] All fetch responses check .ok status
- [ ] All promises have .catch() handlers
- [ ] All `any` types replaced with interfaces
- [ ] Error messages are user-friendly
- [ ] Loading states show for all async operations
- [ ] Images lazy load and are optimized
- [ ] No unhandled promise rejections in DevTools
- [ ] Error Boundaries prevent full page crashes

