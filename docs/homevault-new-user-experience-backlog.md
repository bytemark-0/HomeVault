# HomeVault New User Experience & Core UI Prerequisite Backlog

**Purpose:** This backlog is the prerequisite to the broader App Store launch roadmap.  
**Scope:** First-run experience, demo-data removal, property setup, property/home image uploads, purposeful empty states, dashboard personalization, navigation clarity, form polish, permission education, and core visual consistency.  
**Out of scope:** Store accounts, EAS submission, monetization, cloud sync, OCR, Exterior & Grounds, partner features, and public launch work.

---

# 1. Product Goal

A brand-new user should understand HomeVault within seconds, create a real home record without assistance, add at least one useful item, and arrive at a dashboard that feels personal and valuable.

The first-use experience should feel like:

> Welcome → create my home → add a photo → add one useful record → see my personalized vault → understand the next useful step.

It should not feel like:

> Open app → see unexplained demo records → wonder whose data this is → leave.

---

# 2. Overall Definition of Done

Every story is complete only when all applicable conditions are met:

- [ ] Behavior works on a clean install.
- [ ] Behavior works after upgrading an existing installation.
- [ ] Existing user records are preserved.
- [ ] Empty, loading, success, cancellation, and error states are handled.
- [ ] iOS and Android behavior is verified.
- [ ] Small-screen layouts are verified.
- [ ] Large text does not hide primary actions.
- [ ] VoiceOver/TalkBack labels exist for important controls.
- [ ] New behavior has automated coverage where practical.
- [ ] No household names, addresses, images, or record contents are added to analytics or diagnostics.
- [ ] User-facing copy is final enough for beta use.
- [ ] The story’s success criteria are measured in usability testing.

---

# 3. Release Gate

This prerequisite backlog is complete when:

- [ ] A fresh install shows no unexplained demo records.
- [ ] A user can create a home with minimal information.
- [ ] A user can add or capture a property photo.
- [ ] A user can add one useful record without granting unrelated permissions.
- [ ] The dashboard reflects the user’s own home and setup progress.
- [ ] Sample mode is optional, clearly labeled, and removable.
- [ ] Five unassisted testers complete the first-use flow.
- [ ] At least four of five testers understand what HomeVault does without explanation.
- [ ] At least four of five testers successfully create a property and first useful record.
- [ ] No tester believes sample data belongs to them.
- [ ] No open P0 or P1 onboarding/UI defects remain.

---

# EPIC NX-1 — Clean First Launch

## User Story NX-101 — Start with an empty, trustworthy vault

**As a new user, I want the app to start with an empty vault so that I know every record belongs to me.**

**Priority:** P0 — release blocker  
**Dependencies:** None

### Tasks

- [x] Identify where demo data is automatically seeded.
- [x] Stop automatic demo seeding for production first launch.
- [x] Preserve demo fixtures for tests and optional sample mode.
- [x] Support a database containing zero properties.
- [x] Add a first-launch state flag or derive first launch safely from data state.
- [x] Route zero-property users to onboarding.
- [x] Preserve existing installations and existing records during upgrade.
- [x] Add automated tests for:
  - New empty database
  - Existing database with records
  - Existing database containing old demo records
  - Restored backup with records

### Completion Criteria

- [x] A clean install contains zero properties, rooms, assets, documents, tasks, repairs, and parts.
- [x] The app does not crash when no property exists.
- [x] Existing installations open normally with existing data.
- [x] Restoring a backup bypasses new-user onboarding when a property exists.
- [x] Demo fixtures remain available to automated tests.
- [x] No production startup path silently creates sample data.

### Success Criteria

- **100%** of clean-install usability testers recognize that the vault is empty and ready for their information.
- **0** testers ask whose existing home or appliance data is shown.
- Clean launch reaches the welcome screen without error on both platforms.
- Existing-data upgrade test preserves all representative records.

---

## User Story NX-102 — Understand HomeVault immediately

**As a new user, I want a clear welcome screen so that I understand the app’s value before entering data.**

**Priority:** P0  
**Dependencies:** NX-101

### Tasks

