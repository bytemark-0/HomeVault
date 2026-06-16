# HomeVault Improvement Roadmap

**Prepared:** June 16, 2026  
**Reviewed branch:** `codex/homevault-stabilization`  
**Purpose:** Convert the current application review into a working backlog with clear completion criteria and release gates.

---

## 1. Current Baseline

HomeVault is already a functional local-first Expo/React Native application with:

- Local SQLite persistence
- Property, room, asset, document, task, repair, completion, and parts records
- Asset, room, property, and task-completion photos
- Document attachment storage
- Recurring maintenance, snoozing, skipped occurrences, and notifications
- Warranty alerts
- Service history and cost summaries
- JSON, ZIP, and printable exports
- Backup validation and guarded restore
- Global search
- Barcode lookup
- In-memory and repository-level tests
- TypeScript, ESLint, and CI foundations

The remaining work should focus on stability, maintainability, release readiness, and product validation rather than rapidly adding unrelated features.

---

## 2. Definition of Done for Every Task

A task is complete only when all applicable conditions below are met:

- [ ] The implementation is committed on the active development branch.
- [ ] `npm install` or `npm ci` succeeds from a clean clone.
- [ ] Type checking passes.
- [ ] Linting passes.
- [ ] Automated tests pass.
- [ ] New or changed behavior has automated coverage where practical.
- [ ] Manual verification steps are documented and completed.
- [ ] Existing primary workflows have not regressed.
- [ ] User-visible errors provide an actionable next step.
- [ ] Relevant README, architecture, or support documentation is updated.
- [ ] Native functionality is verified on at least one physical device.
- [ ] No sensitive household data, document contents, addresses, serial numbers, or attachment paths are written to analytics or crash logs.

---

# Phase 0 — Release-Blocking Engineering Stabilization

No major new product area should begin until this phase is complete.

## HV-001 — Make Build and Test Scripts Portable

**Priority:** P0  
**Status:** Not started  
**Dependencies:** None

### Problem

The root package scripts currently reference machine-specific absolute paths under `/private/tmp/homevault-package-tests`. These paths can fail on another computer, Windows, a clean CI runner, or a fresh clone.

### Work Required

- Replace all absolute temporary paths with repository-relative output paths.
- Define a consistent generated-test directory, such as `.build/tests` or `dist-tests`.
- Add a clean step that removes generated output before compilation.
- Ensure fixture generation uses the same portable output location.
- Avoid shell syntax that only works on one operating system.
- Add generated folders to `.gitignore`.
- Update README commands to reflect the final workflow.

### Completion Criteria

- [ ] No package script contains `/private/tmp`, a user home directory, or another machine-specific path.
- [ ] From a clean clone, `npm ci`, `npm run typecheck`, `npm run lint`, and `npm test` all pass.
- [ ] Sample backup fixture generation works without manually creating directories.
- [ ] The commands work on macOS and the Linux CI runner.
- [ ] Running tests twice in succession produces the same result.
- [ ] Generated files do not appear as untracked repository changes unless intentionally regenerated.
- [ ] README instructions match the working commands.

### Verification Evidence

Record the clean-clone commands and CI run link in the task or pull request.

---

## HV-002 — Establish a Complete CI Release Gate

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-001

### Problem

CI exists, but it must become the authoritative release gate and verify all important build paths rather than only part of the application.

### Work Required

Create or update the GitHub Actions workflow to run:

1. Dependency installation using `npm ci`
2. Package type checking
3. Mobile application type checking
4. ESLint
5. Package and repository tests
6. Web export or production web build
7. Fixture consistency check
8. Optional upload of test/build artifacts on failure

Also:

- Pin the Node major version used by the project.
- Use dependency caching without caching generated application state.
- Prevent merges when required checks fail.
- Document required checks in the README or contributing guide.

### Completion Criteria

- [ ] A clean GitHub Actions runner completes every required check.
- [ ] Intentionally introducing a TypeScript error causes CI to fail.
- [ ] Intentionally introducing a lint error causes CI to fail.
- [ ] Intentionally breaking a test causes CI to fail.
- [ ] A production web export/build completes in CI.
- [ ] CI does not depend on files outside the repository.
- [ ] Required branch checks are documented.
- [ ] The default development branch is green before additional work continues.

