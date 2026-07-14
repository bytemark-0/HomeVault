# HomeVault Household Continuity Backlog

**Prepared:** July 8, 2026  
**Purpose:** Turn HomeVault from an inventory-first app into a household continuity product with a buildable backlog.  
**Product direction:** HomeVault becomes the shared operating manual for your home: the place a household keeps the access, documents, devices, contacts, and recovery instructions needed to run the home and recover when something goes wrong.

---

## 1. Product Goal

The first meaningful release of this repositioned product should help a household answer:

> If I were away, unavailable, or in an emergency, could someone I trust still run this home?

The app should create daily and emergency value through:

- Home access details
- Insurance and warranty records
- Device and router records
- Emergency contacts
- Digital safety and recovery checklists
- A generated Emergency Packet

Inventory remains part of the product, but it is no longer the center of the product.

---

## 2. MVP Scope

This backlog assumes the first repositioned release includes:

- Home Access Vault
- Documents and coverage records
- Device and router inventory
- Emergency contacts
- Digital safety checklist
- Emergency Packet export

This backlog does **not** assume v1 includes:

- Password storage
- Dark web monitoring
- Live breach monitoring
- Router scanning
- Credit monitoring
- Enterprise security tooling
- Full cloud collaboration with per-user permissions

---

## 3. Working Product Decisions

These decisions are assumed unless the product direction changes:

- HomeVault remains local-first for this release.
- HomeVault does not store passwords.
- HomeVault may store sensitive notes, access codes, account metadata, and recovery instructions.
- Exports and printable packets must clearly warn users when they include sensitive information.
- Trusted sharing in v1 is export-based or packet-based, not account-sync-based.
- Existing asset/document/task functionality is preserved unless intentionally reframed.

---

## 4. Release Gate

This backlog is complete for the first household continuity release when:

- [ ] A new user understands HomeVault as a household continuity tool within 10 seconds of first launch.
- [ ] A new user can complete the essential setup flow in 10 minutes or less.
- [ ] The setup flow asks for household essentials before inventory detail.
- [ ] A user can save Wi-Fi, one access code, one insurance record, three emergency contacts, and one router or device.
- [ ] A user can generate an Emergency Packet from real records.
- [ ] A user can export or print a packet without exposing hidden diagnostics or unsupported fields.
- [ ] Sensitive fields are redacted from diagnostics, logs, and analytics.
- [ ] Existing inventory, document, maintenance, export, and restore flows still work after migration.
- [ ] Existing local data upgrades safely to the new schema.
- [ ] Five beta users can explain the product without being told it is an inventory app.

---

## 5. Definition of Done

Every story is complete only when all applicable conditions are met:

- [ ] The behavior works on a clean install.
- [ ] The behavior works after upgrading an existing install.
- [ ] Existing user records are preserved unless a destructive migration is explicitly approved.
- [ ] Loading, empty, success, cancellation, and failure states are handled.
- [ ] Type checking, linting, and automated tests pass.
- [ ] New behavior has automated coverage where practical.
- [ ] Sensitive values are not written to logs, analytics, or crash diagnostics.
- [ ] Copy reflects the new positioning consistently.
- [ ] Small-screen layouts and accessible labels are verified.
- [ ] Exported and printed output is manually reviewed for content accuracy.

---

# EPIC HC-0 - Continuity Foundations

## User Story HC-001 - Add the new domain model without breaking existing homes

**As an existing HomeVault user, I want my current data to survive the product shift so that the app can evolve without forcing me to start over.**

**Priority:** P0  
**Dependencies:** None
**Status:** Complete

### Tasks

- [x] Add new domain types for `AccessItem`, `EmergencyContact`, `ImportantAccount`, and a checklist or playbook model as needed.
- [x] Add repository interfaces and SQLite tables for the new records.
- [x] Add deterministic schema migrations for all new tables and columns.
- [x] Define how existing assets and documents map into the new experience.
- [x] Update sample data, backup fixtures, and in-memory repository support.
- [x] Add migration tests from the latest retained schema to the new schema.