- [x] Create a concise welcome screen.
- [x] Add a one-sentence value proposition.
- [x] Add three brief value points:
  - Keep home records together
  - Stay ahead of maintenance
  - Preserve documents and service history
- [x] Add a short local-first privacy statement.
- [x] Add primary action: **Set up my home**.
- [x] Add secondary action: **Explore a sample home**.
- [x] Add tertiary access to privacy/support.
- [x] Avoid requesting permissions on this screen.
- [x] Add analytics events using only anonymous event names:
  - Welcome viewed
  - Setup selected
  - Sample selected
  - Welcome abandoned

### Completion Criteria

- [ ] The screen fits without scrolling on a standard phone.
- [x] The primary action is visually dominant.
- [x] Sample mode is clearly optional.
- [x] No account, subscription, or permission is requested.
- [x] Privacy copy accurately describes current local-first behavior.
- [x] Screen has accessible reading order and labels.

### Success Criteria

- At least **80%** of testers can explain HomeVault’s purpose after viewing the screen for 10 seconds.
- At least **70%** choose **Set up my home** without prompting.
- Fewer than **10%** of testers mistake sample mode for required setup.
- Median time from launch to selecting a path is under **20 seconds**.

---

# EPIC NX-2 — Optional and Safe Sample Mode

## User Story NX-201 — Explore a sample without confusing it with real data

**As a curious user, I want to explore a sample home so that I can understand the app before entering my own information.**

**Priority:** P1  
**Dependencies:** NX-101, NX-102

### Tasks

- [ ] Add explicit sample-mode creation.
- [ ] Mark sample records using dedicated metadata or reserved IDs.
- [ ] Show a persistent **Sample Home** banner or chip.
- [ ] Add **Create my own vault** action.
- [ ] Add **Delete sample data** action.
- [ ] Prevent sample records from being silently merged into real records.
- [ ] Define sample backup/export behavior.
- [ ] Prevent restore from accidentally enabling sample mode.
- [ ] Add tests for:
  - Entering sample mode
  - Leaving sample mode
  - Deleting sample data
  - Creating a real property after sample mode
  - Preserving real records when sample data is deleted

### Completion Criteria

- [ ] Sample mode is visually obvious on every primary tab.
- [ ] Sample records are programmatically distinguishable.
- [ ] Real setup can begin without reinstalling.
- [ ] Deleting sample content leaves real user data untouched.
- [ ] Sample data is excluded from real backups by default, or the export behavior is clearly disclosed.
- [ ] Sample mode does not trigger real reminders unless explicitly enabled.

### Success Criteria

- **100%** of testers identify the sample home as sample data.
- **0** real records are deleted during sample cleanup tests.
- At least **80%** of sample-mode testers find **Create my own vault** without assistance.
- No tester believes the sample property was imported from their device or account.

---

# EPIC NX-3 — Minimal Property Setup

## User Story NX-301 — Create my home with minimal effort

**As a new homeowner, I want to create my property with only essential information so that setup does not feel like a form-filling project.**

**Priority:** P0  
**Dependencies:** NX-102

### Required First-Step Fields

- Home nickname or display name
- Property type

### Optional First-Step Fields

- Address
- Year built
- Purchase date
- Property photo

### Tasks

- [x] Create a streamlined first-property form.
- [x] Make only name and property type required.
- [x] Add friendly property-type choices.
- [x] Allow skipping all optional fields.
- [x] Save partially entered non-sensitive state across accidental app restarts.
- [x] Add inline validation.
- [x] Add clear cancel/back behavior.
- [x] Prevent duplicate submission.
- [x] Route successful creation to the next onboarding step.
- [x] Add tests for minimal, full, cancelled, resumed, and invalid submissions.

### Completion Criteria

- [x] Property creation works with only two fields.
- [x] Address is not required.
- [x] Photo is not required.
- [x] The app never blocks setup because a permission was denied.
- [x] Duplicate taps create only one property.
- [x] Validation errors identify exactly what needs correction.
- [x] Restart during setup resumes safely or clearly restarts without corrupting data.

### Success Criteria

- At least **90%** of testers create a property without assistance.
- Median property-creation time is under **60 seconds**.
- Form abandonment is under **20%** during beta.
- Fewer than **10%** of testers attempt to enter unnecessary information because they believe it is required.

