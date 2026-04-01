# Profile/Compte Section - Minimal Implementation Analysis

**Current Date**: April 1, 2026  
**Status**: Read-Only Dashboard  
**Priority**: HIGH - Core UX feature

---

## Current Implementation Status

### What Exists ✅
The profile section at `/compte` currently shows:

1. **Dashboard Stats** (Read-Only Display Only)
   - Total simulations count
   - Total documents generated
   - Total cases ("dossiers")
   - Verification requests count
   - Evidence artifacts count
   - Journal entries count
   - Calculated seniority (from first simulation)
   - SMIG compliance status

2. **Recent Activity Feed** (Read-Only)
   - Last 10 items across simulations, documents, cases
   - Clickable links to view details
   - Status badges by type
   - Date formatting

3. **Case Management Shortcuts** (Read-Only)
   - Show latest 4 cases
   - Link to detailed case view
   - Case status display

4. **Navigation Shortcuts** (To Other Pages)
   - Verification management
   - Protection snapshot
   - Payslip detector
   - Violations journal

5. **Session Management**
   - Logout button
   - Session status display

### What's Missing ❌ (13 Critical Gaps)

---

## 1. PERSONAL PROFILE INFORMATION - NOT IMPLEMENTED

### Missing Features
- [ ] First name editing
- [ ] Last name editing
- [ ] Email display and verification
- [ ] Phone number field
- [ ] Region/Location field
- [ ] Employment status display (CDI/CDD/Freelance)
- [ ] Company name storage
- [ ] Job position field
- [ ] Avatar/Profile picture upload

### Impact
**User can't:**
- Update personal information
- Verify email address
- Store employment context
- Display profile to others