---

## HV-003 — Replace the Custom App Mode Router

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-001, HV-002

### Problem

`App.tsx` currently acts as a manual router through a large `AppMode` union and several selected-record and return-target state variables. This increases the risk of broken back behavior, stale selected IDs, and hard-to-test navigation.

### Work Required

- Select Expo Router or React Navigation and record the decision in an architecture decision record.
- Define typed route parameters for assets, rooms, documents, tasks, repairs, parts, completions, export, and search.
- Convert the existing five-tab layout to the selected navigation framework.
- Convert add, edit, detail, complete, snooze, repair, export, and search screens to routes.
- Replace manual return-target state with navigation history or explicit route parameters only where necessary.
- Preserve all current create/edit/delete return paths.
- Add a not-found or invalid-record state for stale route IDs.
- Add support for future deep linking, even if external links are not yet enabled.

### Completion Criteria

- [ ] The `AppMode` union is removed.
- [ ] Manual `assetReturnTarget`, `documentReturnTarget`, `taskReturnTarget`, and equivalent routing state are removed unless a documented exception remains.
- [ ] The root application component is responsible for providers and the navigation container, not individual record routing.
- [ ] Every currently exposed screen is reachable through a typed route.
- [ ] System back gestures and Android back navigation return to the expected prior screen.
- [ ] Create, edit, delete, complete, snooze, and cancel flows return to the correct screen.
- [ ] Opening a route for a deleted or invalid record shows a safe recovery screen rather than crashing.
- [ ] Navigation tests cover the five most important multi-screen flows.
- [ ] Physical-device smoke testing passes on iOS and Android.

---

## HV-004 — Separate Application State and Services from the Root Component

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-003

### Problem

The root component currently coordinates data loading, CRUD actions, backup state, restore state, notifications, selected records, screen state, and feedback. Continued feature work will make this increasingly difficult to maintain.

### Work Required

Create clear application boundaries:

- `RepositoryProvider` or equivalent data-access dependency provider
- Household/property data hooks
- Backup and restore service
- Export and printable-report service
- Notification scheduling service
- Attachment and media storage service
- Toast/feedback provider
- Central error boundary
- Query invalidation or reload strategy after mutations

Screens should invoke domain-level operations rather than directly coordinating unrelated services.

### Completion Criteria

- [ ] The root component contains no record-specific CRUD handlers.
- [ ] Backup, restore, export, notification, and attachment operations each have a defined service boundary.
- [ ] Screens access repositories and services through typed hooks or injected dependencies.
- [ ] Mutation success refreshes only the data that needs refreshing, or a documented simple global refresh strategy is used.
- [ ] Services can be replaced with test doubles.
- [ ] Existing in-memory repository tests continue to pass.
- [ ] At least one screen integration test uses a test repository through the new provider.
- [ ] Architecture documentation explains where new data operations should be added.

---

## HV-005 — Harden SQLite Schema Versioning and Migrations

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-001

### Problem

The app has accumulated fields through `ensureColumn` migrations. This is useful during rapid development, but production releases need deterministic, versioned, and testable migration behavior.

### Work Required

- Add an explicit database schema version.
- Define ordered migrations from each supported schema version to the current version.
- Make migrations transactional where SQLite permits.
- Preserve existing asset, task, completion, repair, document, photo, and attachment data.
- Add migration fixtures representing earlier database versions.
- Add startup recovery for migration failure.
- Define whether unsupported ancient schemas are migrated, exported, or rejected.
- Document backup recommendations before destructive migrations.

### Completion Criteria

- [ ] The database reports a single current schema version.
- [ ] Migrations run in a deterministic order.
- [ ] Reopening an already migrated database does not rerun destructive work.
- [ ] Automated tests migrate each retained historical fixture to the current schema.
- [ ] Record counts and important field values match before and after migration.
- [ ] Photos, attachment metadata, task completions, repair history, and recurrence fields survive migration.
- [ ] A simulated migration failure leaves the prior database recoverable.
- [ ] The app displays an actionable error rather than silently resetting data.
- [ ] Migration behavior is documented.