---

# EPIC NX-4 — Property and Home Images

## User Story NX-401 — Add a photo of my home

**As a homeowner, I want to add a photo of my house or property so that the vault immediately feels personal and recognizable.**

**Priority:** P0  
**Dependencies:** NX-301

### Tasks

- [x] Add a property-photo step during onboarding.
- [x] Offer:
  - Take a photo
  - Choose from library
  - Skip for now
- [x] Show a pre-permission explanation before camera or library prompts.
- [x] Copy the selected image into app-owned storage.
- [ ] Generate an appropriately sized display image.
- [ ] Preserve sufficient quality for dashboard and detail views.
- [ ] Handle portrait, landscape, HEIC, JPEG, and PNG inputs where supported.
- [ ] Correct orientation metadata.
- [ ] Show crop/position preview for the dashboard header.
- [x] Allow replacing or removing the image.
- [x] Delete obsolete app-owned image copies when replaced or removed.
- [x] Add fallback artwork when no image exists.
- [x] Add tests for image selection cancellation, denial, replacement, removal, and missing-file recovery.

### Completion Criteria

- [x] User can skip the image without interrupting onboarding.
- [x] Camera permission is requested only after choosing **Take a photo**.
- [x] Library permission is requested only after choosing **Choose from library**.
- [ ] Selected image persists after app restart.
- [ ] Property image displays correctly on dashboard and property detail.
- [x] Replacing the image removes or retires the previous app-owned copy.
- [ ] Missing/corrupt image shows a fallback instead of crashing.
- [ ] Image handling does not block the main thread for an unreasonable period.
- [x] Image is included in backup/archive behavior according to documented rules.

### Success Criteria

- At least **50%** of beta users voluntarily add a property image.
- At least **90%** of photo attempts complete successfully.
- Median time from image action to saved preview is under **15 seconds** on test devices.
- **0** crashes occur when permissions are denied or selection is cancelled.
- At least **80%** of testers say the image makes the dashboard feel personalized.

---

## User Story NX-402 — Manage property images later

**As an existing user, I want to add, replace, reposition, or remove my property image so that I can keep the vault current.**

**Priority:** P1  
**Dependencies:** NX-401

### Tasks

- [ ] Add property-image controls to property edit/detail.
- [ ] Add replace, reposition, and remove actions.
- [ ] Add confirmation before permanent removal.
- [ ] Preserve the image when editing unrelated property fields.
- [ ] Add image accessibility description support or decorative designation.
- [ ] Add visual loading and failure states.

### Completion Criteria

- [ ] All image actions are available outside onboarding.
- [ ] Removing an image does not affect other property data.
- [ ] Editing property details does not accidentally clear the image.
- [ ] Repositioning is reflected consistently across screens.
- [ ] Failures provide retry options.

### Success Criteria

- At least **90%** of testers can replace or remove an image without instruction.
- **0** unrelated property edits remove the image.
- Image action error rate is below **5%** in beta telemetry or test logs.

---

## User Story NX-403 — Add photos to rooms and important records

**As a user, I want to add photos to rooms and important assets so that I can identify records visually.**

**Priority:** P1  
**Dependencies:** NX-401, UI design system

### Tasks

- [ ] Standardize a reusable image picker/camera component.
- [ ] Apply it to:
  - Rooms/areas
  - Assets/appliances
  - Task completions
  - Repairs where supported
- [ ] Use consistent image cards and fallback states.
- [ ] Allow replace/remove.
- [ ] Handle app-owned storage lifecycle consistently.
- [ ] Document which images are included in backup/archive.
- [ ] Add representative tests.

### Completion Criteria

- [ ] The same image UX is used across supported record types.
- [ ] Images display consistently in lists and details.
- [ ] Missing files never crash a screen.
- [ ] Replace/remove behavior is predictable.
- [ ] Images remain linked to the correct record after restart and restore.

### Success Criteria

- At least **80%** of testers understand how to add a photo after seeing the control once.
- Photo-related support questions are rare during beta.
- No record displays another record’s image.
- Backup/restore test preserves representative images according to documented behavior.