### Acceptance Criteria

- [x] Existing properties, rooms, assets, documents, tasks, repairs, and parts remain intact after upgrade.
- [x] New installs can create and read the new record types.
- [x] Migration tests verify that existing records are preserved.
- [x] Reopening an already migrated database does not rerun destructive work.
- [x] Restore and export still function after the schema change.

## User Story HC-002 - Keep exports, restores, and diagnostics safe for sensitive household data

**As a household user, I want HomeVault to treat access details and recovery notes carefully so that the new product does not create accidental risk.**

**Priority:** P0  
**Dependencies:** HC-001
**Status:** Complete

### Tasks

- [x] Audit diagnostics and analytics for sensitive-field leakage.
- [x] Add redaction rules for access codes, account recovery notes, device serials, and emergency contacts.
- [x] Update export manifest and backup packaging rules for new record types.
- [x] Add explicit warnings when sharing a backup or Emergency Packet containing sensitive data.
- [x] Define which fields are included in full backup versus Emergency Packet output.
- [x] Add tests for redaction and export inclusion rules.

### Acceptance Criteria

- [x] Sensitive new fields are excluded or redacted from diagnostics.
- [x] Full backup includes the intended new records and validates successfully.
- [x] Emergency Packet generation includes only the fields defined for that packet type.
- [x] Share/export flows warn users when sensitive information is included.
- [x] Automated tests cover at least one redaction path and one export path for the new records.

---

# EPIC HC-1 - Repositioning, Navigation, and Onboarding

## User Story HC-101 - Explain the new value immediately

**As a new user, I want to understand HomeVault as the shared operating manual for my home so that I know why it is worth setting up now.**

**Priority:** P0  
**Dependencies:** None
**Status:** Complete

### Tasks

- [x] Rewrite welcome-screen copy around home access, continuity, and recovery.
- [x] Update README and product-facing docs to match the new positioning.
- [x] Replace inventory-first empty-state copy throughout the app.
- [x] Rework dashboard headings, labels, and action text to emphasize readiness instead of item count.
- [x] Update sample-mode messaging so the sample home reflects the new concept.

### Acceptance Criteria

- [x] The first-launch experience no longer describes HomeVault primarily as an inventory app.
- [x] Core screens use consistent continuity-oriented language.
- [x] At least four of five beta testers can explain the product without mentioning "inventory" first.
- [x] No major screen still uses stale positioning copy that conflicts with the new direction.

## User Story HC-102 - Replace inventory-first navigation with readiness-first navigation

**As a user, I want the app structure to match the new job-to-be-done so that the most valuable areas are easy to find.**

**Status:** Complete  
**Priority:** P0  
**Dependencies:** HC-101

### Tasks

- [x] Redesign primary tabs around `Home`, `Access`, `Documents`, `Devices`, and `Emergency`, or another final approved equivalent.
- [x] Move inventory-oriented screens out of the primary center of gravity.
- [x] Update quick-add entry points to prioritize access records, emergency contacts, and devices.
- [x] Update route names, tab labels, and tests to match the new information architecture.
- [x] Add safe fallbacks for any migrated deep links or stale route targets.

### Acceptance Criteria

- [x] The primary navigation reflects the new household continuity model.
- [x] A new user can find access details, documents, devices, and emergency output from the main navigation.
- [x] Existing navigation tests are updated and passing.
- [x] No broken route or invalid-state crash is introduced by the tab restructure.

## User Story HC-103 - Deliver a 10-minute readiness setup flow

**As a new user, I want onboarding to help me add the most important household essentials first so that I get value quickly.**

**Status:** Complete  
**Priority:** P0  
**Dependencies:** HC-101, HC-102, HC-001

### Tasks

- [x] Replace the current starter checklist with a readiness checklist.
- [x] Create onboarding steps for Wi-Fi info, access codes, insurance, emergency contacts, and a router or device.
- [x] Add a setup-progress model that tracks readiness steps instead of room/asset/task counts.
- [x] Update the home dashboard and household screen to surface readiness progress.
- [x] Allow users to skip optional steps without blocking completion.
- [x] Add tests for setup completion, partial completion, and resumed onboarding.