---

## HV-006 — Add Production-Safe Error Handling and Observability

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-004

### Problem

Loading and toast errors exist, but a production beta also needs structured crash handling and enough diagnostic context to understand failures without collecting sensitive household data.

### Work Required

- Add a global React error boundary.
- Add structured handling for repository, migration, file-copy, export, restore, notification, and camera failures.
- Integrate a crash-reporting service or define a local diagnostic-log approach.
- Redact record names, addresses, serial numbers, notes, document text, filenames, and attachment paths.
- Tag reports with application version, platform, schema version, and operation name.
- Provide a user-facing recovery action where possible.
- Disable or clearly identify development-only logging.

### Completion Criteria

- [ ] A forced render exception shows a recovery screen and produces a diagnostic event.
- [ ] A forced asynchronous repository failure produces an actionable user message.
- [ ] Diagnostic events include application version, platform, schema version, and error category.
- [ ] Diagnostic events do not contain household names, property addresses, asset serials, notes, OCR text, or attachment paths.
- [ ] Users can retry or return safely from recoverable errors.
- [ ] Crash reporting can be disabled in development and test environments.
- [ ] Error-handling behavior is documented.

---

## HV-007 — Add Screen Integration and End-to-End Test Coverage

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-003, HV-004, HV-005

### Problem

Current utility and repository tests are valuable, but they do not prove that users can complete critical multi-screen workflows.

### Work Required

- Add React Native Testing Library for screen and form integration tests.
- Add Maestro or Detox for a small critical-path physical/emulator suite.
- Introduce stable test IDs only where accessible labels are insufficient.
- Create deterministic seed data for test runs.
- Cover validation, navigation, persistence, and destructive confirmations.

### Required Integration Tests

- Create and edit a property.
- Add a room.
- Add, edit, duplicate, and view an asset.
- Attach and link a document.
- Create, snooze, complete, skip, edit, and delete a task completion.
- Add, edit, and delete a repair event.
- Add and edit a part.
- Perform global search.
- Generate an export.
- Validate and restore a backup.
- Delete a room and verify documented cascade behavior.
- Open a record whose attachment is missing.

### Required End-to-End Tests

At minimum:

1. First launch → create household/property → add room → add asset
2. Add recurring maintenance task → snooze → complete with photo
3. Add document attachment → export ZIP → confirm export success
4. Restore known backup → verify record counts and representative records
5. Delete room with child records → confirm cascade behavior and preserved documents

### Completion Criteria

- [ ] Screen tests run in CI.
- [ ] The five critical end-to-end flows pass on the supported emulator configuration.
- [ ] Validation errors are asserted, not only happy paths.
- [ ] Destructive operations require and test confirmation.
- [ ] Tests do not depend on production user data or network availability, except explicitly mocked product lookup.
- [ ] A failed test provides enough output to identify the failed workflow.
- [ ] Flaky tests are not accepted as required branch checks.

---

## HV-008 — Complete a Local-Data Security and Privacy Review

**Priority:** P0  
**Status:** Not started  
**Dependencies:** HV-004, HV-006

### Problem

HomeVault may contain addresses, appliance serial numbers, receipts, warranties, contractor invoices, and photos. Local-first reduces cloud exposure but does not remove privacy and data-handling risks.

### Work Required

- Create a lightweight threat model.
- Inventory every storage location used by SQLite, documents, photos, exports, logs, and preferences.
- Review file-sharing behavior and temporary-file cleanup.
- Verify that exported backups clearly warn users they may contain sensitive data.
- Review operating-system backup behavior.
- Ensure reset/delete behavior removes app-owned files as documented.
- Define what happens when a referenced external file disappears.
- Review barcode/product lookup requests for unnecessary data transmission.
- Confirm crash and analytics redaction.
- Document future cloud-security requirements separately.

### Completion Criteria

- [ ] A threat-model document identifies assets, trust boundaries, likely threats, and mitigations.
- [ ] Every app-owned data directory is documented.
- [ ] Demo reset and full local reset behavior are tested for both database records and copied files.
- [ ] Shared exports use user-initiated operating-system share flows.
- [ ] Temporary export files are cleaned up or have a documented lifecycle.
- [ ] Missing external files produce a clear status rather than a crash.
- [ ] Logs and crash reports pass the sensitive-data review.
- [ ] Privacy documentation accurately describes local storage and external lookups.