### Example Data Model (Should Exist)
```typescript
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  region?: string;
  zone?: string;
  employmentStatus?: 'CDI' | 'CDD' | 'internship' | 'freelance';
  companyName?: string;
  jobPosition?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Current workaround**: Data stored only in `user_journey_context` (localStorage only, not persistent)

---

## 2. ACCOUNT SETTINGS - NOT IMPLEMENTED

### Missing Features
- [ ] Email address management
- [ ] Email change with verification
- [ ] Email notification preferences per type
- [ ] Default language selection (FR/AR)
- [ ] Theme preference (light/dark)
- [ ] Timezone preference
- [ ] Auto-save toggle
- [ ] Data export frequency preference

### Current UI/UX Issue
Theme and language are controlled only through:
- Context providers (global state)
- No persistence to user account
- Loss on logout/new session
- Forced to select every session

### Missing Code
```typescript
// No endpoint exists: /api/user/settings/update
// No component: <UserSettingsForm />
// No preferences storage in database
```

---

## 3. SECURITY SETTINGS - NOT IMPLEMENTED

### Missing Features
- [ ] Password change functionality
- [ ] Password strength indicator
- [ ] Current password verification
- [ ] New password confirmation
- [ ] Password expiry indicator
- [ ] Two-factor authentication (2FA) setup
- [ ] Backup codes for 2FA
- [ ] Login activity history
- [ ] Active sessions list
- [ ] Session termination controls
- [ ] Device management
- [ ] Security questions setup

### Current Issue
**User can only logout**, no ability to:
- Change weak passwords
- Enable security features
- View who accessed their account
- Manage active sessions
- Identify suspicious activity

### Regression Risk
If password is compromised, user has NO way to update it without admin help.

---

## 4. NOTIFICATION PREFERENCES - NOT IMPLEMENTED

### Missing Features
- [ ] Email notification toggle
- [ ] SMS notification option
- [ ] In-app notification toggle
- [ ] Notification categories:
  - Account security alerts
  - Verification completion
  - Document generation alerts
  - Case status updates
  - Journal reminders
  - Session timeouts
- [ ] Notification frequency (daily digest, real-time, weekly)
- [ ] Do Not Disturb hours
- [ ] Unsubscribe links
- [ ] Email notification templates preview

### Impact
Users can't control inbox spam or critical alerts.

---

## 5. DATA MANAGEMENT - NOT IMPLEMENTED

### Missing Features
- [ ] **Export Data** (GDPR requirement)
  - Download all personal data as JSON/CSV
  - Export simulations history
  - Export documents generated
  - Export cases and timeline
  
- [ ] **Data Deletion** (Right to be forgotten)
  - Delete account option (soft/hard)
  - Bulk delete simulations
  - Bulk delete documents
  - Graceful account deactivation

- [ ] **Data Download**
  - Bulk PDF generation
  - Case dossier export as ZIP
  - Timeline export
  - Statistics export

- [ ] **Account Deactivation**
  - Temporary deactivation option
  - Scheduled deletion (30-day notice)
  - Download data before deletion

### Compliance Gap
**Missing GDPR Article 15-20 compliance:**
- Right to access ❌
- Right to deletion ❌  
- Right to data portability ❌
- Right to object ❌

---

## 6. BILLING/SUBSCRIPTION (If Applicable) - NOT IMPLEMENTED

### Missing Features (Future)
- [ ] Subscription tier display
- [ ] Renewal date
- [ ] Payment method management
- [ ] Invoice history
- [ ] Upgrade/downgrade options
- [ ] Billing address
- [ ] Tax ID for companies
- [ ] Receipt downloads

---

## 7. PREFERENCES - PARTIALLY IMPLEMENTED

### What We Have
```typescript
// In user-journey-context.ts
UserPreferences {
  language: 'fr' | 'ar';
  theme: 'light' | 'dark';
  notifications: boolean;
  autoSave: boolean;
}
```

### What's Missing
- ❌ **No UI to edit preferences** - No settings form component
- ❌ **No database persistence** - Only in localStorage
- ❌ **No API endpoints** - `/api/user/preferences` missing
- ❌ **No preference validation** - Unvalidated state
- ❌ **No preference sync** - Lost across sessions/devices
- ❌ **No preference history** - No audit trail

### Current Issue
```typescript
// Theme change code in theme-provider.tsx
const [theme, setTheme] = useState('light');
// Sets in localStorage only - lost on logout!
// No call to /api/user/preferences/update
```

---

## 8. PROFILE DISPLAY/COMPLETENESS - MINIMAL

### Missing Features
- [ ] Profile completion percentage
- [ ] Missing required fields indicator
- [ ] Guided profile setup flow (onboarding)
- [ ] Profile visibility settings
- [ ] Public profile URL (if B2B feature)
- [ ] Professional summary
- [ ] Skills/expertise tags
- [ ] Endorsements/verification badges

### Current Display
Just stats and history - no actual profile card with:
- Name
- Email
- Avatar
- Current employment
- Account age
- Verification status

---

## 9. DOCUMENT PREFERENCES - NOT IMPLEMENTED

### Missing Features
- [ ] Default document language (FR/AR)
- [ ] Default document format preference
- [ ] Document signature preference
- [ ] Contact info auto-fill for documents
- [ ] Default company field binding
- [ ] Auto-generate copies preference

---

## 10. COMMUNICATION PREFERENCES - NOT IMPLEMENTED

### Missing Features
- [ ] Newsletter subscription
- [ ] Product update frequency
- [ ] Law changes notification
- [ ] New feature announcement preference
- [ ] Survey/feedback request frequency
- [ ] Marketing communication opt-out
- [ ] SMS preference (if applicable)

---

## 11. ACCESSIBILITY PREFERENCES - NOT IMPLEMENTED

### Missing Features
- [ ] Font size adjustment
- [ ] High contrast mode
- [ ] Screen reader optimization
- [ ] Dyslexia-friendly font option
- [ ] Keyboard navigation preference
- [ ] Animation reduction toggle
- [ ] Color blind mode

---

## 12. API KEYS / INTEGRATIONS - NOT IMPLEMENTED

### Missing Features (If Applicable)
- [ ] API key generation
- [ ] API key management
- [ ] Rate limit viewing
- [ ] Integration logs
- [ ] Webhook management
- [ ] OAuth app management

---

## 13. ACCOUNT DELETION / HISTORY - MINIMAL

### What's Missing
- ❌ **Account deletion with confirmation**
- ❌ **Data retention period display**
- ❌ **Deletion consequences warning**
- ❌ **Scheduled deletion (GDPR 30-day notice)**
- ❌ **Cancellation reason collection**
- ❌ **Account reactivation window**

---

## UI/UX ASSESSMENT

### Current State
```
/compte
├── Header with logout button (minimal)
├── Stats grid (read-only)
├── Recent activity feed (read-only)  
├── Case shortcuts (read-only)
└── Navigation links (to other sections)