### Acceptance Criteria

- [x] The first-run path prioritizes household essentials before inventory detail.
- [x] The readiness checklist can be completed without creating a room, task, or generic asset first.
- [x] The dashboard reflects readiness progress accurately.
- [x] Users can skip a step and continue without dead ends.
- [x] Automated coverage exists for the new checklist progression logic.

---

# EPIC HC-2 - Home Access Vault

## User Story HC-201 - Save home access details in structured records

**As a homeowner, I want to store essential access information in one place so that my household can find it quickly when needed.**

**Priority:** P0  
**Dependencies:** HC-001
**Status:** Complete

### Tasks

- [x] Define `AccessItem` categories such as Wi-Fi, router, garage, alarm, safe, utility shutoff, lockbox, and other.
- [x] Add create, edit, detail, and delete flows for access items.
- [x] Support structured fields plus optional notes for each access item type.
- [x] Add search and filtering for access records.
- [x] Add empty states and quick actions for the Access area.

### Acceptance Criteria

- [x] A user can save at least Wi-Fi, router, garage, and alarm records.
- [x] Access items are searchable and readable from a dedicated Access area.
- [x] Empty states clearly explain what belongs in this section.
- [x] Deleting or editing an access item updates the UI without stale data.

## User Story HC-202 - Capture physical continuity details beyond codes

**As a household user, I want to record utility shutoffs and location-based emergency details so that the app helps during real incidents, not just account problems.**

**Priority:** P0  
**Dependencies:** HC-201
**Status:** Complete

### Tasks

- [x] Add fields or templates for utility shutoff guidance, lockbox location, spare-key notes, and entry instructions.
- [x] Allow optional photo or document linkage for shutoff maps, panel labels, and equipment references.
- [x] Surface these records in the Emergency area and Emergency Packet.
- [x] Add sample content for these record types in demo mode.

### Acceptance Criteria

- [x] A user can store and retrieve utility and home-entry continuity details.
- [x] Physical emergency records can link to supporting documents or device records.
- [x] Emergency-facing screens surface these details without requiring users to browse inventory lists.

## User Story HC-203 - Keep sensitive access records usable but not casually overshared

**As a user storing codes and recovery notes, I want the UI to be careful about exposure so that I can use the product without accidental leaks.**

**Priority:** P1  
**Dependencies:** HC-201, HC-002
**Status:** Complete

### Tasks

- [x] Add a sensitive-record presentation pattern for the Access area.
- [x] Decide which fields are masked, hidden by default, or always visible.
- [x] Add copy and confirmation around exporting or printing sensitive values.
- [x] Ensure screenshots, previews, and share flows do not reveal unintended metadata.

### Acceptance Criteria

- [x] Sensitive records follow a consistent presentation pattern.
- [x] Export and print flows clearly disclose when sensitive values will appear.
- [x] No access item preview leaks hidden values in list rows, notifications, or logs.

---

# EPIC HC-3 - Devices, Documents, and Digital Safety

## User Story HC-301 - Reframe documents around coverage and recovery

**As a homeowner, I want my most important home documents organized by real-life need so that I can find them quickly during repairs, claims, and emergencies.**

**Priority:** P0  
**Dependencies:** HC-001, HC-101
**Status:** Complete

### Tasks

- [x] Expand document categories to support insurance, policy, emergency, and home-file use cases.
- [x] Add document views or filters for insurance, warranties, manuals, and critical files.
- [x] Improve document empty states and quick actions for policy-first use cases.
- [x] Surface insurance and warranty records prominently in the dashboard and Emergency area.
- [x] Update tests for the new document taxonomy and routing.

### Acceptance Criteria

- [x] Users can distinguish insurance, warranty, manual, and general home documents.
- [x] The document area supports policy and emergency use cases without feeling inventory-only.
- [x] At least one primary path exists from the dashboard to key insurance records.