---

# Phase 1 — Private Beta Readiness

## HV-101 — Replace Demo-Oriented Startup with Production Onboarding

**Priority:** P1  
**Status:** Not started  
**Dependencies:** Phase 0

### Problem

The current application has demo workspace onboarding and assumes at least one local property exists. A real user needs a clear first-run experience without confusion about sample versus personal data.

### Work Required

Create a first-run sequence that explains:

1. What HomeVault stores
2. That data is local-first
3. Why creating a backup matters
4. Notification, photo, camera, and file permissions
5. Creating the first property
6. Adding the first room or system
7. Adding the first asset
8. Creating the first maintenance task

Demo data should be optional and visibly separate from real data.

### Completion Criteria

- [ ] A new installation can start with no pre-created user property.
- [ ] The user can choose “Start empty” or “Explore demo.”
- [ ] Demo data is clearly labeled and can be removed safely.
- [ ] The user can complete onboarding without granting optional permissions.
- [ ] Progress survives app restart.
- [ ] The first useful setup can be completed without navigating through unexplained empty tabs.
- [ ] Onboarding has accessibility labels and supports dynamic text.
- [ ] An automated test covers both empty and demo onboarding paths.

---

## HV-102 — Improve Permission and Privacy Messaging

**Priority:** P1  
**Status:** Not started  
**Dependencies:** HV-101, HV-008

### Problem

Camera, photo library, files, and notifications are important but optional. Generic operating-system prompts can reduce trust or lead users to deny access without understanding the feature.

### Work Required

- Add a pre-permission explanation before each first request.
- Request permissions only when the user invokes the related feature.
- Explain how to continue without the permission.
- Add “Open Settings” recovery for denied permissions.
- Ensure the copy accurately reflects actual data use.
- Do not repeatedly prompt after denial.

### Completion Criteria

- [ ] Camera permission is not requested until camera capture is selected.
- [ ] Photo permission is not requested until library selection is selected.
- [ ] Notification permission is requested after explaining maintenance reminders.
- [ ] Denied permission states provide manual alternatives.
- [ ] Permanently denied permissions provide an operating-system settings path.
- [ ] Permission explanations match the privacy policy.
- [ ] iOS and Android denial/recovery flows are manually verified.

---

## HV-103 — Polish Backup, Restore, and Data-Trust UX

**Priority:** P1  
**Status:** Not started  
**Dependencies:** HV-005, HV-008, HV-101

### Problem

The backup engine is strong, but users must understand what is included, where the file goes, and what will happen during restore.

### Work Required

- Explain JSON versus ZIP backup contents.
- Clearly state whether copied attachments and photos are included.
- Display last successful backup and restore dates.
- Warn when no recent backup exists.
- Provide restore preview summaries and representative changes.
- Add post-restore validation and a link to inspect restored data.
- Add help content for moving backups between devices.

### Completion Criteria

- [ ] Users can identify which export format contains attachments.
- [ ] Backup status clearly distinguishes “never backed up,” “backup created,” and “backup restored.”
- [ ] Restore cannot begin before validation and preview.
- [ ] Restore conflict messaging explains what current data will be replaced.
- [ ] Successful restore confirms record counts and property identity.
- [ ] Failed restore does not partially replace current data.
- [ ] Backup/restore help is accessible from the relevant screen.
- [ ] End-to-end backup and restore tests pass.

---

## HV-104 — Add a Diagnostics and Support Export Screen

**Priority:** P1  
**Status:** Not started  
**Dependencies:** HV-006, HV-008

### Problem

Beta testers need a safe way to report problems without manually describing application and database state or exposing personal household information.

### Work Required

Add a diagnostics screen containing:

- App version and build number
- Platform and operating-system version
- Database schema version
- Record counts by type
- Attachment counts and missing-file counts
- Last backup and restore timestamps
- Notification permission and scheduling status
- Recent redacted error categories
- Copy/share diagnostics action