---

# EPIC NX-5 — First Useful Record

## User Story NX-501 — Choose what I want to add first

**As a new user, I want to choose my first useful action so that onboarding matches my immediate need.**

**Priority:** P0  
**Dependencies:** NX-301

### Quick-Start Choices

- Add an appliance
- Add a home system
- Add a maintenance reminder
- Save a document
- Skip to dashboard

### Tasks

- [x] Create a quick-start choice screen.
- [x] Explain each choice in one sentence.
- [x] Reuse existing record-creation screens in onboarding mode.
- [x] Return to onboarding after successful creation.
- [x] Allow skipping without penalty.
- [x] Record completion state without collecting record contents.
- [x] Add tests for each path.

### Completion Criteria

- [x] Every option routes to a working creation flow.
- [x] User can skip and return later.
- [x] Successful creation immediately updates the vault.
- [x] Cancelling returns to the choice screen.
- [x] No path requires unrelated permissions.
- [x] Onboarding does not create duplicate records.

### Success Criteria

- At least **70%** of testers create one useful record before reaching the dashboard.
- At least **90%** understand the differences among the choices.
- Median time from property creation to first useful record is under **2 minutes**.
- Fewer than **10%** become stranded after cancelling a creation form.

---

## User Story NX-502 — Add my first appliance quickly

**As a homeowner, I want a simplified first-appliance form so that I can see immediate value without entering every technical detail.**

**Priority:** P0  
**Dependencies:** NX-501

### Minimum Fields

- Appliance/system name
- Category
- Optional room

### Deferred Optional Fields

- Brand
- Model
- Serial
- Purchase date
- Install date
- Warranty
- Cost
- Photo
- Notes

### Tasks

- [x] Add onboarding-mode asset form.
- [x] Show only minimum fields initially.
- [x] Place optional fields under **Add more details**.
- [x] Allow room creation inline or skip room assignment.
- [x] Offer photo after the core record saves.
- [x] Route to dashboard with a clear success state.
- [x] Add tests for minimum and expanded forms.

### Completion Criteria

- [x] First asset can be created with name and category.
- [x] Room is optional.
- [x] Advanced details do not block completion.
- [x] Record appears immediately on the dashboard/inventory.
- [x] User is offered, not forced, to add more information.

### Success Criteria

- At least **90%** of testers create the first asset successfully.
- Median first-asset creation time is under **60 seconds**.
- At least **75%** say the initial form asks for an appropriate amount of information.
- Form abandonment is below **15%**.

---

# EPIC NX-6 — Purposeful Empty and Partial States

## User Story NX-601 — Know what to do next

**As a new user, I want the dashboard to guide my next step so that the app does not feel empty or unfinished.**

**Priority:** P0  
**Dependencies:** NX-301

### Dashboard Setup Checklist

- Add a room or area
- Add an appliance/system
- Add a maintenance reminder
- Save a document
- Add a property photo
- Create a backup

### Tasks

- [x] Build setup-progress calculation.
- [x] Add a compact progress card.
- [x] Prioritize one recommended next action.
- [x] Update progress immediately after record changes.
- [x] Stop promoting completed steps.
- [x] Allow dismissing or collapsing the checklist.
- [x] Bring the checklist back through Help/Getting Started.
- [x] Add zero, partial, and completed-state tests.

### Completion Criteria

- [x] Empty dashboard contains meaningful guidance.
- [x] Dashboard does not show a wall of zero-value statistics.
- [x] Recommended action reflects the user’s actual missing setup.
- [x] Checklist is not shown as incomplete when corresponding records exist.
- [x] Completed users can dismiss setup guidance permanently.
- [x] Dashboard remains useful after setup is complete.

### Success Criteria

- At least **80%** of testers can identify the next recommended action.
- At least **60%** complete a second setup action during the first session.
- Fewer than **10%** describe the dashboard as “empty,” “broken,” or “confusing.”
- Setup checklist state matches repository data in all automated cases.

---

## User Story NX-602 — See my home reflected in the dashboard

**As a user, I want the dashboard to show my property name, image, and relevant activity so that the app feels like my home’s vault.**