## User Story HC-302 - Make devices a first-class household readiness module

**As a user, I want to track routers, phones, laptops, smart-home gear, and other critical devices so that I can recover from outages, theft, and warranty issues faster.**

**Priority:** P0  
**Dependencies:** HC-001, HC-102

### Tasks

- [x] Decide whether devices are a specialized asset view or a new first-class record type.
  Devices now ship as a specialized asset flow so they can reuse existing repair, document, and backup links without duplicating record infrastructure.
- [x] Add device-focused fields such as owner, serial, warranty, backup enabled, screen lock enabled, and find-my-device enabled.
- [x] Add router-specific fields or templates where needed.
- [x] Update list and detail views to highlight recovery-relevant device data.
- [x] Add device quick-add flows during onboarding and from the Devices area.

### Acceptance Criteria

- [x] Users can add and manage critical household devices without forcing them through generic inventory language.
- [x] Router and primary-device records support recovery-relevant metadata.
- [x] Device list and detail screens surface the fields that matter in emergencies.

## User Story HC-303 - Add a digital safety checklist without becoming a password manager

**As a household user, I want a guided digital safety checklist so that I can strengthen recovery readiness without handing HomeVault my passwords.**

**Priority:** P1  
**Dependencies:** HC-001, HC-103

### Tasks

- [x] Create a checklist for MFA, backups, phone lock, find-my-device, recovery codes, and password-manager setup.
- [x] Add an `ImportantAccount` model for account inventory and recovery metadata only.
  The base model already existed from earlier continuity work, and this story extends it with recovery-status metadata such as MFA, recovery-code storage, and password-manager coverage.
- [x] Build account CRUD flows without password fields.
- [x] Link important accounts to emergency playbooks where relevant.
- [x] Add tests verifying that password entry is not supported.

### Acceptance Criteria

- [x] Users can record important accounts and recovery metadata without storing passwords.
- [x] The digital safety checklist is understandable to non-technical users.
- [x] Account records can participate in recovery workflows and Emergency Packet rules where intended.
- [x] The UI never implies that HomeVault stores or autofills passwords.

---

# EPIC HC-4 - Emergency Packet and Recovery Workflows

## User Story HC-401 - Generate a useful Emergency Packet

**As a household user, I want one exportable packet with the essentials so that I can hand someone exactly what they need during an emergency.**

**Priority:** P0  
**Dependencies:** HC-002, HC-201, HC-202, HC-301, HC-302
**Status:** Complete

### Tasks

- [x] Define the Emergency Packet data contract.
- [x] Build packet sections for access info, emergency contacts, insurance, key devices, and recovery notes.
- [x] Add packet generation from the app with print and share paths.
- [x] Add copy that explains what is and is not included.
- [x] Add preview and validation before export.
- [x] Add tests for packet inclusion rules and empty-state behavior.

### Acceptance Criteria

- [x] A user can generate a packet from real data without exporting the full backup.
- [x] The packet groups information by emergency usefulness, not by raw database type.
- [x] Print and share flows work without crashing on missing optional sections.
- [x] Users are warned when the packet contains sensitive values.

## User Story HC-402 - Add guided recovery playbooks for common incidents

**As a user under stress, I want simple recovery guidance for common problems so that I do not have to remember every next step.**

**Status:** Complete  
**Priority:** P1  
**Dependencies:** HC-303, HC-401

### Tasks

- [x] Define initial playbooks for stolen phone, home lockout, internet outage, appliance failure, and insurance incident.
- [x] Create a reusable playbook UI and data model.
- [x] Link playbooks to relevant records such as router, insurer, emergency contact, or important account.
- [x] Add empty and incomplete states when supporting records are missing.

### Acceptance Criteria

- [x] Users can open at least three guided recovery playbooks in-app.
- [x] Playbooks can point to real records when the data exists.
- [x] Incomplete setups fail gracefully and tell users what is missing.

## User Story HC-403 - Replace the old health score with a household readiness score