### Completion Criteria

- [ ] Diagnostics contain no record titles, names, addresses, notes, OCR text, serial numbers, filenames, or raw paths.
- [ ] Users can copy or share the report.
- [ ] The report includes enough information to reproduce common migration, attachment, notification, and export issues.
- [ ] Diagnostic generation works when the repository is partially unavailable.
- [ ] A redaction test verifies representative sensitive values are absent.
- [ ] Support documentation explains how to collect the report.

---

## HV-105 — Complete the Device, Accessibility, and Performance Matrix

**Priority:** P1  
**Status:** Not started  
**Dependencies:** HV-003, HV-007

### Problem

The app has been tested on a real iPhone, but a beta needs broader confidence across screen sizes, Android behavior, dynamic text, and realistic data volumes.

### Work Required

Test at minimum:

- Small iPhone screen
- Current standard iPhone screen
- Large iPhone screen
- One midrange physical Android device
- One recent Android emulator
- Dynamic text at large accessibility sizes
- VoiceOver and TalkBack primary flows
- Dark mode behavior, whether supported or explicitly fixed to light mode
- A household with 500 assets, 1,000 documents, and 2,000 maintenance history records

Measure:

- Cold start
- Main dashboard load
- Search response
- Large list scrolling
- Export generation
- Restore preview

### Completion Criteria

- [ ] No primary action is clipped or unreachable on the supported device matrix.
- [ ] Forms remain usable with the keyboard open.
- [ ] Dynamic text does not hide save, cancel, delete, or confirmation actions.
- [ ] VoiceOver and TalkBack can identify compact and icon-only controls.
- [ ] Large datasets do not freeze the interface during normal navigation.
- [ ] Performance measurements and acceptable thresholds are documented.
- [ ] Any unsupported platform or mode is explicitly documented.

---

## HV-106 — Add Release Configuration, Legal, and Store Assets

**Priority:** P1  
**Status:** Not started  
**Dependencies:** HV-008, HV-105

### Problem

A working Expo project is not yet a distributable product. Beta and public distribution require production identifiers, signing, metadata, policies, and support paths.

### Work Required

- Define stable iOS bundle ID and Android application ID.
- Add EAS build profiles for development, preview, and production.
- Configure version and build-number strategy.
- Produce application icon, adaptive Android icon, and splash screen.
- Write privacy policy, terms, support, and data deletion instructions.
- Create store screenshots and descriptions.
- Add a support email or support page.
- Document release and rollback procedures.

### Completion Criteria

- [ ] Signed preview builds install on iOS and Android.
- [ ] Development, preview, and production configurations do not share accidental test settings.
- [ ] App name, identifiers, icons, splash screen, and version are consistent.
- [ ] Privacy policy accurately describes local storage, permissions, product lookup, diagnostics, and any crash reporting.
- [ ] Users can find support and local-data deletion instructions from inside the app.
- [ ] Store metadata contains no claims for unfinished sync or OCR behavior.
- [ ] A release checklist is stored in the repository.

---

## HV-107 — Distribute and Operate a Private Beta

**Priority:** P1  
**Status:** Not started  
**Dependencies:** HV-101 through HV-106

### Work Required

- Distribute through TestFlight and Google Play internal testing.
- Create a tester onboarding guide.
- Define a feedback form and support workflow.
- Track application version with every report.
- Establish a process for urgent data-loss or restore defects.
- Run backup and restore drills before each beta release.

### Completion Criteria

- [ ] At least one external tester installs each platform build.
- [ ] Testers can complete onboarding without developer assistance.
- [ ] Support reports include app version and diagnostics.
- [ ] No known P0 data-loss, migration, or restore defects remain open.
- [ ] A rollback or replacement build can be produced using the documented release process.
- [ ] Beta release notes identify known limitations.

---

# Phase 2 — OCR Label Capture Differentiator

OCR should begin after the local beta foundation is stable. It requires a native development build and should not be implemented as an unverified auto-fill shortcut.

## HV-201 — Establish the Native Build Foundation

**Priority:** P2  
**Status:** Not started  
**Dependencies:** HV-106

### Work Required

