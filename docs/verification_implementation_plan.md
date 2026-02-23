# Implementation Plan: User Account Verification Notification & Integration

This plan outlines the steps for implementing a proactive verification notification system and improving the visibility of verification status for workers and users in ServiceFlow.

## 1. Objectives
- Proactively prompt workers to verify their identity if not already approved.
- Provide clear status feedback (Pending, Rejected, Not Submitted) across the app.
- Ensure easy navigation to the verification section.
- Enhance the account settings page to clearly show verification requirements.

## 2. Components to Implement/Update

### 2.1 VerificationPrompt Component (Done)
- Create a reusable modal component that displays status-specific messages.
- Use `sessionStorage` to ensure the modal only appears once per session.
- provide a clear CTA (Call to Action) that redirects to the verification tab.

### 2.2 Worker Layout Integration (Done)
- Inject the `VerificationPrompt` into the `WorkerLayout`.
- Add a clickable verification status badge to the top navigation bar.

### 2.3 Account Settings Enhancement (Done)
- Update the Profile/Account settings page to support deep-linking to specific tabs (e.g., `tab=identity`).
- Add an alert banner to the "General" tab for unverified users.
- Highlight the "Identity" tab when verification is needed.

### 2.4 Profile Completion Widget (Done)
- Ensure the widget correctly reflects verification status as part of the overall profile completion.

## 3. Implementation Steps

### Phase 1: Core Component & Logic
1.  [x] Create `VerificationPrompt` in `components/worker/verification-prompt.tsx`.
2.  [x] Define verification states and corresponding UI content (Icons, Colors, Descriptions).
3.  [x] Implement session-based visibility logic.

### Phase 2: Integration
1.  [x] Update `WorkerLayout` to show the prompt and a clickable badge.
2.  [x] Refactor `WorkerProfilePage` to use `Suspense` and `useSearchParams` for tab switching.
3.  [x] Add visual cues (badges, alerts) to the profile page.

### Phase 3: Customer/User Side (Pending Verification)
1.  [ ] Assess if similar verification is required for customers.
2.  [ ] If required, integrate `VerificationPrompt` into the customer dashboard.

### Phase 4: Polish & Refactoring
1.  [x] Fix a blank dashboard issue caused by backend unavailability and layout errors.
2.  [x] Ensure TypeScript types match the actual profile data structure.
3.  [x] Standardize UI components (use `DialogHeader`, `cn` utility, etc.).

## 4. Verification & Testing
- Login as a worker with `NOT_SUBMITTED` status -> Verify modal appears.
- Click "Verify Now" -> Verify redirect to Identity tab.
- Submit verification -> Verify status changes to `PENDING`.
- Login with `PENDING` status -> Verify modal doesn't appear (or shows pending message if desired).
- Mock `REJECTED` status -> Verify modal shows rejection reason and CTA.
- Verify topbar badge clickability.
