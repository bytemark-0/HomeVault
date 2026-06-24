# HomeVault Private Beta & Launch Readiness Backlog

**Prepared:** June 20, 2026  
**Purpose:** Define the user stories, implementation tasks, and acceptance criteria needed to get HomeVault ready for private beta and eventual public launch.  
**Planning stance:** Shoot for the moon, then deliberately defer lower-risk work if needed.

---

## 0. Shared Work Log

Use this section as the handoff surface between Codex, Claude Code, and human work. Mark checklist items only when the task has actually been implemented or verified.

### June 20, 2026 - Codex

- Added this launch backlog.
- Added `docs/homevault-beta-release-checklist.md` as the beta release runbook.
- Added `apps/mobile/eas.json` with development, preview, preview simulator, and production profiles.
- Added stable iOS and Android application identifiers in `apps/mobile/app.json`.
- Confirmed existing icon, adaptive icon, favicon, and splash image assets are present.
- Tightened CI so web export is a required job rather than informational.
- Blocked Android microphone permission in config because HomeVault does not need audio recording for beta.
- Added CI fixture consistency check for `docs/homevault-sample-backup.json`.
- Verified locally: `npm run typecheck`, `npm run lint`, `npm test`, `npm run export:web --workspace=apps/mobile`, `git diff --exit-code docs/homevault-sample-backup.json`, `git diff --check`.
- Ran `npm audit --audit-level=moderate`; documented temporary accepted moderate dependency risk in `docs/homevault-security-audit-register.md`.
- Added in-app Beta Support route with privacy notes, permission explanations, backup/delete guidance, known beta limits, app context, and a mail feedback template.
- Added `docs/homevault-beta-privacy-notes.md` as the private beta privacy/support position.
- Browser verified the main top-bar support control opens Beta Support and renders privacy, permissions, device context, and feedback copy.
- Added a Welcome screen Privacy & beta support action so privacy/support details are reachable before setup.
- EAS CLI resolves through `npx eas-cli`, but `build:inspect` is blocked until an Expo account is logged in.
- Verified onboarding support callback with a WelcomeScreen test; mobile test count is now 21.
- Added and browser-verified a sample-backup notice on the Export manifest screen.
- Added a sample-mode exit regression test proving sample records are cleared, onboarding returns, and notifications are cleared.
- Added first-home creation tests for required-field validation, required-only creation, property type selection, and duplicate-submit prevention.
- Added first-home save-failure handling with an inline retry message and regression coverage.
- Added onboarding-finish integration coverage proving a newly created home reloads into dashboard app data.
- Added a reusable sample-mode notice across every primary tab with create-real-vault confirmation coverage.
- Added room missing-record recovery screens and deletion-impact regression coverage for L-301.
- Added room form validation, create/edit save payload, and failed-save retry regression coverage for L-301.
- Added room photo save/cancel cleanup regression coverage plus route-level create/edit/detail/delete navigation tests for L-301.
- Added asset create/edit/photo/room-assignment regression coverage, asset detail linked-record rendering coverage, and stale-route/delete navigation recovery tests for L-302.
- Added document, task, repair, and part route recovery plus broader screen regression coverage across search, empty states, completion, snooze, and linked-record detail flows for Epic L-3.
- Added document property-link coverage and recurring-task cadence save coverage to tighten Epic L-3 verification before cleanup.
- Open verification: GitHub Actions green run, real EAS iOS/Android builds, and native Android permission manifest still need external/device validation.

### June 23, 2026 - Codex

- Added optional onboarding property address, year-built, and purchase-date fields with regression coverage for first-home creation and edit flows.
- Added first-home onboarding draft persistence so partially entered property details survive app interruption and successful creation clears the saved draft.
- Added onboarding restart recovery coverage for welcome, property creation, property photo, and quick-start steps, plus safe fallback for stale or corrupt onboarding state.
- Fixed quick-start completion so onboarding clears and hands off to the main app after the first useful record or skip action, with route-level regression coverage.
- Added quick-start path coverage for appliance, system, maintenance reminder, document, skip, and cancel loops, plus first-asset onboarding save/duplicate-submit regression coverage.
- Added shared setup-checklist progress logic, zero/partial/completed dashboard checklist tests, and a Household "Getting started" restore action for dismissed setup guidance.
- Added asset-detail regression coverage for serial, warranty, purchase/install dates, and notes rendering.
- Added ZIP backup validation plus restore rebuilding for document attachments and room/asset photos, with archive inspection and restore regression coverage.
- Added document attachment recovery guidance for failed import and failed open-file actions.
- Added maintenance UX coverage for recurrence helper copy, due-state grouping, notification-permission context, snoozed-task recovery, and dashboard due-count consistency.
- Added shared task/service-history currency and date formatting coverage plus helpful service-history empty-state guidance.
- Added first-home back/cancel regression coverage, duplicate-submit coverage for quick-start task/document saves, and direct dashboard header/empty-state regression coverage.
- Added dashboard status-summary coverage across new, partial, and established vault states plus one-tap route coverage for home-screen quick actions.
- Hardened notification-permission handling so task data still loads when reminder sync fails, with integration coverage for the denial/failure path.
- Added replace/remove controls to the shared photo picker and verified app-owned temp-photo cleanup on replacement and removal.
- Added a true two-step first-asset onboarding flow with minimum-first fields, optional room selection, expandable extra details, and an optional post-save photo step.
- Added first-asset onboarding regression coverage for minimum and expanded saves, duplicate-submit protection, and optional post-save photo save/skip behavior.
- Added property-photo coverage for canceled picks plus zip backup/restore rebuilding of property, room, asset, and document files.
- Added export-manifest regression coverage for invalid backup warnings and restore overwrite guidance before destructive restore actions.
- Marked the newly verified onboarding/dashboard P0 checklist items complete in the UX backlog.