- Move OCR-related testing from Expo Go to an EAS development build.
- Select an actively maintained on-device text-recognition library.
- Verify iOS and Android native compatibility.
- Add required configuration plugins and permissions.
- Document local native development and build commands.

### Completion Criteria

- [ ] Development builds install and launch on physical iOS and Android devices.
- [ ] Existing camera, image, notifications, SQLite, file, and sharing features continue to work.
- [ ] Native dependencies build in CI or the documented EAS workflow.
- [ ] OCR processing can run without sending the image to an external service.
- [ ] The native-build setup is reproducible from a clean clone.

---

## HV-202 — Implement Guided Manufacturer-Label Capture

**Priority:** P2  
**Status:** Not started  
**Dependencies:** HV-201

### Work Required

Create a guided flow:

1. Explain how to frame the label
2. Capture or select an image
3. Crop or rotate when needed
4. Run text recognition
5. Detect likely brand, model, and serial values
6. Show extracted text and confidence
7. Require user confirmation
8. Save the confirmed fields and retain the source image when approved

### Completion Criteria

- [ ] OCR never overwrites existing asset data without confirmation.
- [ ] The user can edit every suggested field before saving.
- [ ] The user can save the label photo even when extraction fails.
- [ ] The parser handles common labels such as `MODEL`, `MOD`, `SERIAL`, `SER`, and `S/N`.
- [ ] Low-confidence results are visibly identified.
- [ ] Rotation and poor framing failures provide retry guidance.
- [ ] The flow works offline.
- [ ] The captured image follows the app-owned storage policy.

---

## HV-203 — Validate OCR Accuracy and Privacy

**Priority:** P2  
**Status:** Not started  
**Dependencies:** HV-202

### Work Required

Build a representative, non-user-private evaluation set containing at least:

- HVAC labels
- Water heaters
- Refrigerators
- Dishwashers
- Washers and dryers
- Electrical equipment
- Outdoor equipment
- Blurry, angled, reflective, and low-light examples

Track text-recognition success separately from field-parsing success.

### Completion Criteria

- [ ] The evaluation set contains at least 30 representative label images.
- [ ] At least 85% of readable labels produce usable OCR text.
- [ ] At least 70% of readable labels produce an exact or clearly correct model or serial suggestion.
- [ ] No test case silently saves an incorrect value.
- [ ] Images and extracted text remain local unless the user explicitly exports them.
- [ ] OCR failures do not block manual asset entry.
- [ ] Accuracy results and known weak label types are documented.

---

# Phase 3 — Projects and Improvements

The domain type exists, but full product support should wait until the core beta is stable.

## HV-301 — Add Project and Improvement Persistence

**Priority:** P3  
**Status:** Not started  
**Dependencies:** Phase 1

### Work Required

- Add project CRUD operations to the repository interface.
- Add SQLite schema and migrations.
- Add in-memory parity.
- Support title, dates, contractor, cost, notes, and linked records.
- Decide project status values such as planned, active, completed, and canceled.
- Include projects in backup, restore, and validation.

### Completion Criteria

- [ ] Projects persist across application restart.
- [ ] SQLite and in-memory repositories have matching behavior.
- [ ] Migration tests preserve existing user data.
- [ ] Projects are included in JSON and ZIP manifests.
- [ ] Restore preview includes project counts and conflicts.
- [ ] Repository and export tests cover projects.

---

## HV-302 — Build Project Management Screens

**Priority:** P3  
**Status:** Not started  
**Dependencies:** HV-301, HV-003

### Work Required

- Project list and empty state
- Add, edit, detail, and delete flows
- Link projects to rooms, assets, documents, and repair events
- Cost and contractor display
- Project timeline and status
- Attach project-related documents through the existing document model

### Completion Criteria

- [ ] Users can create, edit, complete, cancel, and delete a project.
- [ ] Projects can link to multiple existing records.
- [ ] Linked documents remain valid when a project is deleted.
- [ ] Project detail displays total cost and linked records.
- [ ] Navigation and destructive confirmations follow existing application standards.
- [ ] Screen integration tests cover the primary project lifecycle.

---

## HV-303 — Integrate Projects into Search, Reporting, and Export