TOTAL: 0 editable fields, 0 forms, 0 settings
```

### What's Needed
```
/compte (Dashboard - DONE ✅)
├── /compte/settings (MISSING ❌)
│   ├── Personal Information (form)
│   ├── Email & Communication
│   ├── Security Settings
│   ├── Privacy & Data
│   └── Preferences
├── /compte/security (MISSING ❌)
│   ├── Change Password
│   ├── Two-Factor Auth
│   ├── Login History
│   └── Active Sessions
├── /compte/preferences (MISSING ❌)
│   ├── Language/Theme
│   ├── Notifications
│   ├── Accessibility
│   └── Document Defaults
└── /compte/data (MISSING ❌)
    ├── Export Data
    ├── Download Records
    └── Delete Account
```

---

## CRITICAL BUGS IN CURRENT IMPLEMENTATION

### Bug #1: No Error Handling on Settings Save
**File**: [src/app/compte/page.tsx](src/app/compte/page.tsx#L170)
```typescript
async function logoutUserSession() {
  // ... logout code
  const response = await fetch("/api/user/session", { method: "DELETE" });
  const data = (await response.json()) as { ok?: boolean };
  if (!response.ok || !data.ok) {
    setSessionStatus(t("accountPage.sessionDenied"));
    return;  // But logout continues anyway!
  }
```

### Bug #2: Preferences Lost on Every Session
**File**: [src/lib/context/user-journey-context.ts](src/lib/context/user-journey-context.ts)
```typescript
// Only stored in localStorage, not persisted to database
const loadContext = (): UserJourneyContext => {
  if (typeof window === 'undefined') return defaultContext;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultContext, ...JSON.parse(stored) } : defaultContext;
  } catch {
    return defaultContext;
  }
};
// No sync to /api/user/preferences
```

### Bug #3: Theme Provider Has No Persistence
**File**: [src/components/theme-provider.tsx](src/components/theme-provider.tsx)
```typescript
const [theme, setTheme] = useState('light');
// Sets localStorage but:
// 1. No validation
// 2. No server sync
// 3. Lost on logout
// 4. Not tied to user account
```

---

## IMPLEMENTATION ROADMAP

### Phase 1 - CRITICAL (Week 1-2)
**Must Have for MVP Profile**

1. **Create User Profile Table**
   - firstName, lastName, email, phone, region
   - avatar_url, employment_status, company_name
   - timestamps and audit fields

2. **Add Settings Form Component**
   - Personal info editor
   - Email change with verification
   - Language/theme toggle with persistence
   - Submit and error handling

3. **Create Settings API Endpoints**
   - `PATCH /api/user/profile` - Update profile
   - `PATCH /api/user/preferences` - Update preferences
   - `PATCH /api/user/email` - Change email with verification

4. **Build Settings Page**
   - `/compte/settings` route
   - Personal information section
   - Preferences section
   - Basic form validation

### Phase 2 - HIGH (Week 3-4)
**Essential for Security**

1. **Password Management**
   - `PATCH /api/user/password` endpoint
   - Password change form with strength indicator
   - Current password verification
   - Confirmation step

2. **Login History & Sessions**
   - GET `/api/user/sessions` - List active sessions
   - DELETE `/api/user/sessions/{id}` - Terminate session
   - Login history display
   - Geographic location of logins

3. **Two-Factor Authentication**
   - Setup 2FA form
   - TOTP generation
   - Backup codes display and download
   - Disable 2FA with confirmation

4. **Security Settings Page**
   - `/compte/security` route
   - Password change form
   - 2FA toggle
   - Login history timeline
   - Active sessions management

### Phase 3 - MEDIUM (Week 5-6)
**Compliance & Features**

1. **Data Export (GDPR)**
   - POST `/api/user/export` - Trigger export
   - GET `/api/user/export-status` - Check status
   - Download exported data as JSON/CSV
   - Schedule regular exports

2. **Account Deletion**
   - DELETE `/api/user/account` - Delete account (with password confirmation)
   - Soft delete vs hard delete strategy
   - 30-day grace period
   - Data retention policy

3. **Notification Preferences**
   - Preferences form with toggles
   - Category-based notifications
   - Frequency selection
   - Test notification button

4. **Data Management Page**
   - `/compte/data` route
   - Export section
   - Download records
   - Delete data options

### Phase 4 - NICE TO HAVE (Week 7+)
**Enhanced Experience**

1. Accessibility preferences
2. Communication preferences
3. Profile completion score
4. Social features (if applicable)
5. Activity logs
6. API key management

---

## DATABASE SCHEMA NEEDED

```sql
-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMP,
  phone_number TEXT,
  region TEXT,
  employment_status TEXT, -- 'CDI', 'CDD', etc.
  company_name TEXT,
  job_position TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table  
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'fr',
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  marketing_emails_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_name TEXT,
  location TEXT,
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Login history
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN,
  reason TEXT, -- for failed logins
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## MIGRATION PATH