**As a user, I want the dashboard to reflect how prepared my household is, not just how many maintenance tasks are due.**

**Status:** Complete  
**Priority:** P1  
**Dependencies:** HC-103, HC-201, HC-301, HC-302, HC-401

### Tasks

- [x] Define the readiness-score inputs and weighting.
- [x] Replace or supplement the current health score on the home dashboard.
- [x] Show which missing records would improve readiness most.
- [x] Add tests for score calculation and display states.

### Acceptance Criteria

- [x] The readiness score changes based on continuity-related setup, not just maintenance state.
- [x] Users can see the next most valuable step to improve readiness.
- [x] Score logic is deterministic and covered by automated tests.

---

# EPIC HC-5 - Trusted Sharing and Ongoing Household Review

## User Story HC-501 - Support trusted access without full account-sync complexity

**As a homeowner, I want to hand a trusted person the right household information without building a full collaboration platform first.**

**Priority:** P1  
**Dependencies:** HC-401

### Tasks

- [x] Define the v1 trusted-sharing model around packet export, selective export, or a trusted contact handoff artifact.
- [x] Create a workflow for preparing information for a spouse, house sitter, or emergency contact.
- [x] Let users choose broad categories or sections to include.
- [x] Document the tradeoffs of local-first trusted sharing versus future account-based sharing.

### Acceptance Criteria

- [x] A user can prepare a trusted-share artifact without exporting unrelated data.
- [x] The share flow makes clear that v1 is document-based, not collaborative live access.
- [x] The user can distinguish full backup, Emergency Packet, and trusted-share output.

## User Story HC-502 - Add emergency contacts as first-class records

**As a user, I want to save the people and providers my household would call first so that support information is immediately available under stress.**

**Priority:** P0  
**Dependencies:** HC-001, HC-103

### Tasks

- [x] Add the `EmergencyContact` model with contact type, phone, notes, and optional relationship or provider metadata.
- [x] Build create, edit, delete, and list flows for emergency contacts.
- [x] Add onboarding support for adding at least three contacts.
- [x] Surface contacts in the dashboard, Emergency area, and packet generation flows.

### Acceptance Criteria

- [x] Users can add and manage emergency contacts as dedicated records.
- [x] Emergency contacts are easy to find from onboarding and the Emergency area.
- [x] Contacts can be included in the Emergency Packet.

## User Story HC-503 - Create an annual household review workflow

**As a subscriber, I want HomeVault to prompt a yearly review so that the product keeps earning its place after setup is complete.**

**Priority:** P2  
**Dependencies:** HC-303, HC-401, HC-502

### Tasks

- [x] Define the annual review checklist.
- [x] Add reminder scheduling and review UI.
- [x] Include prompts for insurance, contacts, access info, devices, and packet regeneration.
- [x] Add completion tracking and testing for annual review reminders.

### Acceptance Criteria

- [x] Users can trigger or be reminded to run an annual household review.
- [x] The review flow checks the major continuity categories.
- [x] Reminder behavior respects local notification permissions and current notification architecture.

---

## 6. Suggested Delivery Order

If we want the narrowest credible first release, the recommended order is:

1. HC-0 Foundations
2. HC-1 Repositioning, navigation, and onboarding
3. HC-2 Home Access Vault
4. HC-5 Emergency contacts
5. HC-3 Documents and devices
6. HC-4 Emergency Packet
7. HC-3 Digital safety checklist
8. HC-4 Recovery playbooks
9. HC-5 Trusted sharing and annual review

---

## 7. First Release Cut Line

The minimum release that fulfills the new promise should include:

- [x] New positioning and onboarding
- [x] Readiness-first navigation
- [x] Access records
- [x] Emergency contacts
- [x] Insurance and key-document support
- [x] Device and router records
- [x] Emergency Packet

These items can follow after the first release if needed:

- [x] Important account inventory
- [x] Digital safety checklist
- [x] Guided playbooks
- [x] Trusted-share artifact variations
- [x] Annual review workflow
- [x] More advanced readiness scoring