**Priority:** P3  
**Status:** Not started  
**Dependencies:** HV-302

### Completion Criteria

- [ ] Global search returns matching projects.
- [ ] Property summaries optionally include completed improvements.
- [ ] Cost summaries can include or separate project costs.
- [ ] Printable reports clearly label project and maintenance expenses.
- [ ] Backup and restore round trips preserve all project links.
- [ ] Large project histories remain usable.

---

# Phase 4 — Product Validation and Sync Decision

Cloud sync should not start merely because user and household types already exist in the domain model.

## HV-401 — Run Structured Product Validation

**Priority:** P2 decision gate  
**Status:** Not started  
**Dependencies:** HV-107

### Required Tester Scenario

Ask each tester to:

- Create a property
- Add at least five assets
- Store at least two documents
- Create at least three maintenance tasks
- Complete at least one task
- Create a backup
- Restore a supplied or personal backup in a controlled test
- Use the application for at least two weeks

### Proposed Sync Go/No-Go Signals

Begin sync architecture only after:

- [ ] At least 10 external testers complete onboarding.
- [ ] At least 60% of onboarded testers enter five or more assets.
- [ ] At least 40% return during the following 14 days.
- [ ] At least three households independently request spouse, partner, or family sharing.
- [ ] Backup and restore are understood by most testers without developer assistance.
- [ ] No unresolved P0 data-loss issue remains.

These are proposed decision thresholds and can be revised after the first tester cohort.

### Completion Criteria

- [ ] Tester results are recorded without collecting unnecessary household content.
- [ ] Setup completion, return usage, backup usage, and requested features are summarized.
- [ ] The team records a written decision: remain local-only, add account backup, or build shared sync.
- [ ] The decision includes evidence rather than only developer preference.

---

## HV-402 — Write the Sync Architecture Decision Record

**Priority:** P3  
**Status:** Not started  
**Dependencies:** HV-401 go decision

### Work Required

The design must address:

- Authentication and account recovery
- Household membership and invitations
- Owner, editor, and viewer permissions
- Local-first IDs and server IDs
- Offline mutation queue
- Conflict detection and resolution
- Attachment and photo upload
- Encryption in transit and at rest
- Account deletion and export
- Device revocation
- Subscription enforcement
- Schema migration across clients and server
- Operational logging without leaking household content

### Completion Criteria

- [ ] The backend and authentication provider are selected with documented tradeoffs.
- [ ] Every record type has a sync and conflict policy.
- [ ] Attachment upload and deletion semantics are defined.
- [ ] Household authorization rules are documented and testable.
- [ ] Account deletion removes server data within the documented lifecycle.
- [ ] A security review is completed before implementation.
- [ ] The ADR defines the smallest safe first cloud slice.

---

## HV-403 — Implement Optional Account Backup Before Shared Editing

**Priority:** P3  
**Status:** Not started  
**Dependencies:** HV-402

### Rationale

A safer first cloud capability is optional authenticated backup and device recovery. Real-time shared editing can follow after cloud storage, encryption, and account lifecycle behavior are proven.

### Completion Criteria

- [ ] Local-only use remains available unless the product decision explicitly changes.
- [ ] Users can create an account and opt into encrypted cloud backup.
- [ ] A second device can restore the authorized household.
- [ ] Local edits continue when offline.
- [ ] Backup version and schema compatibility are enforced.
- [ ] Account deletion removes cloud backups and revokes access.
- [ ] Cloud failure cannot destroy the local vault.
- [ ] Security, recovery, and deletion tests pass.

---

## HV-404 — Add Household Sharing and Conflict Handling

**Priority:** P4  
**Status:** Not started  
**Dependencies:** HV-403

### Completion Criteria

- [ ] Owners can invite and remove members.
- [ ] Editor and viewer permissions are enforced on the server, not only in the interface.
- [ ] Offline edits sync when connectivity returns.
- [ ] Simultaneous edits produce a documented and understandable outcome.
- [ ] Attachment conflicts do not silently discard files.
- [ ] Removed members lose access on all devices.
- [ ] Audit information identifies the actor without exposing unnecessary content.
- [ ] Automated security tests attempt unauthorized household access.