### For Existing Users
- Create default profile records with email
- Migrate preferences from localStorage to database
- Set seniority calculation on first load
- No user action required

### For New Users
- Create profile during signup
- Ask for firstName/lastName in onboarding
- Set preferences during account creation
- Display profile completion percentage

---

## ESTIMATED IMPLEMENTATION TIME

| Feature | Effort | Time |
|---------|--------|------|
| Database schema | Small | 2 hours |
| API endpoints (CRUD) | Medium | 6 hours |
| Settings form component | Medium | 4 hours |
| Settings page layout | Small | 2 hours |
| Password change | Medium | 4 hours |
| 2FA setup | Large | 8 hours |
| Login history | Small | 3 hours |
| Data export (GDPR) | Large | 8 hours |
| Account deletion | Medium | 4 hours |
| Notification preferences | Medium | 5 hours |

**Total: ~46 hours (~1 week at 50% capacity)**

---

## CHECKLIST FOR COMPLETE PROFILE SYSTEM

- [ ] User profile table created
- [ ] User preferences table created
- [ ] Sessions/login history tables
- [ ] Profile edit endpoint (API)
- [ ] Preferences update endpoint (API)
- [ ] Password change endpoint (API)
- [ ] Email change endpoint (API)
- [ ] 2FA setup endpoint (API)
- [ ] Login history endpoint (API)
- [ ] Session termination endpoint (API)
- [ ] Data export endpoint (API)
- [ ] Account deletion endpoint (API)
- [ ] Settings form component built
- [ ] Security settings page built
- [ ] Data management page built
- [ ] Notification preferences form
- [ ] Error handling on all forms
- [ ] Loading states on submissions
- [ ] Success/error notifications
- [ ] Input validation
- [ ] Type safety (no `any` types)
- [ ] Tests for critical paths
- [ ] Documentation

---

## RECOMMENDATIONS

**Priority 1 (Do First):**
1. Add user profile table - stores personal info
2. Create settings form - edit name, email, language
3. Add profile edit endpoint - PATCH /api/user/profile
4. Build /compte/settings page - minimal but complete

**Priority 2 (This Sprint):**
1. Password change functionality
2. Session management display
3. Prefer persistent preferences to localStorage

**Priority 3 (Before Production):**
1. GDPR data export
2. Account deletion with safeguards
3. Two-factor authentication

