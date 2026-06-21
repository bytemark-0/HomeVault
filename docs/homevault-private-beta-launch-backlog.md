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
- Open verification: GitHub Actions green run, real EAS iOS/Android builds, and native Android permission manifest still need external/device validation.

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
- [ ] Fresh install onboarding works without unexplained sample data.
- [ ] A user can create a real home and add at least one useful record.
- [ ] Core CRUD flows work for properties, rooms, assets, documents, tasks, repairs, and parts.
- [ ] Backup export and restore pass on at least one physical device.
- [ ] The app has a documented privacy/data handling position.
- [ ] A tester can submit feedback or support context.
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
- [ ] Apply safe dependency upgrades.
- [x] Avoid risky upgrades that destabilize Expo unless necessary.
- [x] Document any accepted vulnerabilities with rationale.

### Acceptance Criteria

- [x] No critical or high vulnerabilities remain unreviewed.
- [x] Moderate vulnerabilities are either fixed or documented as accepted risk.
- [ ] Typecheck, lint, tests, and web export pass after dependency changes.
- [x] The launch checklist includes the final audit result and decision.

### Verification Notes

- `npm audit --audit-level=moderate` reports 0 critical, 0 high, and 38 moderate findings.
- Moderate findings are currently accepted for private beta because the available automatic fixes require breaking Expo/React Native/Jest upgrades.
- No dependency changes were applied in this slice.

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
- [ ] Allow optional address, year built, purchase date, and photo.
- [x] Prevent duplicate submission.
- [ ] Preserve existing user records during upgrade.
- [x] Add test coverage for empty database and first-property creation.

### Acceptance Criteria

- [x] A clean install with zero properties routes to onboarding.
- [x] A user can create a home with only required fields.
- [x] Optional fields can be skipped without warning loops.
- [x] Failed saves show actionable errors.
- [ ] After save, the dashboard reflects the new home.

### Verification Notes

- Context integration tests cover the zero-property onboarding state.
- CreatePropertyScreen tests cover blank-name validation, required-only creation, property type selection, and duplicate-submit prevention.
- CreatePropertyScreen tests cover failed saves preserving input, showing retry guidance, and allowing a successful retry.

---

## Story L-203 — Explore sample data safely

**As a curious tester, I want to explore a sample home without confusing it for my data so that I can understand the app before committing.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Keep sample mode clearly labeled across primary screens.
- [ ] Add an obvious path to create a real vault from sample mode.
- [ ] Add an obvious path to delete sample data.
- [ ] Confirm sample records are programmatically distinguishable.
- [x] Confirm backup/export behavior for sample data.
- [x] Add tests for entering sample mode, exiting sample mode, and deleting sample data.

### Acceptance Criteria

- [ ] Sample mode is visually obvious on every primary tab.
- [ ] No tester believes sample records are their real records.
- [x] Deleting sample data cannot delete real user records.
- [x] A tester can create a real home after using sample mode without reinstalling.

### Verification Notes

- Sample-mode tasks do not trigger real notification sync.
- Export manifest now warns that exports from sample mode include the sample home and should not be used as real household backups.
- Browser verified the warning through Household -> Export manifest on the local web preview.
- Context tests cover entering sample mode and exiting sample mode back to the new-user onboarding state.

---

# Epic L-3 — Core HomeVault Workflows

## Story L-301 — Add and manage home structure

**As a homeowner, I want to add rooms and spaces so that my records map to my real home.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Verify room create, edit, detail, photo, and delete flows.
- [ ] Confirm room deletion explains impact on linked assets and records.
- [ ] Add empty states for no rooms.
- [ ] Add invalid-record recovery for deleted or stale route IDs.
- [ ] Verify navigation back behavior from room-related screens.

### Acceptance Criteria

- [ ] A user can create, edit, view, and delete a room.
- [ ] A user understands what will happen before deleting a room.
- [ ] Linked records remain consistent after room changes.
- [ ] Empty states explain the next useful action.
- [ ] No room flow crashes after record deletion.

---

## Story L-302 — Add and manage assets

**As a homeowner, I want to track appliances, systems, and important items so that HomeVault becomes useful quickly.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Verify asset create, edit, detail, photo, room assignment, and delete flows.
- [ ] Confirm warranty, serial number, purchase date, install date, and notes fields behave consistently.
- [ ] Add clear empty states for no assets.
- [ ] Verify asset search results open correct detail screens.
- [ ] Add regression tests for asset creation and update.

### Acceptance Criteria