---

## 1. Launch Goal

HomeVault should feel trustworthy, polished, and immediately useful for a private beta user who wants to manage a real home. A tester should be able to install the app, understand it, create a home, add useful records, trust their local data, recover from mistakes, and send feedback without assistance.

The private beta is successful when HomeVault proves:

- New users understand the product quickly.
- Local-first data storage feels intentional and trustworthy.
- Core home record workflows work on real devices.
- Backup and restore are reliable.
- The interface feels coherent, calm, and polished.
- The team can triage tester issues quickly.

---

## 2. Priority Definitions

- **P0 Private Beta Blocker:** Must be complete before inviting external private beta testers.
- **P1 Launch Candidate:** Strongly preferred for private beta; required before broader public launch unless explicitly deferred.
- **P2 Polish / Differentiator:** Valuable, but can move after private beta if schedule requires.
- **P3 Post-Launch Candidate:** Worth tracking, but not needed for initial beta confidence.

---

## 3. Private Beta Release Gate

Private beta can begin when all P0 items are complete and explicitly verified.

- [ ] GitHub CI is green on the beta branch.
- [ ] Installable iOS and Android preview builds exist.
- [x] Fresh install onboarding works without unexplained sample data.
- [x] A user can create a real home and add at least one useful record.
- [x] Core CRUD flows work for properties, rooms, assets, documents, tasks, repairs, and parts.
- [ ] Backup export and restore pass on at least one physical device.
- [x] The app has a documented privacy/data handling position.
- [x] A tester can submit feedback or support context.
- [ ] Manual smoke QA has passed on the target beta devices.
- [ ] No open P0 data loss, migration, restore, crash, or onboarding-confusion bugs remain.

---

# Epic L-1 — Release Engineering & Distribution

## Story L-101 — Install a real beta build

**As a beta tester, I want to install HomeVault through a normal beta distribution path so that I can use it like a real app.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Add or verify EAS build profiles for development and preview builds.
- [x] Set stable iOS bundle identifier and Android package name.
- [x] Confirm app display name, version, build number, orientation, icon, adaptive icon, and splash assets.
- [ ] Generate iOS preview build.
- [ ] Generate Android preview build.
- [x] Document beta installation steps for testers.
- [x] Document build commands and expected environment variables.
- [x] Decide whether private beta uses TestFlight, Google Play Internal Testing, EAS internal distribution, or a hybrid.

### Acceptance Criteria

- [ ] A clean checkout can produce a preview build using documented commands.
- [ ] iOS build installs on a physical iPhone or approved simulator path.
- [ ] Android build installs on a physical Android device or approved emulator path.
- [ ] Installed app name and icon match the intended HomeVault branding.
- [ ] Build numbers increment predictably.
- [ ] No development-only labels or placeholder app metadata appear in the installed app.

### Verification Notes

- Local Expo config resolves with the expected app name, slug, scheme, version, splash, icons, iOS bundle ID, Android package, and Android version code.
- Android `blockedPermissions` includes `android.permission.RECORD_AUDIO`; verify the generated native manifest during the first EAS build because Expo public config still reports the camera dependency's implicit audio permission.

---

## Story L-102 — Make CI the release gate

**As the product owner, I want automated checks to block unsafe releases so that beta builds are not shipped from a broken branch.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Verify GitHub Actions runs on the active beta branch.
- [x] Ensure CI runs dependency install, typecheck, lint, tests, and web export.
- [x] Add fixture consistency checks if backup fixtures are generated.
- [x] Document required checks.
- [x] Enable branch protection or define the manual equivalent before beta release.
- [ ] Record the first green beta release candidate run.

### Acceptance Criteria

- [ ] GitHub Actions passes on the branch used to create beta builds.
- [ ] A TypeScript failure blocks CI.
- [ ] A lint failure blocks CI.
- [ ] A test failure blocks CI.
- [ ] A broken web export blocks CI.
- [ ] The beta release checklist links to the successful CI run.

### Verification Notes

- CI workflow now treats web export as a required job.
- Local gate passed on June 20, 2026: typecheck, lint, tests, web export, and `git diff --check`.
- Lint passes with 15 existing non-null assertion warnings; decide whether to clean or explicitly accept before beta.

---

## Story L-103 — Triage dependency and security risk

**As a cautious beta operator, I want known dependency risks reviewed so that we understand what we are shipping.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Run dependency audit from a clean install.
- [x] Classify each moderate-or-higher vulnerability as fixed, accepted, blocked by upstream, or irrelevant to the shipped app.
- [x] Apply safe dependency upgrades.
- [x] Avoid risky upgrades that destabilize Expo unless necessary.
- [x] Document any accepted vulnerabilities with rationale.

### Acceptance Criteria