**Priority:** P0  
**Dependencies:** NX-301, NX-401

### Tasks

- [x] Add property image/header area.
- [x] Show property name prominently.
- [x] Add context-aware status summary:
  - Setup in progress
  - Tasks due
  - Recently added records
  - Backup status
- [x] Add quick actions.
- [x] Use fallbacks when photo or records are missing.
- [x] Avoid overly dense stat grids for new users.
- [x] Test across new, partial, and established accounts.

### Completion Criteria

- [x] Property identity is the most prominent dashboard element.
- [ ] Property image displays without cropping important content unpredictably.
- [x] A new vault and an established vault have appropriately different dashboard states.
- [x] Quick actions are reachable with one tap.
- [x] No section appears broken when its data is empty.

### Success Criteria

- At least **80%** of testers describe the dashboard as personalized.
- At least **80%** can find the inventory or add-record action within 10 seconds.
- No critical information is clipped on supported screen sizes.
- Dashboard load remains acceptably responsive with representative data.

---

# EPIC NX-7 — Core UI Consistency

## User Story NX-701 — Experience a coherent visual system

**As a user, I want screens and controls to look and behave consistently so that the app feels trustworthy and easy to learn.**

**Priority:** P0  
**Dependencies:** None; can begin in parallel

### Tasks

Create reusable components:

- [ ] Screen container
- [ ] Header
- [ ] Section
- [ ] Card
- [ ] Primary button
- [ ] Secondary button
- [ ] Destructive button
- [ ] Text field
- [ ] Select field
- [ ] Image picker card
- [ ] Status chip
- [ ] Empty state
- [ ] Inline alert
- [ ] Loading state
- [ ] Permission education card
- [ ] Setup progress card
- [ ] Toast

Define:

- [ ] Color tokens
- [ ] Typography scale
- [ ] Spacing scale
- [ ] Radius values
- [ ] Elevation/shadow approach
- [ ] Icon sizes
- [ ] Touch target minimums
- [ ] Light mode baseline
- [ ] Dark mode decision

### Completion Criteria

- [ ] Core onboarding screens use shared components.
- [ ] Dashboard uses shared components.
- [ ] Property creation and image controls use shared components.
- [ ] Button hierarchy is consistent.
- [ ] Error/loading/disabled states are standardized.
- [ ] Contrast is acceptable.
- [ ] Touch targets are accessible.

### Success Criteria

- At least **80%** of usability testers correctly distinguish primary, secondary, and destructive actions.
- UI review finds no conflicting button styles on onboarding and dashboard screens.
- Accessibility review finds no P0/P1 contrast or target-size issue.
- New feature work can use documented components rather than copying screen-specific styles.

---

## User Story NX-702 — Understand navigation and back behavior

**As a user, I want navigation to behave predictably so that I never feel trapped or lose work unexpectedly.**

**Priority:** P0  
**Dependencies:** Expo Router foundation

### Tasks

- [ ] Audit onboarding navigation.
- [ ] Audit modal versus full-screen flows.
- [ ] Standardize save, cancel, close, and back behavior.
- [ ] Add unsaved-change confirmation where needed.
- [ ] Verify Android hardware back.
- [ ] Verify iOS swipe-back.
- [ ] Ensure onboarding cannot navigate into invalid record routes.
- [ ] Add route-level tests for major flows.

### Completion Criteria

- [ ] Back always returns to an understandable prior state.
- [ ] Cancel never silently saves partial records.
- [ ] Save never creates duplicates.
- [ ] Unsaved changes are protected where loss would be surprising.
- [ ] Android back behavior is tested.
- [ ] Missing record routes show recovery UI.

### Success Criteria

- **0** testers become trapped during onboarding.
- Fewer than **10%** report unexpected data loss after navigating back.
- All critical onboarding routes pass automated navigation tests.

---

# EPIC NX-8 — Form and Content Polish

## User Story NX-801 — Complete forms without confusion

**As a user, I want forms to use plain language and clear grouping so that I know what information is expected.**

**Priority:** P1  
**Dependencies:** NX-701

### Tasks