- [ ] A user can add an asset in under two minutes.
- [ ] A user can attach or remove an asset photo.
- [ ] Asset detail shows linked tasks, documents, repairs, and parts when present.
- [ ] Search can find the asset by meaningful fields.
- [ ] Deleting an asset does not leave broken linked screens.

---

## Story L-303 — Capture documents and attachments

**As a homeowner, I want to store manuals, receipts, warranties, and service paperwork so that I can find them later.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Verify document create, edit, attach, preview/open, delete, and search flows.
- [ ] Confirm attachment storage paths are not exposed in user-facing errors.
- [ ] Add useful document type choices.
- [ ] Confirm document backup/export includes intended attachments.
- [ ] Confirm restore recovers document metadata and files.

### Acceptance Criteria

- [ ] A user can add a document with or without an attachment.
- [ ] A user can link a document to a property, room, or asset.
- [ ] Attachment errors explain what to do next.
- [ ] Backup and restore preserve document records and expected attachments.
- [ ] Search finds documents by title and type.

---

## Story L-304 — Stay ahead of maintenance

**As a homeowner, I want recurring tasks and reminders so that I can keep my home maintained.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Verify task create, edit, complete, snooze, skip, and delete flows.
- [ ] Confirm recurrence options are understandable.
- [ ] Verify due/overdue/upcoming grouping.
- [ ] Verify notification permission messaging.
- [ ] Confirm notification scheduling does not happen unexpectedly in sample mode.
- [ ] Add smoke tests for completion and recurrence behavior.

### Acceptance Criteria

- [ ] A user can create a recurring maintenance task.
- [ ] Completing a task schedules or calculates the next occurrence correctly.
- [ ] Snooze and skip states are visible and reversible where appropriate.
- [ ] Notification prompts include context and can be declined.
- [ ] Dashboard due-task counts match the task list.

---

## Story L-305 — Record repairs and parts

**As a homeowner, I want to record repairs, service history, and parts so that I know what happened and what it cost.**

**Priority:** P1 Launch Candidate

### Tasks

- [ ] Verify repair create, edit, delete, and asset-link flows.
- [ ] Verify part create, edit, delete, and asset-link flows.
- [ ] Confirm cost fields format consistently.
- [ ] Confirm service history summary calculations.
- [ ] Add empty states and helpful next actions.

### Acceptance Criteria

- [ ] A user can record a completed repair.
- [ ] A user can record a part or consumable.
- [ ] Costs display consistently across list and detail views.
- [ ] Repairs and parts appear on linked asset detail screens.
- [ ] Deleting a linked asset leaves safe recovery states.

---

# Epic L-4 — Backup, Restore, Export & Data Trust

## Story L-401 — Trust backup and restore

**As a beta tester, I want to export and restore my HomeVault data so that I feel safe entering real records.**

**Priority:** P0 Private Beta Blocker

### Tasks

- [ ] Run backup export on physical iOS and Android devices.
- [ ] Run restore from exported backup on a clean install.
- [ ] Verify invalid backup handling.
- [ ] Verify restore confirmation copy warns about replacement behavior.
- [ ] Verify backup includes expected records and attachments.
- [ ] Add or update restore validation tests.

### Acceptance Criteria

- [ ] Export completes without crash on beta devices.
- [ ] Restore rebuilds representative property, rooms, assets, documents, tasks, repairs, parts, and photos.
- [ ] Invalid backups are rejected with actionable errors.
- [ ] Destructive restore behavior requires explicit confirmation.
- [ ] No backup or restore flow logs sensitive household data.

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

- [ ] Define the minimum beta device matrix.
- [ ] Test one current iPhone.
- [ ] Test one smaller/older iPhone if available.
- [ ] Test one current Android device or emulator.
- [ ] Test one smaller/older Android device or emulator.
- [ ] Record OS versions and build numbers.
- [ ] Create a repeatable smoke checklist.

### Acceptance Criteria

- [ ] The device matrix is documented.
- [ ] Each P0 workflow is smoke-tested on the matrix or explicitly waived.
- [ ] Layout issues are logged with screenshots.
- [ ] Any device-specific P0/P1 bug is fixed before beta or listed as a known limitation.

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
- [ ] Prepare a 20-minute first-use script.
- [ ] Ask testers to install, create a home, add one asset, add one document or task, and explain what they think the app does.
- [ ] Record confusion points.
- [ ] Record completion rates and time-to-first-useful-record.
- [ ] Turn findings into P0/P1/P2 issues.

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