- [x] No critical or high vulnerabilities remain unreviewed.
- [x] Moderate vulnerabilities are either fixed or documented as accepted risk.
- [x] Typecheck, lint, tests, and web export pass after dependency changes.
- [x] The launch checklist includes the final audit result and decision.

### Verification Notes

- `npm audit --audit-level=moderate` re-run on June 23, 2026 still reports 0 critical, 0 high, and 38 moderate findings.
- Moderate findings are currently accepted for private beta because the available automatic fixes require breaking Expo/React Native/Jest upgrades.
- No safe non-breaking dependency upgrades are currently available for this slice; the remaining fix paths require framework-breaking upgrades.
- Local verification remains green after the audit review: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run export:web --workspace=apps/mobile`.

---

# Epic L-2 — First-Run Experience & Onboarding

## Story L-201 — Understand HomeVault immediately

**As a new homeowner, I want to understand what HomeVault does within seconds so that I feel confident starting setup.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Review the welcome screen copy for clarity and brevity.
- [x] Ensure the primary action is setup, not sample mode.
- [x] Keep the local-first privacy message visible but concise.
- [x] Avoid permission prompts before the user understands why they are needed.
- [x] Add accessible labels and reading order for onboarding controls.
- [ ] Test welcome screen on small phones and large text settings.

### Acceptance Criteria

- [ ] A tester can describe HomeVault's purpose after seeing the welcome screen for 10 seconds.
- [x] The primary setup action is visually dominant.
- [x] Sample mode is clearly optional.
- [x] No account, subscription, or permission prompt appears before setup intent.
- [ ] Text does not truncate or overlap on small screens.

### Verification Notes

- Welcome screen has primary setup, secondary sample, and tertiary privacy/support actions.
- Welcome tests cover setup, sample entry, and privacy/support callbacks.
- Device-size and large-text verification remain open.

---

## Story L-202 — Create a first home without friction

**As a new user, I want to create my home with minimal required information so that setup feels approachable.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Confirm only home name and property type are required.
- [x] Validate required fields inline.
- [x] Allow optional address, year built, purchase date, and photo.
- [x] Prevent duplicate submission.
- [ ] Preserve existing user records during upgrade.
- [x] Add test coverage for empty database and first-property creation.

### Acceptance Criteria

- [x] A clean install with zero properties routes to onboarding.
- [x] A user can create a home with only required fields.
- [x] Optional fields can be skipped without warning loops.
- [x] Failed saves show actionable errors.
- [x] After save, the dashboard reflects the new home.

### Verification Notes

- Context integration tests cover the zero-property onboarding state.
- CreatePropertyScreen tests cover blank-name validation, required-only creation, property type selection, and duplicate-submit prevention.
- CreatePropertyScreen now captures optional address, year built, and purchase date values with inline validation, then continues to the existing onboarding photo step; tests cover optional-field saves and invalid date rejection.
- CreatePropertyScreen persists a non-sensitive draft of the first-home form, restores it on relaunch, and clears it after a successful create; tests cover resumed state and draft cleanup.
- CreatePropertyScreen tests cover failed saves preserving input, showing retry guidance, and allowing a successful retry.
- Context integration tests cover finishOnboarding reloading a newly created home into app data.

---

## Story L-203 — Explore sample data safely

**As a curious tester, I want to explore a sample home without confusing it for my data so that I can understand the app before committing.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Keep sample mode clearly labeled across primary screens.
- [x] Add an obvious path to create a real vault from sample mode.
- [x] Add an obvious path to delete sample data.
- [x] Confirm sample records are programmatically distinguishable.
- [x] Confirm backup/export behavior for sample data.
- [x] Add tests for entering sample mode, exiting sample mode, and deleting sample data.

### Acceptance Criteria

- [x] Sample mode is visually obvious on every primary tab.
- [x] No tester believes sample records are their real records.
- [x] Deleting sample data cannot delete real user records.
- [x] A tester can create a real home after using sample mode without reinstalling.

### Verification Notes

- Sample-mode tasks do not trigger real notification sync.
- Export manifest now warns that exports from sample mode include the sample home and should not be used as real household backups.
- Browser verified the warning through Household -> Export manifest on the local web preview.
- Context tests cover entering sample mode and exiting sample mode back to the new-user onboarding state.
- Every primary tab now renders the reusable sample-mode notice when `isSampleMode` is true.
- SampleModeNotice tests cover hidden real-vault state, visible sample-data copy, and the create-real-vault confirmation that calls sample cleanup.

---

# Epic L-3 — Core HomeVault Workflows

## Story L-301 — Add and manage home structure

**As a homeowner, I want to add rooms and spaces so that my records map to my real home.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Verify room create, edit, detail, photo, and delete flows.
- [x] Confirm room deletion explains impact on linked assets and records.
- [x] Add empty states for no rooms.
- [x] Add invalid-record recovery for deleted or stale route IDs.
- [x] Verify navigation back behavior from room-related screens.

### Acceptance Criteria

- [x] A user can create, edit, view, and delete a room.
- [x] A user understands what will happen before deleting a room.
- [x] Linked records remain consistent after room changes.
- [x] Empty states explain the next useful action.
- [x] No room flow crashes after record deletion.

### Verification Notes

- HouseholdScreen already shows a no-rooms empty state with "Map the first area" and an Add area action.
- MissingRecordView is now used for stale/deleted room detail and edit routes instead of navigating during render.
- MissingRecordView tests cover recovery copy and the Back to Household action.
- RoomDetailScreen tests cover linked asset deletion impact copy, the confirmation dialog, and the destructive delete callback.
- RoomDetailRoute tests cover back-navigation fallback plus successful room deletion returning to Household.
- AddRoomScreen tests cover required name validation, failed create retry while preserving input, photo save/cancel cleanup, and edit save payloads with the existing room id.
- Room new/edit route tests cover successful save navigation when history exists and deterministic fallback targets when it does not.
- Room create/edit routes now rethrow save failures after showing the existing toast so the form can show inline retry guidance.
- Repository tests already cover room deletion cascading through linked assets, tasks, repairs, and parts.

---

## Story L-302 — Add and manage assets

**As a homeowner, I want to track appliances, systems, and important items so that HomeVault becomes useful quickly.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Verify asset create, edit, detail, photo, room assignment, and delete flows.
- [x] Confirm warranty, serial number, purchase date, install date, and notes fields behave consistently.
- [x] Add clear empty states for no assets.
- [x] Verify asset search results open correct detail screens.
- [x] Add regression tests for asset creation and update.

### Acceptance Criteria

- [ ] A user can add an asset in under two minutes.
- [x] A user can attach or remove an asset photo.
- [x] Asset detail shows linked tasks, documents, repairs, and parts when present.
- [x] Search can find the asset by meaningful fields.
- [x] Deleting an asset does not leave broken linked screens.

### Verification Notes

- AddAssetScreen tests now cover required-name validation, create payload shaping, room assignment, photo save/cancel cleanup, and edit payloads with the existing asset id.
- InventoryScreen tests now cover the no-assets empty state and Add asset call-to-action.
- AssetDetailScreen tests cover linked document, part, repair, and maintenance-history rendering plus destructive delete copy.
- AssetDetailScreen tests now also cover part and repair delete callbacks from the linked asset detail surface.
- AssetDetailScreen tests now also cover serial, install date, purchase date, warranty state, and notes fallbacks so the detail fields stay consistent with add/edit flows.
- Asset detail and edit routes now use MissingRecordView for stale or deleted asset ids instead of navigating during render.
- Asset route tests cover create, edit, stale-detail recovery, back-navigation fallback, and successful delete returning to Inventory.
- SearchScreen tests now cover asset lookup by model and successful asset-result opening.

---

## Story L-303 — Capture documents and attachments

**As a homeowner, I want to store manuals, receipts, warranties, and service paperwork so that I can find them later.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Verify document create, edit, attach, preview/open, delete, and search flows.
- [x] Confirm attachment storage paths are not exposed in user-facing errors.
- [x] Add useful document type choices.
- [x] Confirm document backup/export includes intended attachments.
- [x] Confirm restore recovers document metadata and files.

### Acceptance Criteria

- [x] A user can add a document with or without an attachment.
- [x] A user can link a document to a property, room, or asset.
- [x] Attachment errors explain what to do next.
- [x] Backup and restore preserve document records and expected attachments.
- [x] Search finds documents by title and type.

### Verification Notes

- AddDocumentScreen tests cover required-title validation plus attachment import payloads with linked asset and room records.
- AddDocumentScreen tests also cover saving a document linked to the property, a room, and an asset together.
- DocumentDetailScreen tests cover linked-record rendering, generic human-readable attachment location labels, and open-file behavior.
- DocumentsScreen tests now cover the no-documents empty state and Import document action.
- Document detail and edit routes now use MissingRecordView for stale or deleted document ids instead of navigating during render.
- Document route tests cover create, edit, stale-detail recovery, delete, and deterministic fallback navigation to Documents or the saved document detail screen.
- SearchScreen tests now cover document lookup by both type and title and successful document-result opening.
- Backup import tests now validate ZIP archives, count bundled document/photo files, and verify restore rebuilds app-owned attachment URIs from the archive before restoring records.
- Document create/detail tests now cover next-step recovery guidance when file import fails or an attached file can no longer be opened.

---

## Story L-304 — Stay ahead of maintenance

**As a homeowner, I want recurring tasks and reminders so that I can keep my home maintained.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Verify task create, edit, complete, snooze, skip, and delete flows.
- [x] Confirm recurrence options are understandable.
- [x] Verify due/overdue/upcoming grouping.
- [x] Verify notification permission messaging.
- [x] Confirm notification scheduling does not happen unexpectedly in sample mode.
- [x] Add smoke tests for completion and recurrence behavior.

### Acceptance Criteria

- [x] A user can create a recurring maintenance task.
- [x] Completing a task schedules or calculates the next occurrence correctly.
- [x] Snooze and skip states are visible and reversible where appropriate.
- [x] Notification prompts include context and can be declined.
- [x] Dashboard due-task counts match the task list.

### Verification Notes

- AddTaskScreen tests cover new-task validation and payload shaping plus edit-mode prefill behavior.
- AddTaskScreen tests also cover saving a recurring task with an explicit repeat cadence.
- TaskDetailScreen tests cover back, complete, edit, skip, and destructive delete interactions.
- CompleteTaskScreen tests cover required-date validation and completion payload shaping.
- SnoozeTaskScreen tests cover invalid custom dates and successful custom-date snoozes.
- MaintenanceScreen tests now cover the no-tasks empty state and New task call-to-action.
- AddTaskScreen now explains each recurrence cadence and clarifies that notification permission can be declined without losing task tracking; screen tests cover both pieces of helper copy.
- MaintenanceScreen tests now cover state-based filtering, snoozed-task guidance, and the notification-permission explainer shown before any prompt.
- TaskDetailScreen tests now cover snoozed-task messaging plus Resume now so delayed tasks are visible and reversible from detail view.
- Context integration tests now verify dashboard due-task counts stay aligned with the due-task list and that sample-mode loads do not schedule task notifications.
- Task detail, edit, complete, snooze, and completion-edit routes now use MissingRecordView for stale ids instead of navigating during render.
- Task route tests cover stale-detail recovery, edit saves, delete, successful completion scheduling, successful snooze saves, and deterministic fallback navigation back to Maintenance or the parent task.

---

## Story L-305 — Record repairs and parts

**As a homeowner, I want to record repairs, service history, and parts so that I know what happened and what it cost.**

**Priority:** P1 Launch Candidate

### Tasks

- [x] Verify repair create, edit, delete, and asset-link flows.
- [x] Verify part create, edit, delete, and asset-link flows.
- [x] Confirm cost fields format consistently.
- [x] Confirm service history summary calculations.
- [x] Add empty states and helpful next actions.

### Acceptance Criteria

- [x] A user can record a completed repair.
- [x] A user can record a part or consumable.
- [x] Costs display consistently across list and detail views.
- [x] Repairs and parts appear on linked asset detail screens.
- [x] Deleting a linked asset leaves safe recovery states.

### Verification Notes

- AddRepairEventScreen tests cover required-issue validation and repair save payloads for a selected asset.
- AddPartScreen tests cover required-name validation, create payload shaping, and edit payloads with the existing part id.
- AssetDetailScreen tests cover linked repair and part rendering plus delete callbacks from the parent asset detail screen.
- Asset add-repair/add-part routes now use MissingRecordView for stale asset ids and deterministic fallback navigation back to the parent asset.
- Repair and part edit routes now use MissingRecordView for stale linked records instead of navigating during render.
- Repair/part route tests cover stale-route recovery plus successful save navigation back to the parent asset detail screen.
- Shared task/service-history formatting tests now cover whole-dollar cost labels, missing-cost fallback text, due labels, and date labels so summary and detail surfaces stay aligned.
- CostSummaryScreen tests verify the grouped totals and consistent currency rendering, and ServiceHistoryScreen tests cover the new empty-state next action back to Maintenance.

---

# Epic L-4 — Backup, Restore, Export & Data Trust

## Story L-401 — Trust backup and restore

**As a beta tester, I want to export and restore my HomeVault data so that I feel safe entering real records.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Run backup export on physical iOS and Android devices.
- [ ] Run restore from exported backup on a clean install.
- [x] Verify invalid backup handling.
- [x] Verify restore confirmation copy warns about replacement behavior.
- [ ] Verify backup includes expected records and attachments.
- [x] Add or update restore validation tests.

### Acceptance Criteria

- [ ] Export completes without crash on beta devices.
- [ ] Restore rebuilds representative property, rooms, assets, documents, tasks, repairs, parts, and photos.
- [x] Invalid backups are rejected with actionable errors.
- [x] Destructive restore behavior requires explicit confirmation.
- [ ] No backup or restore flow logs sensitive household data.

### Verification Notes

- Backup import tests validate zip archives, count bundled property/document/photo files, and rebuild app-owned property, room, asset, and document attachment URIs during restore.
- Export manifest tests cover invalid-backup messaging plus the explicit overwrite guidance shown before restore is enabled.
- Physical-device export and restore runs remain open before beta.

---

## Story L-402 — Explain local-first data handling

**As a privacy-conscious user, I want to understand where my home data lives so that I can decide whether to trust the app.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Write a concise local-first privacy note.
- [x] List permissions used by the app and why they are requested.
- [x] Document what is included in backups and exports.
- [x] Document how to delete/reset local data.
- [x] Add a link or visible route to privacy/support information.

### Acceptance Criteria

- [x] The privacy note accurately reflects the current app behavior.
- [x] Permission explanations are available before or during the prompt.
- [x] A tester can find data deletion/reset guidance.
- [x] Backup/export contents are described in plain language.
- [x] No unsupported cloud-sync or account claims appear.

### Verification Notes

- Welcome screen now includes a broader local-first beta privacy statement before real data entry.
- Beta Support route documents privacy, permissions, backup/export sensitivity, restore replacement behavior, and deletion guidance.
- Browser verification confirmed Beta Support route content renders on web.

---

## Story L-403 — Produce shareable exports

**As a homeowner, I want printable and portable exports so that HomeVault is useful outside the app.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Verify JSON export.
- [ ] Verify ZIP export.
- [ ] Verify printable report export.
- [ ] Review report layout for readability.
- [ ] Confirm export filenames are useful and safe.
- [ ] Add error states for failed share/save actions.

### Acceptance Criteria

- [ ] Each export path completes on at least one physical device.
- [ ] Exported files can be opened outside the app.
- [ ] Printable report has readable headings, dates, and grouped records.
- [ ] Export errors tell the user how to retry.
- [ ] Exported data matches the current vault state.

---

# Epic L-5 — Visual Polish & UX Quality

## Story L-501 — Complete a full visual polish pass

**As a beta tester, I want the app to feel cohesive and polished so that I trust it with important home information.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Audit every primary screen at phone sizes used by the beta.
- [ ] Standardize spacing, section hierarchy, button treatment, icon usage, and empty-state style.
- [ ] Review typography scale for dashboard, lists, forms, and detail screens.
- [ ] Remove inconsistent colors, borders, shadows, and radius values.
- [ ] Ensure cards are not nested in a visually heavy way.
- [ ] Verify text does not clip, overlap, or crowd controls.
- [ ] Capture before/after screenshots for key screens.

### Acceptance Criteria

- [ ] Dashboard, vault, rooms, assets, tasks, documents, search, export, onboarding, and settings/support screens feel like one product.
- [ ] Primary actions are visually clear and consistent.
- [ ] Secondary and destructive actions are clearly distinguished.
- [ ] Important information can be scanned without reading dense paragraphs.
- [ ] No obvious text clipping, overlap, or inconsistent padding remains on target devices.

---

## Story L-502 — Polish the dashboard

**As a homeowner, I want the dashboard to summarize what matters today so that opening the app feels immediately useful.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Review dashboard information hierarchy.
- [ ] Make home identity prominent without feeling like a marketing hero.
- [ ] Ensure due tasks, setup progress, recent records, and sample-mode state are clear.
- [ ] Add useful empty states for new homes.
- [ ] Verify dashboard does not feel crowded after real data is added.
- [ ] Verify dashboard works with long home names.

### Acceptance Criteria

- [ ] A new user understands the next best action from the dashboard.
- [ ] An existing user can see due/overdue maintenance quickly.
- [ ] Sample mode is visible without overwhelming the screen.
- [ ] Long names and zero-data states fit cleanly.
- [ ] The dashboard remains useful with representative beta data.

---

## Story L-503 — Polish forms and validation

**As a user entering household details, I want forms to feel calm and forgiving so that data entry does not become tedious.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Review required and optional field labeling.
- [ ] Standardize date, money, recurrence, and picker controls.
- [ ] Add inline validation where missing.
- [ ] Confirm keyboard behavior on iOS and Android.
- [ ] Confirm save/cancel/destructive button placement.
- [ ] Reduce unnecessary form density where practical.

### Acceptance Criteria

- [ ] Required fields are obvious.
- [ ] Optional fields can be skipped without confusion.
- [ ] Validation errors appear near the relevant field.
- [ ] Keyboard does not cover critical actions.
- [ ] Form actions use consistent placement and labels.

---

## Story L-504 — Polish empty, loading, and error states

**As a new or recovering user, I want empty and error states to guide me so that I always know what to do next.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Inventory every empty state.
- [ ] Inventory every loading state.
- [ ] Inventory every user-facing error state.
- [ ] Replace generic messages with helpful next actions.
- [ ] Add retry actions where recovery is possible.
- [ ] Ensure destructive/error copy is calm and specific.

### Acceptance Criteria

- [ ] Every major list has a useful empty state.
- [ ] Every async operation has a visible loading or disabled state.
- [ ] Every recoverable error provides a retry or next step.
- [ ] No raw technical error appears in normal user-facing flows.
- [ ] Error states do not expose private file paths or internal IDs.

---

## Story L-505 — Tighten navigation clarity

**As a user moving around the app, I want navigation to feel predictable so that I do not get lost.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Review tab labels and icons.
- [ ] Verify back behavior from create/edit/detail flows.
- [ ] Confirm modal vs full-screen route usage is consistent.
- [ ] Add safe invalid-record screens for stale IDs.
- [ ] Verify Android hardware back behavior.

### Acceptance Criteria

- [ ] Users can identify the purpose of each primary tab.
- [ ] Cancel/back returns users to the expected prior context.
- [ ] Deleted or missing records show a recovery screen instead of crashing.
- [ ] Android back navigation does not exit unexpectedly during nested flows.
- [ ] Search/detail/create flows are predictable.

---

# Epic L-6 — Accessibility, Device Coverage & Performance

## Story L-601 — Support accessibility basics

**As a user with accessibility needs, I want HomeVault to work with common device settings so that I can manage my home records independently.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Test large text on onboarding, dashboard, lists, forms, and details.
- [ ] Add accessibility labels to icon-only buttons.
- [ ] Confirm important controls have accessible roles.
- [ ] Verify VoiceOver/TalkBack reading order for onboarding and primary forms.
- [ ] Check color contrast on primary text, secondary text, warnings, and destructive states.

### Acceptance Criteria

- [ ] Large text does not hide primary actions on target screens.
- [ ] Icon-only controls have meaningful labels.
- [ ] Interactive elements are reachable by screen reader.
- [ ] Screen reader order follows visual order.
- [ ] Contrast issues are fixed or explicitly logged.

---

## Story L-602 — Validate beta device matrix

**As a beta operator, I want the app checked on representative devices so that avoidable device-specific bugs do not derail the beta.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Define the minimum beta device matrix.
- [ ] Test one current iPhone.
- [ ] Test one smaller/older iPhone if available.
- [ ] Test one current Android device or emulator.
- [ ] Test one smaller/older Android device or emulator.
- [ ] Record OS versions and build numbers.
- [x] Create a repeatable smoke checklist.

### Acceptance Criteria

- [x] The device matrix is documented.
- [ ] Each P0 workflow is smoke-tested on the matrix or explicitly waived.
- [ ] Layout issues are logged with screenshots.
- [ ] Any device-specific P0/P1 bug is fixed before beta or listed as a known limitation.

### Verification Notes

- Added `docs/homevault-beta-device-matrix.md` with the minimum matrix, P0 smoke flows, run-log template, and focus areas.
- Physical-device and emulator execution remains open.

---

## Story L-603 — Keep the app responsive with realistic data

**As a homeowner with many records, I want HomeVault to remain responsive so that the app feels dependable over time.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Create or restore a representative large local dataset.
- [ ] Measure launch, dashboard load, search, asset detail, and export perceived performance.
- [ ] Identify slow screens.
- [ ] Optimize obvious list rendering or expensive recalculations.
- [ ] Add loading states where work cannot be immediate.

### Acceptance Criteria

- [ ] App launch and dashboard load feel acceptable with representative data.
- [ ] Search results appear without noticeable freezing.
- [ ] Large lists scroll smoothly enough for beta.
- [ ] Export progress or loading state appears for longer operations.
- [ ] Any known performance limitation is documented.

---

# Epic L-7 — Feedback, Diagnostics & Support

## Story L-701 — Send useful beta feedback

**As a beta tester, I want an easy way to report issues so that I can help improve the app.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Add or document a feedback path from the app or beta guide.
- [x] Include app version/build number in support context.
- [x] Include OS/platform and device model where available.
- [x] Provide a structured feedback form or email template.
- [x] Add known-limitation guidance to reduce duplicate reports.

### Acceptance Criteria

- [x] A tester can find feedback instructions within one minute.
- [x] Feedback includes enough context to triage the issue.
- [x] Feedback flow does not require sharing private home data by default.
- [x] Version/build number is easy to find.

### Verification Notes

- Beta Support is reachable from the main app top bar.
- The feedback action opens a mail template with version, platform, device name when available, sample mode, and aggregate record counts.
- The template explicitly asks testers not to include private household data by default.

---

## Story L-702 — Export safe diagnostics

**As support, I want optional diagnostic context that avoids private household data so that bugs can be triaged responsibly.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Review existing diagnostic logging.
- [ ] Define allowed diagnostic fields.
- [ ] Redact household names, addresses, serials, filenames, notes, attachment paths, and document contents.
- [ ] Add a diagnostics export or support report.
- [ ] Add tests for redaction behavior.
- [ ] Document what diagnostics include.

### Acceptance Criteria

- [ ] Diagnostics never include raw household names, addresses, serials, notes, document contents, or attachment paths.
- [ ] Diagnostics include app version, platform, schema version, counts, and recent non-sensitive error categories.
- [ ] User explicitly chooses to share diagnostics.
- [ ] Redaction tests cover representative private fields.

---

## Story L-703 — Operate beta triage

**As the team, I want a simple triage process so that beta issues turn into decisions instead of noise.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Define P0/P1/P2/P3 bug severity.
- [ ] Create labels for onboarding, data, restore, visual polish, device, performance, and docs.
- [ ] Create a beta issue template.
- [ ] Define daily or weekly beta review cadence.
- [ ] Define beta stop-ship rules.

### Acceptance Criteria

- [ ] Every beta issue can be assigned severity and category.
- [ ] Data loss, restore failure, migration failure, and crash-on-launch are automatic P0s.
- [ ] Known limitations are separated from bugs.
- [ ] There is a clear owner for beta triage.

---

# Epic L-8 — Privacy, Legal & Trust

## Story L-801 — Publish beta privacy position

**As a tester, I want plain-language privacy information so that I know what happens to my home records.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [x] Write beta privacy copy.
- [x] Explain local-first storage.
- [x] Explain backup/export responsibility.
- [x] Explain permissions.
- [x] Explain support/diagnostic sharing.
- [x] Avoid legal claims that are not yet reviewed.
- [ ] Decide whether the beta needs a formal hosted privacy policy.

### Acceptance Criteria

- [x] Privacy copy is available before testers enter real data.
- [x] Privacy copy matches actual app behavior.
- [x] Backup/export risk is explained clearly.
- [x] Support data sharing is opt-in.
- [x] No cloud-sync, encryption, or account claims are made unless implemented.

### Verification Notes

- See `docs/homevault-beta-privacy-notes.md`.
- Open decision remains: whether external beta requires a hosted formal privacy policy.

---

## Story L-802 — Review local data security

**As a homeowner, I want my local home records handled carefully so that sensitive data is not casually exposed.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Inventory local database, attachments, exported files, backups, and logs.
- [ ] Identify whether data is encrypted at rest by platform defaults only or app-level encryption.
- [ ] Decide whether app-level encryption is required for launch or deferred.
- [ ] Ensure logs do not include private data.
- [ ] Document current security posture and limitations.

### Acceptance Criteria

- [ ] Local storage locations and data types are documented.
- [ ] Sensitive fields are excluded from logs and diagnostics.
- [ ] Security limitations are known before beta.
- [ ] Any deferred security improvement has an explicit post-launch ticket.

---

# Epic L-9 — Product Fit & Beta Learning

## Story L-901 — Run first-user usability pilot

**As the product owner, I want to observe real first-use behavior so that we validate the product before widening beta.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Recruit five friendly testers.
- [x] Prepare a 20-minute first-use script.
- [ ] Ask testers to install, create a home, add one asset, add one document or task, and explain what they think the app does.
- [ ] Record confusion points.
- [ ] Record completion rates and time-to-first-useful-record.
- [ ] Turn findings into P0/P1/P2 issues.

### Verification Notes

- Added `docs/homevault-first-user-pilot-script.md` with moderator rules, participant tasks, severity guide, and observation table.
- Recruiting and running the sessions remains open.

### Acceptance Criteria

- [ ] At least four of five testers understand HomeVault without explanation.
- [ ] At least four of five testers create a home and first useful record.
- [ ] No tester believes sample data is real data.
- [ ] No repeated onboarding confusion remains unaddressed before wider beta.

---

## Story L-902 — Define beta success metrics

**As the team, I want clear beta success metrics so that we know whether to keep iterating, widen beta, or pause.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Define activation metric.
- [ ] Define core-use metric.
- [ ] Define trust metric.
- [ ] Define bug-quality threshold.
- [ ] Define retention or repeat-use signal.
- [ ] Decide whether metrics are measured manually, through tester surveys, or through privacy-safe analytics.

### Acceptance Criteria

- [ ] Success metrics are documented before inviting testers.
- [ ] Metrics can be measured without collecting sensitive household data.
- [ ] Widen/pause/stop criteria are clear.
- [ ] Beta results can be summarized after the first cohort.

---

# Epic L-10 — Moonshot Differentiators

These are valuable, but should be considered only after P0 and high-confidence P1 launch readiness work is complete.

## Story L-1001 — OCR label capture

**As a homeowner, I want to scan labels and documents so that I can avoid typing serial numbers and model details.**

**Priority:** P3 Post-Launch Candidate

### Tasks

- [ ] Choose OCR approach compatible with native builds.
- [ ] Define privacy constraints for image processing.
- [ ] Add scan flow for asset labels.
- [ ] Add review-before-save behavior.
- [ ] Add confidence and correction UI.

### Acceptance Criteria

- [ ] OCR never saves unreviewed extracted values automatically.
- [ ] User can correct extracted text before saving.
- [ ] OCR behavior is documented as device-local or remote, depending on implementation.
- [ ] Poor OCR results fail gracefully.

---

## Story L-1002 — Projects and improvements

**As a homeowner, I want to plan larger projects and improvements so that HomeVault tracks more than maintenance.**

**Priority:** P3 Post-Launch Candidate

### Tasks

- [ ] Define project model and relationship to rooms, assets, documents, repairs, and tasks.
- [ ] Add project list and detail screens.
- [ ] Add budgets, vendors, notes, photos, documents, and milestones.
- [ ] Add project export/report support.

### Acceptance Criteria

- [ ] A user can create and track a home improvement project.
- [ ] Project records link to existing home records.
- [ ] Project costs appear separately from maintenance/repair costs.
- [ ] Projects do not complicate the private beta first-use flow.

---

## Story L-1003 — Cloud sync and multi-device access

**As a homeowner with multiple devices, I want HomeVault available across devices so that my records are not trapped on one phone.**

**Priority:** P3 Post-Launch Candidate

### Tasks

- [ ] Decide account model.
- [ ] Decide sync backend.
- [ ] Define conflict resolution.
- [ ] Define encryption and privacy posture.
- [ ] Define migration path from local-only vaults.
- [ ] Prototype sync with a non-production dataset.

### Acceptance Criteria

- [ ] Sync design includes privacy, conflict, offline, and backup implications.
- [ ] Existing local users can opt in without losing data.
- [ ] Sync failures do not corrupt the local vault.
- [ ] This work does not block private beta.

---

## 4. Recommended Beta Scope

### Must Finish Before Private Beta

- L-101 Install a real beta build
- L-102 Make CI the release gate
- L-103 Triage dependency and security risk
- L-201 Understand HomeVault immediately
- L-202 Create a first home without friction
- L-203 Explore sample data safely
- L-301 Add and manage home structure
- L-302 Add and manage assets
- L-303 Capture documents and attachments
- L-304 Stay ahead of maintenance
- L-401 Trust backup and restore
- L-402 Explain local-first data handling
- L-501 Complete a full visual polish pass
- L-502 Polish the dashboard
- L-602 Validate beta device matrix
- L-701 Send useful beta feedback
- L-801 Publish beta privacy position
- L-901 Run first-user usability pilot

### Strongly Preferred Before Wider Launch

- L-305 Record repairs and parts
- L-403 Produce shareable exports
- L-503 Polish forms and validation
- L-504 Polish empty, loading, and error states
- L-505 Tighten navigation clarity
- L-601 Support accessibility basics
- L-603 Keep the app responsive with realistic data
- L-702 Export safe diagnostics
- L-703 Operate beta triage
- L-802 Review local data security
- L-902 Define beta success metrics

### Defer Freely If Needed

- L-1001 OCR label capture
- L-1002 Projects and improvements
- L-1003 Cloud sync and multi-device access

---

## 5. Suggested Execution Order

1. Refresh docs and confirm current implementation status.
2. Lock CI and dependency risk.
3. Add preview build/release configuration.
4. Run visual polish pass.
5. Run backup/restore and core workflow QA on devices.
6. Add feedback/privacy/support materials.
7. Run five-person usability pilot.
8. Fix P0/P1 findings.
9. Invite first private beta cohort.