---

# 3. Release Gates

## Gate A — Engineering Stable

All must be complete:

- HV-001 Portable scripts
- HV-002 Complete CI gate
- HV-003 Navigation refactor
- HV-004 Service and state separation
- HV-005 Versioned migrations
- HV-006 Error handling and observability
- HV-007 Integration and end-to-end tests
- HV-008 Security and privacy review

**Gate A passes when:** a clean clone builds, all checks pass, historical databases migrate safely, and the five critical user flows pass automatically.

---

## Gate B — Private Beta Ready

All must be complete:

- HV-101 Production onboarding
- HV-102 Permission messaging
- HV-103 Backup/restore trust UX
- HV-104 Diagnostics
- HV-105 Device/accessibility/performance matrix
- HV-106 Release configuration and legal material
- HV-107 Private beta distribution

**Gate B passes when:** an external tester can install the app, create a real vault, use core workflows, create a backup, and send a privacy-safe diagnostic report without developer intervention.

---

## Gate C — Product Differentiator Ready

All must be complete:

- HV-201 Native build foundation
- HV-202 Guided OCR capture
- HV-203 OCR validation

**Gate C passes when:** OCR works offline on both platforms, never silently overwrites data, and meets the documented evaluation thresholds.

---

## Gate D — Sync Go/No-Go

- HV-401 Product validation complete
- Written decision recorded

**Gate D passes when:** real tester behavior and household-sharing demand justify the cost and security scope of cloud work.

---

# 4. Recommended Execution Order

Work should proceed in this order:

1. **HV-001 — Portable scripts**
2. **HV-002 — Complete CI**
3. **HV-005 — Versioned migrations**
4. **HV-003 — Navigation refactor**
5. **HV-004 — State and service separation**
6. **HV-007 — Integration and end-to-end tests**
7. **HV-006 — Production-safe error handling**
8. **HV-008 — Security and privacy review**
9. **HV-101 through HV-107 — Private beta preparation**
10. **HV-201 through HV-203 — OCR**
11. **HV-401 — Product validation and sync decision**
12. **HV-301 through HV-303 — Projects**, based on user demand
13. **HV-402 through HV-404 — Cloud backup and sharing**, only after the sync gate passes

HV-005 can proceed in parallel with early navigation planning, but the navigation refactor should not be merged until the portable CI baseline is green.

---

# 5. Immediate Work Package

The next development work package should contain only these tasks:

## Work Package 1A

- [ ] HV-001 — Replace absolute build/test paths.
- [ ] HV-002 — Run lint, type checks, tests, fixture validation, and web build in CI.
- [ ] HV-005 — Inventory existing schema changes and introduce schema versioning.
- [ ] Create migration fixtures for at least the initial prototype schema and the current pre-versioned schema.
- [ ] Update the README with one clean-clone verification sequence.

## Work Package 1A Completion Gate

The work package is complete when this command sequence succeeds from a fresh checkout and the same checks pass in GitHub Actions:

```bash
npm ci
npm run lint
npm run typecheck
npm test
```

The application must then launch against:

1. A new empty database
2. A database created from the earliest retained schema fixture
3. A database created by the current pre-migration build

No existing records or app-owned attachment references may be lost.

---

# 6. Deferred Until Explicitly Approved

The following should not be started during Phase 0:

- Full account authentication
- Shared household editing
- Cloud attachment synchronization
- Subscription enforcement
- Projects and improvements screens
- Additional major record types
- Visual redesign unrelated to usability defects
- AI recommendations
- Contractor marketplace integrations

This prevents new scope from hiding stability and data-safety problems.

---

# 7. Working Status Template

Use this entry format when work begins on each task:

```markdown
## HV-XXX — Task Name

**Status:** In progress  
**Branch:** branch-name  
**Owner:**  
**Started:** YYYY-MM-DD

### Implementation Notes

- 

### Acceptance-Criteria Progress

- [ ] Criterion
- [ ] Criterion

### Verification

- CI:
- Automated tests:
- Manual devices:
- Migration fixtures:
- Screenshots or logs:

### Remaining Risks

- 
```
