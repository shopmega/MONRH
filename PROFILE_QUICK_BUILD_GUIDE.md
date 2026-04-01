# Profile/Account System - Quick Implementation Guide

## Current State
```
✅ READ-ONLY FEATURES ONLY
- Dashboard with stats
- Activity history
- Logout button
- Links to other sections

❌ ZERO EDITABLE CONTENT
- No profile form
- No settings panel
- No password change
- No preferences UI
```

---

## What Users Can't Do Right Now

| Feature | Status | Impact |
|---------|--------|--------|
| Update name, email, phone | ❌ Missing | Can't provide contact info |
| Change password | ❌ Missing | **SECURITY RISK** - Can't recover if compromised |
| Enable 2FA | ❌ Missing | Account vulnerable to brute force |
| View login history | ❌ Missing | Can't detect unauthorized access |
| Change language/theme | ✅ Exists but lost on logout | Settings not saved |
| Export personal data | ❌ Missing | **GDPR Non-Compliance** |
| Delete account | ❌ Missing | **GDPR Non-Compliance** |
| Get notifications | ❌ No preferences | Can't control alerts |
| Accessibility options | ❌ Missing | Excludes users with disabilities |

---

## 3 CRITICAL MISSING FEATURES

### 1. 🔴 PASSWORD CHANGE (Security Risk)
**Why it matters**: If user's password is compromised, they're stuck.  
**Current situation**: Only admin can reset, no self-service option.  
**Implementation time**: 4 hours

```typescript
// Missing API: PATCH /api/user/password
// Required fields:
// - currentPassword (verify user owns account)
// - newPassword (with strength validation)
// - newPasswordConfirm (confirmation match)
```

### 2. 🔴 DATA EXPORT (Legal Requirement - GDPR Article 20)
**Why it matters**: Legal requirement in EU/many regions.  
**Current situation**: No way to bulk download personal data.  
**Implementation time**: 8 hours

```typescript
// Missing API: POST /api/user/export
// Should export:
// - Profile data (JSON)
// - All simulations (with results)
// - All documents (PDF or text)
// - All cases and timeline
// - All evidence/artifacts
// Output: ZIP file or email link
```

### 3. 🔴 ACCOUNT DELETION (Legal Requirement - GDPR Article 17)
**Why it matters**: Legal requirement - "right to be forgotten".  
**Current situation**: Only admin can delete, with no grace period.  
**Implementation time**: 4 hours minimum

```typescript
// Missing API: DELETE /api/user/account
// Requirements:
// - Confirm with password
// - Show 30-day grace period warning
// - Allow cancellation during grace period
// - Email confirmation
// - GDPR-compliant data purge schedule
```

---

## QUICK BUILD: SETTINGS PAGE (2 Hours)

### Minimal Settings Form
```
/compte/settings
│
├─ Personal Information Section
│  ├─ First Name (text field)
│  ├─ Last Name (text field)
│  ├─ Email (text field + verify button)
│  └─ Phone (text field)
│
├─ Preferences Section
│  ├─ Language (FR/AR selector)
│  ├─ Theme (Light/Dark toggle)
│  ├─ Auto-save (toggle)
│  └─ Notifications (toggle)
│
└─ Actions
   └─ Save Changes (submit button)
   └─ Cancel

Database: 1 table (user_profiles)
API: 1 endpoint (PATCH /api/user/profile)
Component: 1 form component
Effort: 2-3 hours
```

### Example API Response
```json
{
  "ok": true,
  "profile": {
    "firstName": "Zouhair",
    "lastName": "Test",
    "email": "user@example.ma",
    "phone": "+212 6XX XXX XXX",
    "region": "Casablanca",
    "preferences": {
      "language": "fr",
      "theme": "light",
      "autoSave": true,
      "notificationsEnabled": true
    }
  }
}
```

---

## QUICK BUILD: SECURITY PAGE (6 Hours)

```
/compte/security
│
├─ Password Section
│  ├─ Current Password field
│  ├─ New Password field (with strength meter)
│  ├─ Confirm Password field
│  └─ Change Password button
│
├─ Two-Factor Auth Section
│  ├─ Status: "Disabled" / "Enabled"
│  └─ Setup 2FA button / Disable button
│
├─ Active Sessions Section
│  ├─ Current session (device, IP, "This Device")
│  ├─ Other sessions list (device, IP, last activity) 
│  └─ Terminate button for each
│
└─ Login History Section
   ├─ Timeline of last 10 logins
   ├─ Date, time, device, IP, location
   └─ "Suspicious activity" alert option
```

### API Endpoints Needed
- `PATCH /api/user/password` - Change password
- `GET /api/user/sessions` - List active sessions
- `DELETE /api/user/sessions/{id}` - End session
- `GET /api/user/login-history` - Login timeline
- `POST /api/user/2fa/setup` - Initiate 2FA
- `DELETE /api/user/2fa` - Disable 2FA

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (4-6 hours)
Priority: Must have before production