- [ ] Review labels and helper text for property, room, asset, task, and document forms.
- [ ] Mark optional fields clearly.
- [ ] Group advanced fields behind expandable sections.
- [ ] Standardize date entry.
- [ ] Standardize currency entry.
- [ ] Add inline validation and recovery.
- [ ] Preserve entered values after recoverable errors.
- [ ] Fix keyboard obstruction and scrolling.
- [ ] Add form accessibility labels.

### Completion Criteria

- [ ] Required and optional fields are visually distinct.
- [ ] Errors appear next to the relevant field.
- [ ] Keyboard does not cover save actions.
- [ ] Form values survive recoverable submission failures.
- [ ] Technical terminology is avoided or explained.
- [ ] Destructive changes are separated from normal editing.

### Success Criteria

- At least **85%** of testers complete key forms without asking what a field means.
- Validation-related abandonment remains below **10%**.
- No critical form action is hidden by the keyboard on supported devices.

---

## User Story NX-802 — Receive clear feedback after actions

**As a user, I want clear success and error feedback so that I know whether my action worked.**

**Priority:** P1  
**Dependencies:** NX-701

### Tasks

- [ ] Add consistent success toasts/messages.
- [ ] Add actionable error messages.
- [ ] Add visible loading state during image processing and saves.
- [ ] Disable duplicate submission while saving.
- [ ] Add retry for recoverable failures.
- [ ] Avoid displaying raw technical error messages.

### Completion Criteria

- [ ] Save actions provide confirmation.
- [ ] Failed actions explain what the user can do.
- [ ] Loading states do not appear frozen.
- [ ] Duplicate taps do not create duplicate records.
- [ ] Messages are accessible to screen readers.

### Success Criteria

- At least **90%** of testers correctly know whether a record saved.
- Duplicate-record rate from repeated taps is **0** in automated and manual tests.
- No raw stack trace or database error is shown to users.

---

# EPIC NX-9 — Permission Trust and Privacy

## User Story NX-901 — Understand why a permission is requested

**As a privacy-conscious user, I want to know why HomeVault needs a permission so that I can make an informed choice.**

**Priority:** P0  
**Dependencies:** NX-401

### Tasks

- [x] Remove notification request from app startup.
- [x] Add pre-permission camera explanation.
- [x] Add pre-permission photo-library explanation.
- [x] Add pre-permission notification explanation.
- [x] Add pre-permission file-selection explanation where applicable.
- [x] Add manual alternatives after denial.
- [x] Add settings link for permanently denied permissions.
- [x] Avoid repeatedly prompting after denial.
- [ ] Align copy with privacy policy.

### Completion Criteria

- [x] No permission is requested before a relevant user action.
- [ ] Onboarding completes with every optional permission denied.
- [x] Denied camera/library still permits skipping image upload.
- [x] Notification denial does not break task creation.
- [ ] Permission status is handled consistently across restarts.
- [ ] iOS and Android denial/recovery flows are verified.

### Success Criteria

- At least **80%** of testers say permission requests are understandable.
- **0** testers are blocked from completing onboarding by denial.
- Permission-related crash rate is **0**.
- Repeated unwanted prompt complaints are **0** in usability testing.

---

# EPIC NX-10 — Onboarding Persistence and Recovery

## User Story NX-1001 — Resume setup after interruption

**As a user, I want to resume onboarding after closing the app so that I do not have to start over.**

**Priority:** P0  
**Dependencies:** NX-301, NX-501

### Tasks

- [x] Define onboarding state model.
- [x] Persist completed onboarding steps.
- [x] Reconcile persisted state with actual repository data.
- [x] Resume at the first incomplete logical step.
- [x] Avoid forcing onboarding when a usable property already exists.
- [x] Add restart tests after every major step.
- [x] Add recovery for inconsistent state.

### Completion Criteria

- [x] Restart after welcome returns to the correct choice.
- [x] Restart after property creation does not create another property.
- [x] Restart after first record leads to dashboard or next logical step.
- [x] Deleted records cause setup progress to recalculate safely.
- [x] Restored backup supersedes stale onboarding progress.
- [x] Corrupt onboarding state falls back safely.

### Success Criteria

- **100%** of interruption test cases resume without duplicate records.
- At least **90%** of testers understand where they resumed.
- No support intervention is needed to escape onboarding.

---

# EPIC NX-11 — Usability Validation

## User Story NX-1101 — Validate the experience with real first-time users

**As the product owner, I want evidence that the onboarding works so that we do not publish based only on developer assumptions.**

**Priority:** P0 — exit gate  
**Dependencies:** All P0 stories

### Test Group

Minimum five participants who have not used or seen the app.

### Test Script

Ask participants to:

1. Open the app with no explanation.
2. Explain what they think it does.
3. Set up their home.
4. Add a property photo or skip it.
5. Add one useful record.
6. Find the dashboard.
7. Explain what they would do next.
8. Optionally explore sample mode.
9. Close and reopen the app.
10. Find where to change the property image.

### Tasks

- [ ] Prepare clean test builds.
- [x] Prepare observation script.
- [ ] Do not coach participants.
- [ ] Record task completion and confusion points.
- [ ] Record time to first useful vault.
- [ ] Prioritize issues by severity and frequency.
- [ ] Re-test after fixes.

### Completion Criteria

- [ ] Five unassisted sessions are completed.
- [ ] Findings are documented.
- [ ] Every P0 finding is fixed.
- [ ] Frequent P1 findings are fixed or explicitly deferred.
- [ ] Updated flow is re-tested with at least two participants.

### Success Criteria

- At least **4/5** explain the app’s purpose accurately.
- At least **4/5** create a property without assistance.
- At least **4/5** add one useful record without assistance.
- At least **4/5** identify a logical next step from the dashboard.
- **5/5** know whether they are viewing sample or personal data.
- Median time to first useful vault is under **3 minutes**.
- No participant recommends uninstalling because the initial state feels confusing or untrustworthy.

---

# 4. Recommended Implementation Order

## Work Package 1 — Remove the Current First-Launch Risk

- NX-101
- NX-102
- NX-201
- NX-1001

**Exit:** Clean installs show welcome/onboarding; sample mode is optional.

## Work Package 2 — Create a Personal Home Quickly

- NX-301
- NX-401
- NX-402
- NX-501
- NX-502

**Exit:** User creates a property, optionally adds an image, and adds one useful record.

## Work Package 3 — Make the Empty Vault Valuable

- NX-601
- NX-602
- NX-901

**Exit:** Personalized dashboard guides the next step without requiring permissions.

## Work Package 4 — Establish UI Consistency

- NX-701
- NX-702
- NX-801
- NX-802
- NX-403

**Exit:** Onboarding, dashboard, images, forms, and feedback follow one coherent system.

## Work Package 5 — Validate Before Continuing the Store Roadmap

- NX-1101

**Exit:** Phase 0 success thresholds are met with unassisted testers.

---

# 5. Immediate Branch and Commit Plan

Create:

```text
onboarding-rescue
```

## Commit 1 — Empty First Launch

- Remove production demo auto-seeding
- Support zero properties
- Route clean install to welcome
- Preserve upgraded installations
- Add clean-launch tests

## Commit 2 — Welcome and Sample Mode

- Add welcome screen
- Add setup and sample choices
- Isolate and label sample data
- Add sample cleanup/exit
- Add sample-mode tests

## Commit 3 — Minimal Property Creation

- Add streamlined property form
- Add onboarding state persistence
- Route property success forward
- Add form tests

## Commit 4 — Property Image Experience

- Add capture/library/skip
- Add permission education
- Add app-owned image storage
- Add replace/remove/fallback
- Add image tests

## Commit 5 — First Useful Record

- Add quick-start choice
- Add simplified first-asset path
- Route to dashboard
- Add onboarding-flow tests

## Commit 6 — Dashboard and Setup Progress

- Add property header/photo
- Add purposeful empty state
- Add setup checklist
- Add next recommended action
- Add state-based tests

## Commit 7 — UI Consistency and Accessibility

- Add shared primitives
- Refactor onboarding/dashboard/forms
- Standardize feedback
- Verify small screens and large text

## Commit 8 — Usability Fixes

- Run five sessions
- Fix P0/P1 findings
- Re-test
- Document Phase 0 completion