- [ ] Create `user_profiles` table
  - firstName, lastName, email, phone, region
  - timestamps, metadata
  
- [ ] Create `user_preferences` table
  - language, theme, notifications
  - sync with current localStorage data
  
- [ ] Create API endpoint: `PATCH /api/user/profile`
  - Validate all inputs
  - Handle email change (send verification)
  - Return updated profile

- [ ] Build `/compte/settings` page
  - Simple form with inputs
  - Error handling
  - Success message on save

- [ ] Create API endpoint: `PATCH /api/user/password`
  - Verify current password
  - Hash new password
  - Send confirmation email

**Effort: 6-8 hours | Value: 9/10**

---

### Phase 2: Security (4-6 hours)
Priority: High - Before full release

- [ ] Create `user_sessions` table
- [ ] Create `login_history` table

- [ ] Build `/compte/security` page
  - Password form
  - Active sessions list
  - Login history timeline
  - 2FA setup button

- [ ] API endpoints:
  - `GET /api/user/sessions`
  - `DELETE /api/user/sessions/{id}`
  - `GET /api/user/login-history`
  - `POST /api/user/2fa/setup`

**Effort: 6-8 hours | Value: 10/10 (security critical)**

---

### Phase 3: GDPR Compliance (8-10 hours)
Priority: Essential before production

- [ ] Create export scheduler job
- [ ] Build `POST /api/user/export` endpoint
  - Collect all user data
  - Generate ZIP file
  - Email link or immediate download

- [ ] Build `DELETE /api/user/account` endpoint
  - Password confirmation
  - Soft delete (30-day grace period)
  - GDPR-compliant purge

- [ ] Build `/compte/data` page
  - Export button (trigger export)
  - Download section
  - Delete account button with warning

**Effort: 8-10 hours | Value: 10/10 (legal requirement)**

---

### Phase 4: Polish (2-4 hours)
Priority: Nice to have

- [ ] Notification preferences form
- [ ] Accessibility options
- [ ] Profile completion percentage
- [ ] Better error messages

---

## ESTIMATED TOTAL EFFORT
- **Foundation**: 6-8 hours
- **Security**: 6-8 hours  
- **GDPR**: 8-10 hours
- **Polish**: 2-4 hours
- **Testing**: 4-6 hours

**Total: 26-36 hours (~1 week for one developer)**

---

## TESTING CHECKLIST

```
[ ] Create new account and complete settings
[ ] Edit profile and verify data saved
[ ] Change password with wrong current password (should fail)
[ ] Change password successfully
[ ] Language/theme preference persists after logout
[ ] Export data as ZIP
[ ] Delete account with grace period
[ ] Try to login after deletion (should fail after grace period)
[ ] Active sessions show current and past logins
[ ] Terminate other session and verify logout on that device
[ ] Invalid email change attempt
[ ] Email verification flow works
```

---

## FILES TO CREATE/MODIFY

### Database
- [x] Create migrations for: user_profiles, user_preferences, user_sessions, login_history

### Components (New)
- [ ] `src/components/settings-form.tsx`
- [ ] `src/components/security-panel.tsx`
- [ ] `src/components/data-export-panel.tsx`
- [ ] `src/components/password-change-form.tsx`

### Pages (New)
- [ ] `src/app/compte/settings/page.tsx`
- [ ] `src/app/compte/security/page.tsx`
- [ ] `src/app/compte/data/page.tsx`

### API Routes (New)
- [ ] `src/app/api/user/profile/route.ts` (GET, PATCH)
- [ ] `src/app/api/user/password/route.ts` (PATCH)
- [ ] `src/app/api/user/sessions/route.ts` (GET)
- [ ] `src/app/api/user/sessions/[id]/route.ts` (DELETE)
- [ ] `src/app/api/user/login-history/route.ts` (GET)
- [ ] `src/app/api/user/export/route.ts` (POST)
- [ ] `src/app/api/user/account/route.ts` (DELETE)

### Libraries (New)
- [ ] `src/lib/server/user-profile-store.ts`
- [ ] `src/lib/server/user-security-store.ts`
- [ ] `src/lib/password-validator.ts`

### Types
- [ ] Create `UserProfile` interface
- [ ] Create `UserSession` interface
- [ ] Create `LoginHistoryEntry` interface

---

## SUCCESS CRITERIA

✅ Users can update their personal information  
✅ Users can change their password with current password verification  
✅ Users can see active sessions and terminate them  
✅ Users can export all their data (GDPR compliant)  
✅ Users can delete their account with 30-day grace period  
✅ Preferences persist across sessions and devices  
✅ Settings changes show success/error feedback  
✅ No console errors during settings operations  
✅ All forms have proper validation  
✅ All API calls have error handling  
✅ No `any` types in profile/settings code  

