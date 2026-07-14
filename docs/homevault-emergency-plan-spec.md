# HomeVault Emergency Plan Spec

**Prepared:** July 9, 2026  
**Purpose:** Define the next buildable version of HomeVault's emergency-plan concept so product and engineering can execute without reopening core scope questions.

---

## 1. Product Definition

HomeVault's `Emergency Plan` is the household's private operating manual for getting through a stressful event when the primary household organizer is unavailable.

It combines:

- The records someone needs
- The order they should use them
- The export/share path for handing them off
- The security controls required before sensitive details are revealed or shared

This is **not** a live collaboration suite, password vault, or threat-monitoring product.

---

## 2. The Job To Be Done

When something goes wrong, HomeVault should help a household answer:

1. What happened?
2. Who should I contact first?
3. Which records matter right now?
4. What are the next steps?
5. What can I safely hand to someone else?

---

## 3. Emergency Plan Pillars

Every HomeVault emergency plan should cover these six pillars:

### 3.1 Physical Access

- Wi-Fi details
- Router / modem access
- Alarm and garage codes
- Lockbox / spare key instructions
- Utility shutoff guidance
- Entry notes for helpers

### 3.2 People And Contacts

- Trusted person / spouse / partner
- Backup contact
- Service providers
- Building / HOA / landlord contact if relevant
- Vet / childcare / eldercare contacts where relevant

### 3.3 Coverage And Critical Documents

- Insurance account and policy details
- Claim phone / website
- Emergency documents
- Manuals, warranties, shutoff maps, and key home files

### 3.4 Critical Devices And Infrastructure

- Router and ISP context
- Primary phones
- Family laptops / tablets if recovery-relevant
- Smart-home gear that affects entry, safety, or connectivity

### 3.5 Digital Recovery

- Important account inventory
- MFA status
- Recovery codes stored?
- Password manager in use?
- Device backups enabled?
- Screen lock and find-my-device enabled?

### 3.6 Trusted Handoff

- Exportable emergency packet
- Selective trusted-share handoff
- Audience-specific sharing rules
- Security step-up before sensitive sharing

---

## 4. Core Incidents To Support

The first emergency-plan release should explicitly support these incidents:

### 4.1 Home Lockout

Needs:

- Entry notes
- Trusted contacts
- Lockbox / spare key details
- Smart lock / alarm info

### 4.2 Internet Outage

Needs:

- Router record
- Wi-Fi and admin access
- ISP account / contact
- Restart / outage steps

### 4.3 Lost Or Stolen Phone

Needs:

- Primary phone record
- Find-my-device status
- Carrier account / recovery notes
- Trusted contact
- Digital safety playbook

### 4.4 Insurance Incident

Needs:

- Insurance account
- Policy / claim documents
- Emergency contacts
- Property and device records
- Export packet / claim handoff path

### 4.5 Utility / Safety Emergency

Needs:

- Shutoff guidance
- Device / system references
- Emergency service providers
- Entry and location notes

These five incidents are the `MLP` incident set. Additional scenarios like storm prep, house sitter prep, elderly parent handoff, fraud response, and travel prep come later.

---

## 5. Household Cyber Safety Scope

HomeVault should include `basic household cyber safety`, but only as recovery and preparedness.

It should include:

- MFA status tracking
- Recovery-code storage status
- Password-manager usage status
- Device backup status
- Screen-lock status
- Find-my-device status
- Important account inventory
- Scam / fraud readiness guidance inside playbooks where relevant

It should not include:

- Password storage
- Autofill
- Dark-web monitoring
- Antivirus or malware scanning
- Breach monitoring
- Live router scanning in v1

Product framing:

`HomeVault helps households recover from digital disruption without becoming a security suite.`

---

## 6. Local-First Sharing Rules

HomeVault must stay true to local-first. Sharing therefore works by `user-initiated handoff`, not by storing household data on HomeVault-managed servers.

### 6.1 Allowed V1 Sharing Models

- Emergency Packet export
- Trusted-share export by broad section
- Later: encrypted item bundle export

### 6.2 Not In Scope For V1

- Live synced collaboration
- Multi-user cloud accounts
- Server-hosted readable household records
- Shared editing across users

### 6.3 Future Local-First Extensions

- Item-level encrypted share bundles
- Time-boxed read-only shares
- Local device pairing
- User-owned encrypted sync destinations

---

## 7. Sensitive Action Protection

Sharing and revealing sensitive records must use `step-up verification`.

### 7.1 Sensitivity Levels

`Low sensitivity`

- Warranty document
- Manual
- General contact

`Medium sensitivity`

- Insurance account metadata
- Service providers
- Device recovery notes

`High sensitivity`

- Wi-Fi password
- Alarm / lockbox code
- Recovery notes
- Full emergency packet
- Trusted-share export containing sensitive records

### 7.2 Protection Rules

`Low`

- No extra gate required

`Medium`

- Require biometric or device-auth confirmation before reveal/share

`High`

- Require biometric/device auth
- Support optional HomeVault sensitive-actions PIN

This should be implemented as local verification only. No email OTP or SMS OTP should be required for the first release.

---

## 8. MLP Scope

The `minimum lovable product` for HomeVault Emergency Plan includes:

### 8.1 Required Records

- Access items
- Emergency contacts
- Insurance account
- At least one critical device
- Important accounts for digital recovery

### 8.2 Required Experiences

- Readiness-first onboarding
- Emergency tab as one-tap emergency surface
- Emergency Packet preview and export
- Trusted-share export by broad section
- At least three guided recovery playbooks
- Annual review / freshness loop
- Sensitive-action protection for high-risk reveal/share actions

### 8.3 Required Playbooks

- Home lockout
- Internet outage
- Lost or stolen phone
- Insurance incident

### 8.4 Required Digital Safety Checklist

- MFA
- Recovery codes
- Device backups
- Screen lock
- Find-my-device
- Password manager usage

---

## 9. Build Order

To move quickly, the next work should be cut into these slices.

### Slice 1 - Emergency Plan Surface

Status: [x] Completed on July 9, 2026

Build:

- [x] Emergency tab positioning refresh
- [x] "What to do now" summary
- [x] Incident entry cards
- [x] Faster path to packet and trusted handoff

Done when:

- [x] A user can open Emergency and immediately see contacts, access, packet, and incidents

### Slice 2 - Incident Playbooks

Status: [x] Completed on July 9, 2026

Build:

- [x] Finalize playbook structure
- [x] Tighten the 4 core incidents
- [x] Show missing linked records clearly

Done when:

- [x] Each core incident points to the right records and next steps

### Slice 3 - Sensitive Sharing Protection

Status: [x] Completed on July 9, 2026

Build:

- [x] Sensitivity labels
- [x] Biometric / device-auth gate
- [x] Optional sensitive-actions PIN design stub if biometrics unavailable

Done when:

- [x] High-risk fields and exports require step-up auth before reveal/share

### Slice 4 - Trusted Handoff Improvements

Status: [x] Completed on July 9, 2026

Build:

- [x] Better audience presets
- [x] Clearer section selection
- [x] Better explanation of static handoff limits

Done when:

- [x] A user can safely prepare a trusted handoff for spouse, house sitter, or emergency helper

### Slice 5 - Household Cyber Safety

Status: [x] Completed on July 9, 2026

Build:

- [x] Digital safety checklist expansion
- [x] Important-account freshness prompts
- [x] Playbook coverage for lost phone and account recovery

Done when:

- [x] A non-technical household can understand what is missing and how to improve recovery readiness

---

## 10. Initial Acceptance Criteria

The Emergency Plan initiative is ready for release review when:

- A user can complete the emergency essentials without using generic inventory flows first
- Emergency tab content is useful even when the household is incomplete
- At least one exportable emergency packet can be generated from real records
- Trusted-share export clearly distinguishes what is included and what is omitted
- High-risk share/reveal actions use local step-up verification
- The app never implies that HomeVault stores passwords
- The core incident playbooks are understandable under stress
- A spouse or trusted helper can explain what HomeVault is for after seeing the Emergency area

---

## 11. Explicit Out Of Scope

These ideas are good, but should not block the next build cycle:

- Full item-level live sharing
- Real-time collaboration
- Hosted cloud sync
- OTP-based hosted MFA
- Advanced fraud monitoring
- Router scanning
- Credit / identity monitoring
- Enterprise-grade cyber tooling

---

## 12. Immediate Next Ticket Set

If we start building now, the next tickets should be:

1. [x] Add sensitivity levels to shareable / revealable records
2. [x] Gate high-risk trusted-share and packet exports behind local auth
3. [x] Tighten Emergency tab into a true emergency dashboard
4. [x] Finalize the 4 incident playbooks and missing-data states
5. [x] Add digital safety freshness prompts to annual review and readiness scoring

---

## 13. Post-Completion Plan

This section assumes everything in Sections 1-12 is complete and shifts the work from
`concept definition` to `release hardening and expansion`.

The next plan is:

1. Prove the emergency-plan release is durable
2. Extend sharing without violating local-first rules
3. Expand incident and cyber-safety coverage carefully

### 13.1 Phase A - Release Hardening

Goal:

- Make the current Emergency Plan shippable and trustworthy for real households

Build:

- Manual QA pass across onboarding, Emergency, Export, trusted share, annual review, and playbooks
- Regression suite for the emergency-plan flows across mobile and web
- Review all sensitive copy, warnings, and masking states for consistency
- Verify backup / restore / migration behavior with emergency-plan records present
- Validate empty, partial, and fully prepared household states
- Run a first-user pilot with spouse / partner / helper handoff scenarios

Done when:

- The emergency-plan flows pass clean-install and upgraded-install checks
- Export, print, trusted-share, and restore all work with current data
- Pilot users can complete at least one emergency handoff without product guidance
- Sensitive values never leak in logs, notifications, or previews

Release-hardening checklist:

- [ ] Clean-install QA pass across onboarding, Emergency, Export, trusted share, annual review, and playbooks
- [x] Upgraded-install QA pass with existing continuity records already on device
- [x] Validate empty household states across Emergency, Export, and annual review
- [x] Validate partial household states with missing links and guidance prompts
- [x] Validate fully prepared household states with packet, trusted-share, and playbook coverage
- [x] Verify backup, restore, and migration behavior with emergency-plan records present
- [x] Audit sensitive copy, masking, previews, logs, and notifications for leaks
- [ ] Run a spouse / partner / helper handoff pilot without product coaching

Regression command:

- `npm run test:emergency-plan`

### 13.2 Phase B - Local-First Item Sharing

Goal:

- Move from section-based trusted handoff to selective item-level sharing while staying local-first

Build:

- Define an encrypted `share bundle` format for one item or a small linked item set
- Add share-entry points from access items, contacts, accounts, devices, and documents
- Support field-level inclusion rules such as `share phone but not notes`
- Add expiry / audience labels for read-only bundles
- Add import / preview handling for received bundles
- Show provenance: who shared it, when, and what was omitted

Done when:

- A user can share one record without exporting unrelated household data
- Imported shared items are clearly read-only and provenance-aware
- The share flow stays user-initiated and does not require HomeVault-hosted sync

### 13.3 Phase C - Freshness And Readiness Intelligence

Goal:

- Make Emergency Plan quality depend on `freshness`, not just record presence

Build:

- Record-level `last reviewed` and `stale after` rules for access, contacts, accounts, and devices
- Staleness scoring in readiness calculations
- Annual review prompts that target stale records directly
- Dashboard and Emergency-area nudges such as `Wi-Fi reviewed 18 months ago`
- Suggested review cadence by record type

Done when:

- The app can explain not just what is missing, but what is out of date
- Households see concrete next steps for keeping their emergency plan trustworthy

### 13.4 Phase D - Expanded Household Cyber Safety

Goal:

- Deepen cyber-safety coverage while preserving the no-password, no-fear posture

Build:

- Add carrier-account and primary-email recovery emphasis
- Add family scam / fraud response guidance to playbooks
- Add shared-account review patterns for Apple, Google, utilities, and smart-home vendors
- Add household role ownership such as `who manages router`, `who owns carrier PIN`, and
  `who can recover the family email`
- Add review prompts for recovery drift like stale recovery phone or missing backup coverage

Done when:

- Non-technical households can improve digital recovery readiness without learning security jargon
- The product still avoids password storage and threat-monitoring claims

### 13.5 Phase E - Broader Incident Coverage

Goal:

- Expand Emergency Plan from the first 5 incidents into a broader household resilience system

Build:

- House sitter prep
- Storm prep / evacuation prep
- Fraud / scam response
- Travel handoff
- Aging-parent or dependent-care handoff
- Lost wallet / identity-doc response

Done when:

- HomeVault covers both household operations and the most common family disruption scenarios

### 13.6 Recommended Order

If the current Emergency Plan spec is complete, the recommended order is:

1. Phase A - Release Hardening
2. Phase B - Local-First Item Sharing
3. Phase C - Freshness And Readiness Intelligence
4. Phase D - Expanded Household Cyber Safety
5. Phase E - Broader Incident Coverage

### 13.7 Immediate Ticket Set After Completion

If everything in this spec is already built, the next tickets should be:

1. [x] Add a release-hardening checklist for Emergency Plan
2. [x] Add automated regression coverage for trusted-share, packet export, and local auth gates
3. [x] Define the encrypted item-share bundle format
4. [x] Add item-level share entry points to the highest-value record types
5. [x] Add `last reviewed` metadata and staleness prompts to emergency-critical records

---

## 14. Emergency Plan Expansion Backlog

This backlog assumes the current Emergency Plan spec is complete and defines the next implementation wave.

### EP-1 - Release Hardening And Trust

#### Story EP-101 - Validate the Emergency Plan end to end

**As a beta operator, I want the Emergency Plan workflows verified across clean, partial, and mature households so that we can trust the feature set before expanding it further.**

**Priority:** P0  
**Dependencies:** Completion of Sections 1-12

##### Tasks

- [x] Add a dedicated Emergency Plan release-hardening checklist to the beta release runbook.
- [x] Verify onboarding → Emergency tab → packet export → trusted share on a clean install.
- [x] Verify upgraded-install behavior with existing household data present.
- [x] Verify empty, partial, and fully prepared household states.
- [ ] Verify trusted-share, packet export, and annual review behavior on web and native surfaces.
- [x] Verify sensitive values do not appear in previews, logs, notifications, or stale-route recovery screens.
- [ ] Run at least one spouse/partner and one helper handoff pilot.

##### Acceptance Criteria

- [ ] Emergency workflows complete successfully on both clean and upgraded installs.
- [x] Packet export, trusted-share export, and local auth gates work without dead ends or data corruption.
- [ ] Pilot users can complete a handoff without product-team assistance.
- [ ] All release-hardening findings are documented with follow-up bugs or explicit signoff.

##### Current Release-Hardening Notes

- Automated coverage now proves the clean-install onboarding -> Emergency -> export/trusted-share path, upgraded-install emergency-plan loading, empty/partial/fully prepared household states, backup/restore/migration safety, privacy redaction, and native local-auth gates for sensitive export actions.
- `npm run test:emergency-plan` is the current passing regression entrypoint for the automated emergency-plan release-hardening suite.
- Web coverage now proves emergency-packet download, trusted-handoff download, and item-share bundle download behavior.
- Remaining manual verification: annual review still needs an explicit web smoke test. The route and screen logic are platform-neutral in code, but the dedicated route-level web proof has been brittle in the current test renderer and was not kept as automated signoff.
- Remaining human verification: spouse/partner and helper handoff pilots, plus final release signoff after the manual QA sweep.

##### Remaining Manual Smoke Checklist

1. On web, create or open a household with at least one emergency-ready record, open Annual review, turn on the yearly reminder, and confirm the reminder state changes without a dead end.
2. From the same web session, open the packet shortcut from Annual review and confirm Export loads with the packet/trusted-share tools intact.
3. Run one spouse/partner handoff using the trusted-share flow and one helper handoff using the packet or item-share flow.
4. For each pilot, capture whether the recipient understood what they received, what was omitted, and what to do next without product-team coaching.
5. Record any remaining confusion, dead ends, or copy issues as follow-up bugs before marking release signoff complete.

##### Open Findings And Signoff Blockers

- `RH-001` Annual review web smoke is still manual.
  Evidence: export/trusted-share/item-share web behavior is covered by automated tests, but annual-review web route proof was brittle in the current renderer and was intentionally left out of automated signoff.
  Exit condition: complete the 2-step annual-review web smoke checklist above and record pass/fail notes.
- `RH-002` Pilot handoff signoff is still manual.
  Evidence: trusted-share, packet, and item-share flows are regression-covered, but no spouse/partner or helper pilot has been recorded yet.
  Exit condition: complete one spouse/partner handoff and one helper handoff without product coaching, then log any follow-up bugs or explicit signoff.
- `RH-003` Final release-hardening signoff is still blocked on the two items above.
  Evidence: the automated release-hardening suite is passing via `npm run test:emergency-plan`, but manual web annual-review verification and human pilot validation are still outstanding.
  Exit condition: close `RH-001` and `RH-002`, then document either no remaining findings or the follow-up bugs that release can accept.

#### Story EP-102 - Add regression coverage for emergency-critical flows

**As the team, we want automated coverage around the highest-risk Emergency Plan behaviors so future expansion does not silently break the trust surface.**

**Priority:** P0  
**Dependencies:** EP-101

##### Tasks

- [x] Add route and screen tests for packet export and trusted-share export.
- [x] Add regression tests for local auth gate entry and failure/cancel flows.
- [x] Add backup/restore tests with emergency-plan records populated.
- [x] Add smoke coverage for the core incident playbooks.
- [x] Add web-facing regression coverage for emergency-plan export and share states.

##### Acceptance Criteria

- [x] The most sensitive export and reveal flows are covered by automated tests.
- [x] Backup and restore continue to work with emergency-plan data at scale.
- [x] A future regression in export, auth-gating, or emergency playbook routing causes CI to fail.

### EP-2 - Local-First Item Sharing

#### Story EP-201 - Define the encrypted item-share bundle format

**As a product team, we want a structured local-first share format so item sharing can be added without slipping into server-hosted collaboration.**

**Priority:** P1  
**Dependencies:** EP-101

##### Tasks

- [x] Define a `share bundle` schema for one record or a small linked record set.
- [x] Define encryption, metadata, and versioning rules.
- [x] Define provenance fields such as sender label, generated time, audience, and omitted fields.
- [x] Define expiry and read-only semantics.
- [x] Define import validation and unsupported-version behavior.

##### Acceptance Criteria

- [x] A single share bundle can represent one item without unrelated household data.
- [x] The format is versioned and import-safe.
- [x] Provenance, expiry, and omitted-field behavior are explicitly represented.

#### Story EP-202 - Add item-level share entry points

**As a user, I want to share a single household record directly so that I do not need to export an entire section just to help someone.**

**Priority:** P1  
**Dependencies:** EP-201

##### Tasks

- [x] Add share actions to access items, emergency contacts, important accounts, key devices, and critical documents.
- [x] Make item-share entry points discoverable from Emergency and the main record lists.
- [x] Add field-level inclusion rules where needed.
- [x] Add audience presets such as spouse, house sitter, emergency helper, and contractor.
- [x] Add preview and warning copy before export.
- [x] Add import-preview UI for received bundles.

##### Acceptance Criteria

- [x] A user can share a single record from at least three high-value record types.
- [x] Item sharing excludes unrelated household data by default.
- [x] Shared items are clearly read-only and provenance-aware on import.

#### Story EP-203 - Add time-boxed read-only handoff rules

**As a household organizer, I want short-lived handoff bundles so that helpers can get the details they need without creating a permanent access pattern.**

**Priority:** P2  
**Dependencies:** EP-202

##### Tasks

- [x] Add optional expiry metadata to share bundles.
- [x] Add UI copy for temporary access windows.
- [x] Add stale / expired import behavior.
- [x] Add reminders to rotate outdated shared credentials when appropriate.

##### Acceptance Criteria

- [x] A user can issue a read-only share intended for temporary help.
- [x] Expired bundles are clearly labeled on import or review.
- [x] The app nudges credential rotation where the risk is high.

### EP-3 - Freshness And Readiness Intelligence

#### Story EP-301 - Track review freshness on emergency-critical records

**As a household user, I want HomeVault to know which emergency records are stale so readiness reflects reality instead of just record count.**

**Priority:** P1  
**Dependencies:** EP-101

##### Tasks

- [x] Add `last reviewed` metadata to access items, emergency contacts, important accounts, and critical devices.
- [x] Define per-record stale thresholds.
- [x] Expose review actions in record detail screens and annual review flows.
- [x] Add migration and backup support for review metadata.

##### Acceptance Criteria

- [x] Emergency-critical records can be marked as reviewed.
- [x] The app can determine whether a record is current or stale.
- [x] Review metadata survives backup, restore, and migration.

#### Story EP-302 - Add staleness-aware readiness scoring

**As a user, I want readiness scoring to degrade when important records are old so the app stays honest about household preparedness.**

**Priority:** P1  
**Dependencies:** EP-301

##### Tasks

- [x] Add staleness inputs to readiness scoring.
- [x] Add dashboard messaging for stale emergency-critical records.
- [x] Add Emergency-tab and annual-review nudges for the highest-risk stale records.
- [x] Add regression coverage for stale vs. fresh scoring behavior.

##### Acceptance Criteria

- [x] Readiness reflects both coverage and freshness.
- [x] The dashboard can explain which stale records matter most.
- [x] Automated tests prove the scoring behavior is deterministic.

### EP-4 - Expanded Household Cyber Safety

#### Story EP-401 - Strengthen digital recovery for primary household accounts

**As a household, I want HomeVault to focus on the digital accounts that can lock us out of recovery so that we are not stranded by a single missing account detail.**

**Priority:** P1  
**Dependencies:** Existing HC-303 scope, EP-301

##### Tasks

- [x] Add stronger recovery emphasis for primary email, carrier, Apple/Google, utilities, and smart-home accounts.
- [x] Add prompts for stale recovery phone/email details.
- [x] Add clearer role labels for who manages each critical account.
- [x] Add review prompts for shared family-account drift.

##### Acceptance Criteria

- [x] Users can identify the accounts that matter most for household recovery.
- [x] The app can point out missing or stale recovery coverage.
- [x] The UI still avoids storing or implying password storage.

#### Story EP-402 - Add family scam and fraud response guidance

**As a household, I want scam-response guidance built into the emergency system so that we can react safely under pressure.**

**Priority:** P2  
**Dependencies:** EP-401

##### Tasks

- [x] Add fraud/scam response playbook content for urgent calls, fake utility shutoff threats, carrier fraud, and bank-account panic.
- [x] Add known-good support contact guidance where relevant.
- [x] Add household rules / decision prompts such as `pause`, `call back`, and `verify independently`.
- [x] Connect relevant important accounts and contacts into these playbooks.

##### Acceptance Criteria

- [x] At least one family-friendly fraud/scam response playbook is available.
- [x] The playbook language is understandable without security jargon.
- [x] The product still avoids claiming live fraud detection or monitoring.

### EP-5 - Broader Incident Coverage

#### Story EP-501 - Add house sitter and travel handoff plans

**As a homeowner, I want lighter-weight handoff plans for normal absence so that HomeVault helps before a true emergency too.**

**Priority:** P2  
**Dependencies:** EP-202

##### Tasks

- [x] Define `house sitter` and `travel handoff` plan templates.
- [x] Reuse trusted-share and packet components for lower-stress handoffs.
- [x] Add audience-specific checklists and omitted-data defaults.
- [x] Add review prompts before travel or extended absence.

##### Acceptance Criteria

- [x] A user can prepare a practical non-emergency handoff without exposing unnecessary household data.
- [x] The handoff flow distinguishes temporary helper use from emergency use.

#### Story EP-502 - Add storm and evacuation readiness plans

**As a household, I want HomeVault to help with storm and evacuation readiness so that we can prepare before the disruption arrives.**

**Priority:** P2  
**Dependencies:** EP-301

##### Tasks

- [x] Define storm prep and evacuation playbooks.
- [x] Add links to insurance, contacts, utility details, and packet export paths.
- [x] Add optional checklist items for go-bag, document export, and property shutoff readiness.
- [x] Add missing-data states for incomplete preparedness.

##### Acceptance Criteria

- [x] The app supports at least one pre-event readiness scenario in addition to incident recovery.
- [x] Storm/evacuation flows reuse existing records instead of creating a separate system.

## 15. Recommended Next Story

If we continue immediately, the recommended next implementation story is:

`EP-101 - Validate the Emergency Plan end to end`

Reason:

- It proves the current spec is actually shippable
- It flushes out trust gaps before we add more surface area
- It gives us the cleanest launchpad for item-level sharing and freshness work

If we want the first expansion story instead of hardening, start with:

`EP-201 - Define the encrypted item-share bundle format`

---

## 16. Emergency Plan MVP Cut Line

The Emergency Plan MVP should stop when HomeVault can do all of the following well:

- Guide a new or existing household into a usable emergency setup
- Show the right records and next steps from the Emergency area
- Export a trustworthy emergency packet
- Share either a section-level handoff or a single item without exposing unrelated records
- Require local step-up verification for high-risk reveals and shares
- Explain when emergency-critical records are stale
- Cover the core physical and digital recovery incidents a real household will face

### 16.1 MVP Feature Set

The MVP includes the already-completed Emergency Plan foundation plus these next stories:

- [ ] `EP-101` Validate the Emergency Plan end to end
- [x] `EP-102` Add regression coverage for emergency-critical flows
- [x] `EP-201` Define the encrypted item-share bundle format
- [x] `EP-202` Add item-level share entry points
- [x] `EP-301` Track review freshness on emergency-critical records
- [x] `EP-302` Add staleness-aware readiness scoring
- [x] `EP-401` Strengthen digital recovery for primary household accounts

### 16.2 MVP Release Criteria

Emergency Plan MVP is ready when:

- [x] A clean-install user can create a household and reach a usable Emergency area quickly
- [x] A partially configured household still gets useful emergency guidance instead of dead ends
- [x] A mature household can export a packet and prepare a trusted handoff confidently
- [x] At least one single-record share flow works end to end for a high-value record type
- [x] High-risk reveal and share actions always use local step-up verification
- [x] Emergency-critical records show whether they are fresh or stale
- [x] Readiness reflects missing data and stale data, not just record count
- [x] Digital recovery coverage is strong for primary email, carrier, Apple/Google, and utility/smart-home accounts
- [x] Backup, restore, and migration remain safe with all Emergency Plan MVP records present
- [ ] Pilot users can explain the product as a home emergency/recovery tool without coaching

### 16.3 Deferred Until After MVP

These stories are valuable, but not required for Emergency Plan MVP:

- [x] `EP-203` Time-boxed read-only handoff rules
- [x] `EP-402` Family scam and fraud response guidance
- [x] `EP-501` House sitter and travel handoff plans
- [x] `EP-502` Storm and evacuation readiness plans

---

## 17. Recommended Delivery Order To MVP

If the goal is to reach a true Emergency Plan MVP without overbuilding, the recommended order is:

1. `EP-101` Validate the Emergency Plan end to end
2. `EP-102` Add regression coverage for emergency-critical flows
3. `EP-201` Define the encrypted item-share bundle format
4. `EP-202` Add item-level share entry points
5. `EP-301` Track review freshness on emergency-critical records
6. `EP-302` Add staleness-aware readiness scoring
7. `EP-401` Strengthen digital recovery for primary household accounts

At that point, HomeVault has enough Emergency Plan depth for an MVP and can deliberately decide whether to keep expanding or pause for beta validation.

---

## 18. Post-MVP Big Bets

Once Emergency Plan MVP is real, HomeVault should expand into features that feel `distinctive`, `emotionally valuable`, and still true to the product's local-first trust model.

These future bets should follow five rules:

- They must deepen household resilience, not drift into generic productivity
- They must preserve local-first ownership of sensitive data
- They should reuse Emergency, Packet, Trusted Share, and Readiness primitives where possible
- They should create clear reasons to return to HomeVault throughout the year
- They should feel meaningfully different from a password manager, notes app, or insurer portal

### 18.1 Future Prioritization Lens

When choosing among future features, prefer work that scores well on:

- `Differentiation` - Feels unique and memorable in the market
- `Trust fit` - Strengthens the local-first/private-data promise
- `Stress usefulness` - Helps during a real household disruption
- `Retention value` - Gives households a reason to maintain the plan
- `Expansion leverage` - Reuses current records, sharing, and playbook infrastructure

### 18.2 Recommended Post-MVP Sequence

After MVP, the strongest expansion order is:

1. Guided drills and confidence loops
2. Offline resilience and rescue access
3. Dependent and pet care continuity
4. Incident evidence and recovery workspace
5. Household command center and role-based views
6. Seasonal and scenario-based readiness programs

This sequence keeps the product focused on `preparedness`, `handoff`, and `recovery` instead of sprawling into an unfocused home-management suite.

---

## 19. Future Feature Backlog

This backlog captures the next wave of exciting feature investments after the Emergency Plan MVP cut line.

### EP-6 - Guided Drills And Confidence Loops

#### Story EP-601 - Launch guided emergency drills

**As a household organizer, I want to run a guided practice scenario so I can prove our emergency plan works before a real incident happens.**

**Priority:** P1  
**Dependencies:** EP-101, EP-302

##### Tasks

- [x] Add `Run a drill` entry points from major incident playbooks.
- [x] Support short guided scenarios for lockout, lost phone, and internet outage.
- [x] Add a drill runner with step-by-step prompts, completion state, and optional timer.
- [x] Hide or gate high-sensitivity values until the relevant drill step needs them.
- [x] Capture which linked records were missing, stale, or confusing during the drill.

##### Acceptance Criteria

- [x] A household can complete at least one guided drill without editing live records mid-flow.
- [x] Drill output clearly identifies missing records, stale data, and blocked steps.
- [x] Sensitive values remain protected during drills unless explicitly revealed.

#### Story EP-602 - Turn drill friction into readiness work

**As a user, I want a drill summary that turns confusion into concrete follow-up tasks so practice actually improves the household plan.**

**Priority:** P1  
**Dependencies:** EP-601

##### Tasks

- [x] Add a post-drill summary with pass/blocker/missing-data outcomes.
- [x] Generate suggested follow-up actions from drill failures.
- [x] Track `last drilled` by incident type.
- [x] Add dashboard nudges when a core incident has never been practiced.
- [x] Add annual-review prompts for unpracticed or repeatedly failed incidents.

##### Acceptance Criteria

- [x] Drill results convert naturally into readiness improvements.
- [x] The app can distinguish between `configured` and `practiced` readiness.
- [x] Households can see which incidents feel most risky in practice.

### EP-7 - Offline Resilience And Rescue Access

#### Story EP-701 - Create an offline emergency companion pack

**As a user, I want a compact offline emergency pack so I can still access critical guidance when connectivity, app installs, or cloud services are unavailable.**

**Priority:** P1  
**Dependencies:** EP-201, EP-202, EP-301

##### Tasks

- [x] Define a compact offline pack format derived from packet and share-bundle primitives.
- [x] Support local export for a primary user device and one helper device.
- [x] Include incident playbooks, critical contacts, and selected emergency records in read-only form.
- [x] Define unlock semantics for offline packs using device-local protection where available.
- [x] Add clear warnings about staleness, rotation, and device loss tradeoffs.

##### Acceptance Criteria

- [x] A household can generate a usable offline emergency companion without exposing unrelated records.
- [x] Offline content remains read-only and clearly versioned.
- [x] The product communicates the limits of offline access honestly.

#### Story EP-702 - Add local rescue transfer paths

**As a household, I want to move emergency information directly between nearby devices so I can help someone even when accounts, installs, or email are not working.**

**Priority:** P2  
**Dependencies:** EP-701

##### Tasks

- [x] Define local transfer paths such as QR bootstrap, AirDrop/Nearby Share handoff, or file export.
- [x] Add sender and receiver preview states with provenance and omission details.
- [x] Add compatibility handling for unsupported app versions or incomplete imports.
- [x] Add rotation guidance for outdated rescue packs and transferred records.
- [x] Add regression coverage for interrupted transfer and partial-import states.

##### Acceptance Criteria

- [x] A user can transfer an emergency artifact locally without HomeVault-hosted infrastructure.
- [x] Recipients understand what they received, what is missing, and how current it is.
- [x] Failed or incomplete transfers do not create ambiguous imported state.

### EP-8 - Dependent And Pet Care Continuity

#### Story EP-801 - Add dependent and pet emergency cards

**As a caregiver, I want emergency-ready care cards for children, pets, and dependents so someone else can step in safely on short notice.**

**Priority:** P1  
**Dependencies:** EP-202

##### Tasks

- [x] Define care-card templates for child, pet, elder, and medical-dependent scenarios.
- [x] Add structured fields for medications, routines, pickup rules, provider contacts, and critical notes.
- [x] Add sensitivity levels for care details and selective-share defaults.
- [x] Reuse trusted-share and packet export for caregiver-safe handoff outputs.
- [x] Add missing-data prompts for high-risk gaps such as medication or emergency pickup info.

##### Acceptance Criteria

- [x] A household can prepare at least one care card without inventing a custom document from scratch.
- [x] Care cards share safely with caregiver audiences and omit unrelated household data.
- [x] The app highlights the most dangerous missing care details clearly.

#### Story EP-802 - Build caregiver handoff plans

**As a household, I want step-by-step caregiver handoff plans so temporary helpers know what matters first and what they are not authorized to do.**

**Priority:** P2  
**Dependencies:** EP-801, EP-203

##### Tasks

- [x] Add audience-specific caregiver plans for grandparents, babysitters, pet sitters, and elder helpers.
- [x] Define allowed vs. disallowed action guidance inside the handoff flow.
- [x] Add linked records for pickup contacts, doctors, vets, school details, and medications.
- [x] Add expiry-aware handoff bundles for short-term caregiving.
- [x] Add pre-handoff review prompts before travel or caregiver transitions.

##### Acceptance Criteria

- [x] Temporary caregivers can receive a focused plan without reading the entire household system.
- [x] Caregiver handoffs make scope limits explicit.
- [x] Short-term care plans are easy to rotate or reissue.

### EP-9 - Incident Evidence And Recovery Workspace

#### Story EP-901 - Capture evidence and claim timelines

**As a homeowner, I want a structured incident log so I can document damage, conversations, and recovery steps while events are unfolding.**

**Priority:** P1  
**Dependencies:** EP-101, EP-502

##### Tasks

- [x] Add incident-workspace creation for insurance, utility, theft, and property-damage scenarios.
- [x] Support timestamped notes, photos, document links, claim numbers, and contact interactions.
- [x] Add quick links from incident playbooks into a new or existing incident workspace.
- [x] Add exportable incident summaries for insurer, landlord, or contractor handoff.
- [x] Define retention and archival behavior for closed incidents.

##### Acceptance Criteria

- [x] A household can capture a coherent recovery timeline during an active incident.
- [x] Incident evidence stays linked to the relevant records and contacts.
- [x] Summaries can be exported without exposing unrelated household information.

#### Story EP-902 - Track recovery work after the incident

**As a user, I want HomeVault to help me close the loop after an emergency so I do not lose track of repairs, reimbursements, or next steps.**

**Priority:** P2  
**Dependencies:** EP-901

##### Tasks

- [x] Add local-only recovery checklists for repairs, replacements, reimbursements, and follow-ups.
- [x] Add status tracking for open claims, contractor steps, and reimbursements.
- [x] Add reminders for unresolved work and missing evidence.
- [x] Add a `return to ready` flow that turns incident lessons into plan improvements.
- [x] Add archive/export support for completed recovery workspaces.

##### Acceptance Criteria

- [x] HomeVault supports both the incident moment and the recovery tail.
- [x] Users can see what is still unresolved after the first emergency rush passes.
- [x] Recovery learnings can feed back into household readiness.

### EP-10 - Household Command Center And Role-Based Views

#### Story EP-1001 - Map household ownership and fallback roles

**As a household, I want to define who owns what so the plan still works when the primary organizer is unavailable.**

**Priority:** P1  
**Dependencies:** EP-301, EP-401

##### Tasks

- [x] Add ownership fields for utilities, insurance, devices, school contacts, pets, and home services.
- [x] Add fallback-owner or backup-helper roles for critical responsibilities.
- [x] Show ownership gaps directly in readiness scoring and Emergency views.
- [x] Add annual-review prompts for role drift after household changes.
- [x] Define exports that summarize `who handles what` during a handoff.

##### Acceptance Criteria

- [x] A household can see whether every critical responsibility has an owner and a backup.
- [x] Readiness reflects responsibility gaps, not just missing records.
- [x] Handoff artifacts can answer `who should do this?` quickly.

#### Story EP-1002 - Add audience-specific emergency views

**As a spouse, teen, or helper, I want a focused emergency view so I see only the steps and records relevant to me.**

**Priority:** P2  
**Dependencies:** EP-1001, EP-202

##### Tasks

- [x] Define role-based Emergency views for spouse/partner, teen helper, house sitter, and emergency helper.
- [x] Filter records, playbooks, and contact actions by audience relevance.
- [x] Add warnings where a role lacks authority or needs adult escalation.
- [x] Reuse share presets and packet presets for audience-specific surfaces.
- [x] Add tests for role-based visibility and omitted-data behavior.

##### Acceptance Criteria

- [x] A helper can land in a simplified emergency experience tailored to their role.
- [x] Sensitive or irrelevant data stays hidden by default.
- [x] The product reduces panic by shrinking the amount of information a helper must parse.

### EP-11 - Seasonal And Scenario-Based Readiness Programs

#### Story EP-1101 - Add seasonal preparedness programs

**As a household, I want HomeVault to help us prepare before predictable events so emergency readiness becomes a habit instead of a once-a-year chore.**

**Priority:** P2  
**Dependencies:** EP-302, EP-502

##### Tasks

- [x] Add seasonal readiness tracks for storm season, wildfire smoke, winter freeze, and summer travel.
- [x] Reuse current records and playbooks to build lightweight prep checklists.
- [ ] Add calendar-aware prompts based on region or household settings.
- [x] Add readiness summaries that distinguish `not prepared yet` from `incident active`.
- [ ] Add completion tracking and seasonal rollover behavior.

##### Acceptance Criteria

- [ ] Households receive actionable prep prompts before common disruptions.
- [ ] Seasonal programs feel like an extension of Emergency Plan, not a separate product.
- [ ] The app can show whether a household prepared ahead of time.

#### Story EP-1102 - Add life-event setup programs

**As a user, I want guided setup programs for major household changes so my emergency plan keeps pace with real life.**

**Priority:** P2  
**Dependencies:** EP-1001

##### Tasks

- [ ] Add guided programs for moving, newborn setup, new pet, aging-parent support, and major renovation.
- [ ] Map each program to required records, handoff updates, and role-review tasks.
- [ ] Add progress tracking across several short sessions instead of one long setup flow.
- [ ] Add suggested packet/share updates when the household context changes.
- [ ] Add follow-up review prompts after the event stabilizes.

##### Acceptance Criteria

- [ ] Users can adapt Emergency Plan to major life changes without rebuilding from scratch.
- [ ] Each program generates meaningful readiness improvements, not generic checklists.
- [ ] Household changes naturally trigger plan maintenance.

---

## 20. Recommended Big-Swing Candidates

If we want the most exciting and commercially interesting post-MVP bets first, start here:

1. `EP-601` Guided emergency drills
2. `EP-701` Offline emergency companion pack
3. `EP-801` Dependent and pet emergency cards

Why these three:

- They feel emotionally resonant and easy to explain
- They deepen HomeVault's trust and local-first differentiation
- They create visible value beyond a static document store
- They open room for premium packaging later without requiring hosted collaboration

---

## 21. Brainstorm Pile

This section is intentionally messy. These are `interesting`, `exciting`, or `strategically provocative` ideas that may turn into future epics later.

### 21.1 Product Shape Ideas

- Emergency Plan as the household's `operating manual`, not just a folder of records
- A `calm mode` UI that strips the app down to only urgent steps and contacts during an incident
- A `just tell me what to do next` experience for overwhelmed helpers
- A `what breaks if I disappear for 72 hours` household gap detector
- A `preparedness score with confidence`, not just completeness
- A `spouse can actually use this` standard as a product gate

### 21.2 Sharing And Trust Ideas

- Single-use helper bundles
- Printable emergency cards with scannable local bundle references
- A fridge-print emergency sheet generated from selected HomeVault records
- Role-based handoff packs for spouse, babysitter, teen, contractor, pet sitter, house sitter
- Shared-item expiration that nudges the household to rotate codes afterward
- A redacted preview mode that explains what is hidden and why
- A `break glass` emergency reveal flow with very explicit warnings
- Household trust circles with predefined sharing defaults

### 21.3 Drill And Training Ideas

- Practice mode for lockout, lost phone, storm evacuation, and insurance claim start
- `Two-minute drill` versions for busy households
- Annual `family readiness checkup`
- A drill score that measures speed, confusion points, and missing records
- After-action summaries like `you found the right contact, but the recovery phone was stale`
- A `helper rehearsal` mode where a spouse or teen tries the plan cold
- Seasonal drill prompts like `run your storm prep walk-through this weekend`

### 21.4 Offline And Local-First Ideas

- Fully offline emergency companion mode
- Nearby device handoff with QR bootstrap
- Air-gapped printable packet plus local encrypted digital companion
- A local-only vault migration or rescue key for catastrophic phone loss
- Home device pairing for spouse devices without hosted sync
- USB export mode for the truly paranoid/prepared household
- Home printer optimized emergency packet layouts

### 21.5 Family And Care Ideas

- Child pickup and caregiver authority notes
- Pet emergency cards with meds, feeding, vet, and microchip info
- Elder care continuity plans
- `If I am hospitalized today` caregiver handoff
- `If we both get delayed` backup child logistics
- Medication schedule quick cards
- School closure / emergency pickup cheat sheet
- Special-needs care profile support

### 21.6 Incident And Recovery Ideas

- Insurance incident workspace
- Theft / burglary response plan
- Flood / fire / smoke recovery plan
- Lost wallet / passport / ID response
- Major appliance failure response
- Renovation disruption checklist
- Utility shutoff triage flow
- Recovery timeline and claim log
- Vendor call notes with timestamps and outcomes
- `return household to normal` checklist after an incident

### 21.7 Cyber Safety Ideas

- Family scam scripts: what to say when pressured on the phone
- `who can recover the family email` health check
- Recovery drift warnings for Apple, Google, and carrier accounts
- Elder scam protection guidance
- Teen device safety and recovery basics
- Shared-account ownership mapping
- `you are one lost phone away from chaos` warnings when key recovery coverage is missing
- A no-jargon digital resilience score

### 21.8 Home And Property Ops Ideas

- Shutoff map support for gas, water, breaker, and alarm
- Photo-based utility labeling
- Appliance restart instructions library
- `new house setup` emergency onboarding
- Room-by-room claim prep
- Home maintenance tasks that affect emergency readiness
- Smart-home dependency map: what fails when internet or power is gone
- Generator / battery / backup power readiness

### 21.9 Lifestyle And Life-Event Ideas

- Travel handoff mode
- New baby readiness mode
- Moving-house transition plan
- Aging parent support setup
- Divorce / separation emergency reconfiguration support
- Death of primary organizer continuity mode
- College student move-out / move-in safety pack
- Short-term rental or guest-host emergency kit

### 21.10 Delight And Differentiation Ideas

- HomeVault-generated `family emergency binder` aesthetic export
- Calm, high-trust print design that feels worth keeping physically
- A yearly `resilience report` for the household
- Progress celebrations like `your family now has a usable emergency handoff`
- Before/after readiness views
- A `top 3 risks this month` summary
- A `we can survive a lost phone now` milestone

### 21.11 Wild Card Ideas

- Voice-guided emergency walkthroughs
- On-device assistant that answers `what do I do right now?` from local records only
- NFC tags for local emergency access entry points in the house
- Car emergency kit companion
- Neighborhood mutual-aid contact exports
- Document scanner mode optimized for emergency papers
- Memory prompts for older adults or stressed helpers
- Multi-household support for adult children helping parents remotely via exported packs

### 21.12 Rough Filters For Later

Ideas worth turning into real backlog items later usually have at least two of these:

- They make a real emergency materially easier
- They strengthen the local-first trust story
- They are easy to explain in one sentence
- They are valuable even if only one adult in the household uses HomeVault
- They create recurring engagement without becoming noisy

### 21.13 Fresh Sparks To Revisit

- A `what fails next` simulation when internet, power, phone, or one adult is unavailable
- Cash-access continuity: where money can still move in a crisis
- Emergency meal / supply continuity for families with kids, pets, or medical needs
- A `weekend away` stress test that reveals household dependency on one person
- Local-only `ask my house` guidance that answers from structured HomeVault records
- A `new homeowner first 30 days` resilience ramp
- A `parent helping aging parent` export path that stays privacy-preserving
- Memorialized or archived household plans after a death, move, or divorce

---

## 22. Additional Big-Bet Backlog

This section intentionally reaches further. These ideas are less MVP-adjacent, but they could become the features people talk about when they describe why HomeVault feels special.

### EP-12 - Financial Continuity And Crisis Access

#### Story EP-1201 - Build a financial continuity snapshot

**As a household, I want a crisis-safe view of financial access so we know how bills, claims, and urgent spending can still happen during a disruption.**

**Priority:** P1  
**Dependencies:** EP-202, EP-401

##### Tasks

- [ ] Define a financial continuity model that tracks `what exists`, `who can access it`, and `what is blocked`.
- [ ] Add structured records for emergency fund location, claim payment destination, bill autopay awareness, and critical due dates.
- [ ] Add ownership and backup-access prompts for key financial operations.
- [ ] Add warnings when financial continuity depends on one unreachable person or one device.
- [ ] Reuse Emergency and handoff surfaces to present a crisis-safe financial snapshot without storing bank secrets.

##### Acceptance Criteria

- [ ] A household can understand how urgent money movement and bills continue during a disruption.
- [ ] The UI avoids acting like a banking or password product.
- [ ] The app can highlight financial continuity risk caused by single-person ownership.

#### Story EP-1202 - Add urgent cash and claims playbooks

**As a user, I want practical financial-response playbooks so I can handle immediate spending pressure after an incident without guessing.**

**Priority:** P2  
**Dependencies:** EP-1201, EP-901

##### Tasks

- [ ] Add playbooks for urgent lodging, emergency repairs, deductible planning, and waiting for insurance reimbursement.
- [ ] Link playbooks to insurance, payment, and contact records already in HomeVault.
- [ ] Add prompts for documenting purchases and reimbursement-sensitive spending.
- [ ] Add guidance for what information a spouse or helper needs versus what should stay private.
- [ ] Add local-only export summaries for crisis spending and claim coordination.

##### Acceptance Criteria

- [ ] Households get concrete next steps for the first 24-72 hours of financial disruption.
- [ ] Urgent-spending flows reinforce documentation discipline.
- [ ] The experience remains preparedness-oriented, not financial-management bloat.

### EP-13 - Household Dependency Graph

#### Story EP-1301 - Map critical household dependencies

**As a household organizer, I want HomeVault to show what depends on what so hidden fragility becomes visible before a real failure.**

**Priority:** P1  
**Dependencies:** EP-301, EP-1001

##### Tasks

- [ ] Define dependency links between people, devices, utilities, accounts, documents, and physical-access systems.
- [ ] Add a household dependency model for critical chains like `internet -> router -> admin access -> primary phone setup`.
- [ ] Add missing-link detection for high-risk chains.
- [ ] Expose plain-language dependency summaries from Emergency and annual review.
- [ ] Add visual or list-based views that avoid overwhelming non-technical households.

##### Acceptance Criteria

- [ ] Users can identify at least one hidden single point of failure in their household setup.
- [ ] Dependency summaries remain understandable without systems jargon.
- [ ] Missing links can be converted into concrete readiness tasks.

#### Story EP-1302 - Simulate disruption scenarios

**As a user, I want to simulate losing one person, device, or service so I can see what else breaks and fix those weaknesses ahead of time.**

**Priority:** P2  
**Dependencies:** EP-1301, EP-601

##### Tasks

- [ ] Add scenario simulation for `primary phone lost`, `internet down`, `power out`, and `primary organizer unavailable`.
- [ ] Show first-order and second-order effects using dependency data.
- [ ] Suggest mitigation steps such as alternate contacts, printed exports, backup ownership, or fresh reviews.
- [ ] Add scenario summaries to drill results and annual review.
- [ ] Add guardrails so simulated outputs stay actionable instead of alarmist.

##### Acceptance Criteria

- [ ] A user can run a simple disruption simulation and understand what else fails.
- [ ] Simulation output leads directly to realistic mitigation work.
- [ ] The experience feels clarifying, not fear-inducing.

### EP-14 - Legacy And Incapacitation Continuity

#### Story EP-1401 - Add incapacitation mode planning

**As a household, I want HomeVault to help with temporary incapacitation scenarios so someone else can keep life running if I am hospitalized or unavailable.**

**Priority:** P1  
**Dependencies:** EP-202, EP-1001

##### Tasks

- [ ] Define an `incapacitation mode` framework for 72-hour, one-week, and longer disruption windows.
- [ ] Add prompts for must-continue responsibilities such as childcare, pets, utilities, medication, and bill awareness.
- [ ] Add focused handoff bundles for trusted adults stepping in temporarily.
- [ ] Add missing-data prompts for responsibilities that have no backup owner.
- [ ] Add review guidance after major household changes such as surgery prep, pregnancy, or caretaker transitions.

##### Acceptance Criteria

- [ ] A household can prepare a temporary continuity plan without exposing the full household archive.
- [ ] The app distinguishes temporary incapacity from death or long-term estate planning.
- [ ] Users can see which core responsibilities lack a backup.

#### Story EP-1402 - Add legacy handoff and archive planning

**As a user, I want a respectful long-term handoff framework so my household knowledge does not disappear if I die or permanently step away from managing things.**

**Priority:** P2  
**Dependencies:** EP-1401

##### Tasks

- [ ] Define a legacy-handoff scope that covers household operations, not legal-document replacement.
- [ ] Add archive/export flows for durable household knowledge such as service context, shutdown steps, contacts, and document locations.
- [ ] Add audience guidance for spouse, adult child, executor helper, or co-owner.
- [ ] Add copy and guardrails distinguishing HomeVault from wills, trusts, and law-firm products.
- [ ] Add retention and memorialization options for old household plans.

##### Acceptance Criteria

- [ ] Users can create a durable household-knowledge handoff without confusing it for estate law.
- [ ] The product remains respectful and practical in tone.
- [ ] Legacy outputs are focused enough to be usable during a difficult transition.

### EP-15 - Local Household Guidance Engine

#### Story EP-1501 - Add local-first guided answers

**As a stressed user, I want HomeVault to answer direct emergency questions from my own records so I do not have to hunt through tabs under pressure.**

**Priority:** P1  
**Dependencies:** EP-601, EP-1301

##### Tasks

- [ ] Define a local-only guidance layer that can answer constrained questions from structured HomeVault data.
- [ ] Support prompts such as `what do I do if the internet is out?`, `who can help with the kids?`, and `where is the shutoff guidance?`
- [ ] Add source-linked answers that always point back to the records and playbooks used.
- [ ] Add sensitivity rules so protected details still require local step-up verification.
- [ ] Add failure states when the app lacks enough data to answer confidently.

##### Acceptance Criteria

- [ ] A user can ask a small set of direct emergency questions and get useful, source-backed guidance.
- [ ] Answers never imply cloud processing or hidden data access.
- [ ] Sensitive fields remain protected even when surfaced through guidance.

#### Story EP-1502 - Add calm-mode incident coaching

**As a helper, I want HomeVault to guide me one decision at a time so I can help without being overwhelmed by the whole household system.**

**Priority:** P2  
**Dependencies:** EP-1501, EP-1002

##### Tasks

- [ ] Add a calm-mode flow that narrows the interface to the current incident, next step, and relevant contacts.
- [ ] Support `show only what matters now` interaction patterns for helpers.
- [ ] Add escalation states for when a helper lacks authority or required information.
- [ ] Add drill compatibility so households can practice calm-mode before a real event.
- [ ] Add post-incident feedback prompts about what guidance was confusing or missing.

##### Acceptance Criteria

- [ ] Helpers can move through an incident with reduced cognitive load.
- [ ] Calm-mode stays tightly grounded in the existing emergency records and playbooks.
- [ ] The product feels supportive without pretending to be a human responder.

---

## 23. Best Future Narratives

If we want memorable storylines for future product development and marketing, the strongest ones now are:

1. `HomeVault helps your family function when the organizer is unavailable.`
2. `HomeVault turns household knowledge into a usable emergency operating system.`
3. `HomeVault shows you not just what you have, but what breaks if something fails.`
4. `HomeVault helps a real helper do the right thing under stress.`

These narratives are useful filters for deciding which brainstorm ideas deserve to become real backlog items next.

---

## 24. Additional Expansion Tracks

This section keeps stretching the long-range backlog outward from the same Emergency Plan core.

### EP-16 - Household Resilience Operations

#### Story EP-1601 - Add readiness-critical home systems tracking

**As a homeowner, I want HomeVault to track the home systems that matter during disruptions so I can prepare before one weak system cascades into a bigger problem.**

**Priority:** P1  
**Dependencies:** EP-301, EP-1301

##### Tasks

- [ ] Define structured readiness records for generator, backup battery, sump pump, water shutoff, HVAC emergency notes, and freezer/fridge continuity.
- [ ] Add maintenance cadence and `last checked` prompts for emergency-relevant systems.
- [ ] Add links between home systems and the incidents they affect.
- [ ] Add missing-data prompts for households that depend on equipment they have not documented.
- [ ] Reuse Emergency and annual review surfaces to highlight operational fragility.

##### Acceptance Criteria

- [ ] A household can see which home systems most affect emergency readiness.
- [ ] The app can distinguish documented systems from maintained systems.
- [ ] Home-system readiness feeds concrete next steps instead of passive inventory.

#### Story EP-1602 - Build supply and continuity checklists

**As a household, I want lightweight supply continuity planning so short disruptions do not immediately turn into chaos.**

**Priority:** P2  
**Dependencies:** EP-1601, EP-1101

##### Tasks

- [ ] Add supply categories for water, lighting, backup power, medications, pet food, infant needs, and shelf-stable meals.
- [ ] Add `days covered` or lightweight coverage estimates without becoming a prepper inventory app.
- [ ] Add household-size-aware prompts for likely supply gaps.
- [ ] Add seasonal and incident-linked checklist variants such as storm, freeze, and outage.
- [ ] Add review nudges when emergency supplies are stale, low-confidence, or never reviewed.

##### Acceptance Criteria

- [ ] Households can build a simple supply continuity picture without heavy data entry.
- [ ] Supply planning stays practical and family-oriented.
- [ ] The app can point out a few high-value gaps without demanding exhaustive inventory.

### EP-17 - Neighborhood And Mutual Aid Readiness

#### Story EP-1701 - Add trusted neighbor and local-support plans

**As a household, I want to document nearby human support so help does not depend only on distant contacts or formal services.**

**Priority:** P2  
**Dependencies:** EP-202, EP-1001

##### Tasks

- [ ] Add structured contact roles for neighbor, nearby family, backup key holder, pet backup, and emergency pickup support.
- [ ] Add optional trust notes such as `has house key`, `can check on pets`, or `can receive deliveries`.
- [ ] Add audience-safe share presets for mutual-aid handoffs.
- [ ] Add prompts for incomplete nearby-support coverage in Emergency and annual review.
- [ ] Add local-only exports for a focused neighborhood support sheet.

##### Acceptance Criteria

- [ ] A household can see whether nearby help exists for common disruptions.
- [ ] Mutual-aid planning remains opt-in and privacy-aware.
- [ ] The app surfaces local-support gaps without becoming a social network.

#### Story EP-1702 - Create community disruption playbooks

**As a user, I want HomeVault to recognize neighborhood-scale disruptions so the plan still feels useful when the whole area is affected.**

**Priority:** P2  
**Dependencies:** EP-1701, EP-502

##### Tasks

- [ ] Add playbook variants for neighborhood power outage, boil-order/water issue, and evacuation warning.
- [ ] Add prompts that distinguish `personal issue` from `community-wide disruption`.
- [ ] Add guidance on when to use neighbors, family, official contacts, or printed packets.
- [ ] Add checklist hooks for shared constraints like road closures, gas shortages, or cell congestion.
- [ ] Add review prompts after community incidents to improve future readiness.

##### Acceptance Criteria

- [ ] HomeVault supports disruptions where outside services and nearby households are affected at the same time.
- [ ] Community-disruption guidance remains practical and non-alarmist.
- [ ] Existing records and exports remain central to the experience.

### EP-18 - New Household And Major Transition Readiness

#### Story EP-1801 - Launch a new-homeowner resilience ramp

**As a new homeowner, I want a guided first-30-days setup so I can become emergency-ready quickly without already knowing how houses work.**

**Priority:** P1  
**Dependencies:** EP-1102, EP-1601

##### Tasks

- [ ] Add a guided `first 30 days` program for shutoffs, utilities, insurance, locks, key devices, and emergency contacts.
- [ ] Add progress checkpoints for week one, week two, and first month.
- [ ] Add quick-win tasks that produce visible readiness gains early.
- [ ] Add handoff and packet prompts as soon as core records exist.
- [ ] Add simplified copy for first-time homeowners who lack home-systems vocabulary.

##### Acceptance Criteria

- [ ] A new homeowner can reach a meaningful emergency baseline within the first month.
- [ ] The flow teaches the household what matters without requiring prior expertise.
- [ ] Progress feels motivating rather than overwhelming.

#### Story EP-1802 - Add household transition reset programs

**As a user, I want HomeVault to help reset the emergency plan after major changes so outdated assumptions do not linger for months.**

**Priority:** P2  
**Dependencies:** EP-1102, EP-1401

##### Tasks

- [ ] Add reset programs for move-in, move-out, renovation, new baby, separation/divorce, and adult child move-out.
- [ ] Identify which records, handoffs, roles, and playbooks need review for each transition.
- [ ] Add before/after readiness comparisons to show what changed.
- [ ] Add archive and cleanup prompts for obsolete records and old helper access.
- [ ] Add follow-up review reminders after the transition settles.

##### Acceptance Criteria

- [ ] Households can re-stabilize Emergency Plan after major life changes.
- [ ] The app helps remove outdated assumptions, not just add new records.
- [ ] Transition programs feel grounded in real household disruption risk.

---

## 25. More Brainstorm Fuel

### 25.1 Readiness Rituals

- Monthly five-minute `household pulse` check
- A `before we leave town` readiness sweep
- A `storm coming tomorrow` one-tap checklist
- `review one critical thing tonight` nudges
- `confidence decay` when nothing has been reviewed or drilled in a long time

### 25.2 Packaging And Positioning

- A `household continuity` framing that feels broader than emergencies alone
- A premium-looking physical export people actually keep in a drawer
- A readiness timeline that shows how the family became more resilient over time
- A `household single points of failure` report
- A `what your partner would struggle with right now` insight surface

### 25.3 More Wild Cards

- Car breakdown and roadside continuity plans
- Vacation-rental arrival rescue pack
- Local weather-radio or alert prep guidance without becoming a weather app
- Teen independence ramp: what they should know before driving or staying home alone
- Household resilience for blended families and co-parent logistics
- A `week without me` simulation based on roles, supplies, and dependencies

---

## 26. More Structured Expansion Work

### EP-19 - Readiness Rituals And Insight Reports

#### Story EP-1901 - Add recurring household pulse checks

**As a busy household organizer, I want very short recurring readiness rituals so Emergency Plan stays current without turning into a giant annual project.**

**Priority:** P1  
**Dependencies:** EP-302, EP-602

##### Tasks

- [ ] Add a lightweight `household pulse` flow designed to finish in under five minutes.
- [ ] Rotate prompts across stale records, missing backups, unpracticed incidents, and ownership gaps.
- [ ] Add configurable cadence options such as monthly, pre-travel, and seasonal check-ins.
- [ ] Add progress feedback that celebrates meaningful improvements without gamifying emergencies awkwardly.
- [ ] Add defer/snooze behavior that preserves trust and avoids nagging.

##### Acceptance Criteria

- [ ] A household can complete a useful readiness check-in in a few minutes.
- [ ] Pulse checks drive real plan maintenance rather than generic notifications.
- [ ] The feature increases continuity without making HomeVault feel noisy.

#### Story EP-1902 - Generate high-signal resilience reports

**As a user, I want a clear resilience report so I can understand our biggest household weaknesses and improvements at a glance.**

**Priority:** P2  
**Dependencies:** EP-1901, EP-1301

##### Tasks

- [ ] Add a `single points of failure` report that highlights over-dependence on one person, device, or record.
- [ ] Add before/after readiness snapshots tied to drills, reviews, and completed tasks.
- [ ] Add a partner-helper view such as `what someone else would struggle with today`.
- [ ] Add printable and share-safe summary formats that avoid exposing sensitive values.
- [ ] Add narrative copy that keeps the report motivating instead of judgmental.

##### Acceptance Criteria

- [ ] Households can understand their top continuity risks quickly.
- [ ] Reports are useful for planning conversations with a spouse or helper.
- [ ] Reporting stays grounded in actionability, not vanity metrics.

### EP-20 - Teen And Distributed Household Readiness

#### Story EP-2001 - Add teen independence readiness

**As a parent, I want a safe way to prepare teens for common household incidents so they know what to do without exposing the entire family system.**

**Priority:** P2  
**Dependencies:** EP-1002, EP-1502

##### Tasks

- [ ] Define teen-safe emergency views for staying home alone, contacting trusted adults, and responding to common disruptions.
- [ ] Add age-appropriate guidance for lockout, power outage, internet outage, and minor household issues.
- [ ] Add clear escalation rules for when to call a parent, neighbor, emergency services, or no one.
- [ ] Add role-based redaction so teens see only the details they truly need.
- [ ] Add practice prompts or drills families can run together.

##### Acceptance Criteria

- [ ] Families can prepare teens for realistic household disruptions without oversharing sensitive data.
- [ ] Teen flows feel supportive and bounded, not patronizing.
- [ ] Parents can tell which incidents a teen is prepared to handle.

#### Story EP-2002 - Support blended-family and co-parent continuity

**As a household with shared custody or multiple homes, I want continuity plans that reflect real family logistics instead of assuming one static household.**

**Priority:** P2  
**Dependencies:** EP-801, EP-1001

##### Tasks

- [ ] Define household-link patterns for co-parent contacts, alternate homes, pickup plans, and care handoffs.
- [ ] Add audience-safe share outputs for another parent, grandparent, or temporary caregiver.
- [ ] Add guidance for what belongs in one household plan versus a cross-household handoff.
- [ ] Add prompts for schedule-sensitive or location-sensitive emergency details.
- [ ] Add privacy guardrails so one household does not expose unrelated records to another.

##### Acceptance Criteria

- [ ] HomeVault can support families whose emergency plans span more than one home.
- [ ] Cross-household coordination stays privacy-aware and scope-limited.
- [ ] The product feels realistic for blended-family logistics.

### EP-21 - Mobility And Away-From-Home Continuity

#### Story EP-2101 - Add roadside and car-breakdown continuity plans

**As a household, I want a roadside continuity flow so vehicle problems do not become full-family chaos when someone is stranded away from home.**

**Priority:** P2  
**Dependencies:** EP-202, EP-1502

##### Tasks

- [ ] Add vehicle-ready emergency cards for insurance, roadside assistance, towing preferences, and trusted contacts.
- [ ] Add a car-breakdown playbook with immediate safety steps and decision branches.
- [ ] Add audience-specific versions for primary driver, teen driver, and helper pickup.
- [ ] Add local export or mobile-friendly quick access for away-from-home use.
- [ ] Add missing-data prompts for households that rely heavily on one vehicle or one driver.

##### Acceptance Criteria

- [ ] A household can prepare a focused roadside plan without building a full vehicle-management product.
- [ ] Car-breakdown guidance is practical for real stress moments.
- [ ] The app supports both adult and teen driver contexts safely.

#### Story EP-2102 - Build temporary-stay and travel-arrival rescue packs

**As a traveler, I want a minimal rescue pack for hotels, rentals, or staying with family so I can recover quickly when something goes wrong away from home.**

**Priority:** P2  
**Dependencies:** EP-202, EP-501

##### Tasks

- [ ] Define a travel rescue pack with identity, lodging, transportation, emergency contacts, and key health/care notes.
- [ ] Add temporary destination-specific handoff options for vacation rentals or staying with relatives.
- [ ] Add prompts for what should be packed digitally, printed, or both.
- [ ] Add expiry and cleanup behavior after a trip ends.
- [ ] Add quick pre-travel validation that the rescue pack is current enough to rely on.

##### Acceptance Criteria

- [ ] Users can prepare a focused away-from-home continuity pack without exposing their full household archive.
- [ ] Travel rescue outputs are easy to rotate and discard after use.
- [ ] The feature feels like a natural extension of trusted handoff and packet workflows.

---

## 27. Extra Brainstorm Threads

### 27.1 Rituals And Habits

- `Sunday reset` mode for one small readiness improvement
- `storm watch tonight` prep sweep
- `you have not tested this in 14 months` honesty prompts
- Household continuity streaks, but only if they stay tasteful
- A `five things only you know` risk detector

### 27.2 Family Dynamics

- A `could my partner handle this tomorrow?` readiness view
- Separate confidence levels for primary organizer, spouse, teen, and helper
- Guidance for families where one adult is much less technical
- `who knows where the paper stuff is` continuity prompts
- Post-divorce cleanup for old access, records, and assumptions

### 27.3 Away-From-Home Sparks

- Campus move-in safety pack
- Summer camp caregiver packet
- Family road-trip continuity checklist
- International travel fallback notes without becoming a passport vault
- `phone dead at the airport` rescue flow

---

## 28. Further Expansion Backlog

### EP-22 - Document Resilience And Paper Recovery

#### Story EP-2201 - Build emergency-paper capture and readiness

**As a household, I want HomeVault to help with critical paper-based information so important documents do not remain invisible just because they are stuck in drawers and folders.**

**Priority:** P1  
**Dependencies:** EP-301, EP-901

##### Tasks

- [ ] Define a lightweight emergency-document readiness model for IDs, policies, manuals, medical forms, school paperwork, and signed household documents.
- [ ] Add `captured`, `location known`, `copied/exported`, and `needs refresh` states for paper-heavy records.
- [ ] Add prompts for where originals live and whether a usable copy exists.
- [ ] Add document-priority guidance for the first packet, first drill, and first incident workspace.
- [ ] Add missing-data states for households whose key paper records are known but not accessible.

##### Acceptance Criteria

- [ ] Households can tell which paper documents matter most in a disruption.
- [ ] The app distinguishes document awareness from true document readiness.
- [ ] Paper readiness improves packet, drill, and incident outcomes without becoming a generic document manager.

#### Story EP-2202 - Add scanner-assisted emergency intake

**As a user, I want a faster way to capture emergency papers so preparing the plan does not depend on tedious manual entry.**

**Priority:** P2  
**Dependencies:** EP-2201

##### Tasks

- [ ] Add document-scanner workflows optimized for emergency paperwork rather than generic filing.
- [ ] Add suggested document types such as insurance card, utility bill, school contact sheet, and appliance label.
- [ ] Add post-scan prompts for linking a document to incidents, owners, or playbooks.
- [ ] Add quality/confidence states for blurry, partial, or uncategorized scans.
- [ ] Add clear guidance for what should remain physical, digital, or both.

##### Acceptance Criteria

- [ ] Users can capture key emergency papers with materially less effort.
- [ ] Scanned documents become usable inside the Emergency Plan system quickly.
- [ ] The experience stays focused on continuity value rather than raw document volume.

### EP-23 - Household Know-How And Memory Capture

#### Story EP-2301 - Capture household operating knowledge

**As a household organizer, I want to preserve the little pieces of know-how in my head so the house still functions when I am unavailable.**

**Priority:** P1  
**Dependencies:** EP-1001, EP-1401

##### Tasks

- [ ] Define a structured `household know-how` layer for routines, quirks, shutdown steps, vendor preferences, and hidden gotchas.
- [ ] Add prompts like `what would confuse someone else here?` and `what only one person knows?`
- [ ] Add links from know-how notes to relevant records, rooms, systems, devices, and incidents.
- [ ] Add sensitivity and audience rules so helpful context can be shared without overexposing private notes.
- [ ] Add annual-review prompts for stale or one-owner-only knowledge.

##### Acceptance Criteria

- [ ] HomeVault can preserve practical household knowledge that does not fit neatly into account or contact records.
- [ ] The app surfaces fragile one-person-only knowledge before it becomes a real risk.
- [ ] Know-how capture feels structured enough to be useful but light enough to maintain.

#### Story EP-2302 - Turn hidden knowledge into helper-safe guidance

**As a helper, I want the household's quirks translated into usable instructions so I do not have to decode someone else's mental model under stress.**

**Priority:** P2  
**Dependencies:** EP-2301, EP-1502

##### Tasks

- [ ] Convert relevant know-how into calm-mode hints, packet notes, and audience-specific handoff tips.
- [ ] Add `good to know`, `important`, and `critical` severity labels for helper-facing guidance.
- [ ] Add prompts for confusing areas like trash day, package handling, appliance quirks, pet routines, and alarm oddities.
- [ ] Add feedback loops for helpers to mark what was useful or still confusing.
- [ ] Add guardrails against turning the product into a sprawling personal wiki.

##### Acceptance Criteria

- [ ] Helpers receive context that reduces mistakes and friction.
- [ ] Only the most useful knowledge is elevated into emergency-facing outputs.
- [ ] HomeVault stays operational and concise rather than note-hoarding.

### EP-24 - Service Provider And Contractor Continuity

#### Story EP-2401 - Build service-provider continuity profiles

**As a homeowner, I want my key providers organized around continuity so I know who to call, what they handle, and what context they need when something breaks.**

**Priority:** P2  
**Dependencies:** EP-202, EP-901

##### Tasks

- [ ] Add provider profiles for plumber, electrician, HVAC, roofer, locksmith, pediatrician, vet, and other high-value household services.
- [ ] Add structured fields for emergency availability, account numbers, service notes, property context, and preferred contact path.
- [ ] Link providers to incidents, systems, documents, and prior recovery workspaces.
- [ ] Add readiness prompts for households that rely on providers but have no documented contact path.
- [ ] Add audience-safe exports for helpers coordinating repairs or appointments.

##### Acceptance Criteria

- [ ] Users can quickly identify the right provider and relevant context during an incident.
- [ ] Provider records reduce duplicate scrambling during repeated household issues.
- [ ] The experience feels continuity-oriented rather than CRM-like.

#### Story EP-2402 - Add contractor and repair coordination flows

**As a user, I want HomeVault to help me coordinate repairs after an incident so the follow-through is less chaotic once the first emergency passes.**

**Priority:** P2  
**Dependencies:** EP-2401, EP-902

##### Tasks

- [ ] Add repair coordination checklists tied to incident workspaces.
- [ ] Add fields for estimate requested, visit scheduled, work completed, reimbursement pending, and warranty follow-up.
- [ ] Add prompts for what to share with a contractor versus what should stay internal.
- [ ] Add space for property-access notes, appliance serials, claim references, and before/after photos.
- [ ] Add local-only export summaries for insurer, landlord, or household partner coordination.

##### Acceptance Criteria

- [ ] HomeVault helps bridge the gap between the incident and the repair tail.
- [ ] Contractor coordination reuses existing records and evidence instead of creating a separate planning island.
- [ ] Users can keep recovery moving without exposing more than necessary.

---

## 29. More Brainstorm Seeds

### 29.1 Paper And Records

- `what papers would you grab in 10 minutes` drill
- Drawer, safe, filing cabinet, and lockbox location confidence
- A `paper chaos` score for households that know documents exist but cannot reach them
- A `first printable packet` optimized for families who trust paper more than apps
- Emergency label kits for physical folders and binders

### 29.2 Household Memory

- `things only mom knows` or `things only dad knows` prompts, with gentler copy later
- The weird trick to restart the hot water, garage, or internet
- `if the dog gets weird during storms` notes
- `what a babysitter always messes up here` prompts
- A `this would confuse your partner` detector

### 29.3 Recovery Coordination

- Post-incident photo checklist
- `who did we already call?` timeline shortcuts
- Vendor trust notes like `fast but expensive` or `do not use again`
- Repeat-issue memory for the same leak, outage, or appliance
- A `recovery still open after 30 days` nudge

---

## 30. Next Expansion Backlog

### EP-25 - Health And Medication Continuity

#### Story EP-2501 - Build household medical continuity cards

**As a household, I want emergency-ready medical continuity cards so critical care details are usable when someone is sick, injured, or helping under pressure.**

**Priority:** P1  
**Dependencies:** EP-801, EP-2201

##### Tasks

- [ ] Define medical continuity cards for adult, child, elder, and medically sensitive household members.
- [ ] Add structured fields for medications, allergies, pharmacies, doctors, insurance details, and urgent care preferences.
- [ ] Add sensitivity and audience rules for health details shared with helpers, family, or emergency responders.
- [ ] Add links from medical cards to care plans, emergency contacts, and paper-document readiness.
- [ ] Add missing-data prompts for households with medication or allergy risk but incomplete health details.

##### Acceptance Criteria

- [ ] A household can prepare a focused medical continuity view without turning HomeVault into a full medical-record system.
- [ ] Critical health details are easier to find and hand off under stress.
- [ ] Sharing rules stay privacy-aware and role-appropriate.

#### Story EP-2502 - Add prescription and refill resilience prompts

**As a user, I want HomeVault to flag medication continuity risks so short disruptions do not immediately create a health emergency.**

**Priority:** P2  
**Dependencies:** EP-2501, EP-1602

##### Tasks

- [ ] Add lightweight medication continuity prompts for refill timing, pharmacy dependency, travel supply, and backup pickup helpers.
- [ ] Add warnings when one person manages all prescription knowledge or pickup logistics.
- [ ] Add scenario prompts for storm prep, travel, hospitalization, and caregiver handoff.
- [ ] Add readiness checks for medication storage notes, pediatric dosing references, or pet-med routines where relevant.
- [ ] Add review nudges for stale or low-confidence health continuity details.

##### Acceptance Criteria

- [ ] The app can highlight likely medication continuity weak spots without demanding clinical-level tracking.
- [ ] Households get practical prompts for common disruption windows.
- [ ] Health continuity remains grounded in preparedness, not wellness-product sprawl.

### EP-26 - Communications Fallback And Contact Reachability

#### Story EP-2601 - Add communications fallback planning

**As a household, I want backup communication paths documented so we can still coordinate when phones, internet, or one person's device fails.**

**Priority:** P1  
**Dependencies:** EP-1301, EP-1701

##### Tasks

- [ ] Define fallback communication records for alternate phone numbers, messaging preferences, meeting points, neighbor relays, and out-of-area contacts.
- [ ] Add simple reachability labels such as `text first`, `call only`, `night shift`, or `landline available`.
- [ ] Add prompts for how the household reconnects during power, cell, or broadband disruption.
- [ ] Add links between communications fallback and incident playbooks, packets, and helper views.
- [ ] Add missing-data warnings when key contacts exist but the household lacks a realistic fallback path.

##### Acceptance Criteria

- [ ] A household can describe how members and helpers reconnect during a communications failure.
- [ ] Contact planning extends beyond raw phone numbers into usable reachability guidance.
- [ ] The feature remains simple enough for non-technical families.

#### Story EP-2602 - Add alert and broadcast-ready contact modes

**As a user, I want HomeVault to help me contact the right people quickly during a disruption without manually piecing together who needs what information.**

**Priority:** P2  
**Dependencies:** EP-2601, EP-1002

##### Tasks

- [ ] Add audience groups such as household core, nearby helpers, school/care contacts, and provider escalation.
- [ ] Add prewritten communication templates for outage, delay, hospitalization, evacuation, and pet-care needs.
- [ ] Add quick-share outputs that include only the minimum relevant context for each audience.
- [ ] Add guidance for when to switch from digital outreach to printed information or in-person relay.
- [ ] Add review prompts for stale contact trees or untested communication assumptions.

##### Acceptance Criteria

- [ ] Users can identify who should be contacted first for common disruptions.
- [ ] Contact modes reduce coordination friction without becoming a messaging platform.
- [ ] Shared context remains minimal, role-appropriate, and privacy-aware.

### EP-27 - Physical Readiness Kits And High-Trust Packaging

#### Story EP-2701 - Build physical emergency binder and drawer kits

**As a household, I want HomeVault to generate physical-ready kits so emergency readiness still works when devices are dead, absent, or too stressful to use.**

**Priority:** P1  
**Dependencies:** EP-2201, EP-701

##### Tasks

- [ ] Define physical kit formats such as emergency binder, grab-and-go folder, glovebox card set, and home command drawer insert.
- [ ] Add print layouts optimized for calm readability, redaction control, and fast retrieval.
- [ ] Add guidance for what belongs physically, digitally, or in both places.
- [ ] Add kit review prompts tied to stale records, changed contacts, and seasonal preparedness.
- [ ] Add audience variants for spouse, teen driver, pet sitter, and house helper.

##### Acceptance Criteria

- [ ] A household can generate a physical emergency kit that feels genuinely usable.
- [ ] Physical outputs stay aligned with HomeVault's privacy model and update cadence.
- [ ] The product creates confidence for families that trust paper more than apps.

#### Story EP-2702 - Add readiness packaging and placement guidance

**As a user, I want help deciding where emergency materials should live so the plan is not technically complete but practically unreachable.**

**Priority:** P2  
**Dependencies:** EP-2701

##### Tasks

- [ ] Add placement guidance for home office, kitchen, car, safe, lockbox, and travel bag contexts.
- [ ] Add prompts for visibility vs. privacy tradeoffs for printed materials.
- [ ] Add household-specific reminders for replacing stale pages, expired cards, or old helper kits.
- [ ] Add `can someone actually find this?` review prompts during drills and annual review.
- [ ] Add packaging recommendations that keep the experience premium-looking without becoming decorative fluff.

##### Acceptance Criteria

- [ ] Households get concrete recommendations for where readiness materials should live.
- [ ] The app can expose when a packet exists but is practically inaccessible.
- [ ] Physical-readiness planning deepens trust instead of adding unnecessary complexity.

---

## 31. More Brainstorm Threads

### 31.1 Health Continuity Sparks

- `who can pick up the prescription if I'm down` prompts
- Pediatric fever / urgent-care cheat sheets linked to real contacts
- Pet medication continuity when the primary caregiver is unavailable
- `hospital bag plus home continuity` prep mode
- A `we rely on one pharmacy` fragility warning

### 31.2 Communications Sparks

- `if cell service is jammed, then what` walkthroughs
- Family meeting-point defaults
- An `out-of-area contact` concept for broader disruptions
- School/daycare contact tree confidence
- `who would not know what happened` insight prompts

### 31.3 Physical Packaging Sparks

- Glovebox emergency mini-packets
- Wallet-sized helper cards
- Magnet/fridge emergency summaries
- Waterproof packet variants for storm zones
- `print the calm version` mode for the least technical family member

---

## 32. Broader Continuity Backlog

### EP-28 - Household Admin And Routine Continuity

#### Story EP-2801 - Map recurring household obligations

**As a household, I want the recurring obligations that keep life moving to be visible so one person's absence does not quietly cause cascading problems.**

**Priority:** P1  
**Dependencies:** EP-1001, EP-1201

##### Tasks

- [ ] Define a lightweight recurring-obligations model for bills, trash/recycling, school forms, pet care routines, subscription renewals, and service windows.
- [ ] Add ownership, backup-owner, and `what happens if missed` fields for recurring obligations.
- [ ] Add prompts for obligations that are known informally but not documented anywhere.
- [ ] Add incident and incapacitation links for obligations that matter most during disruption windows.
- [ ] Add review prompts when a recurring obligation has no clear backup or instructions.

##### Acceptance Criteria

- [ ] A household can see which recurring obligations are fragile or single-owner dependent.
- [ ] The app helps convert invisible routine work into continuity-safe knowledge.
- [ ] Recurring-obligation planning stays lightweight instead of turning into a full task manager.

#### Story EP-2802 - Add mail, package, and delivery continuity

**As a user, I want HomeVault to preserve mail and delivery know-how so important items do not get lost when household routines break down.**

**Priority:** P2  
**Dependencies:** EP-2301, EP-2801

##### Tasks

- [ ] Add structured notes for mailbox access, package locations, signature-sensitive deliveries, and vacation holds.
- [ ] Add prompts for medication deliveries, school mail, legal notices, and replacement-card deliveries.
- [ ] Add helper-safe guidance for collecting, forwarding, or pausing deliveries during disruption.
- [ ] Add links between delivery continuity and travel, hospitalization, or storm scenarios.
- [ ] Add review prompts for households with critical deliveries but no backup handling plan.

##### Acceptance Criteria

- [ ] A household can document the delivery habits that matter during disruptions.
- [ ] Helper-facing delivery instructions are clear without oversharing unrelated information.
- [ ] The feature feels operationally useful rather than trivial.

### EP-29 - School, Childcare, And Workday Disruption Coordination

#### Story EP-2901 - Add school and childcare disruption plans

**As a parent or caregiver, I want HomeVault to help with school and childcare disruptions so pickup, closures, and emergency changes do not become chaotic.**

**Priority:** P1  
**Dependencies:** EP-801, EP-1701

##### Tasks

- [ ] Define disruption plans for school closure, missed pickup, alternate pickup, daycare contact, and after-school activity interruption.
- [ ] Add structured fields for pickup permissions, teacher/front-office contacts, bus notes, and emergency contacts.
- [ ] Add helper-safe handoff outputs for grandparents, neighbors, and backup caregivers.
- [ ] Add prompts for what must be updated each school year or term.
- [ ] Add incident-specific quick actions from Emergency and calm-mode surfaces.

##### Acceptance Criteria

- [ ] A caregiver can find the right contacts and pickup rules quickly during a school-day disruption.
- [ ] The app helps families avoid relying on memory for school logistics.
- [ ] School coordination remains scoped to continuity rather than becoming a parent portal.

#### Story EP-2902 - Build workday absence and coverage continuity

**As a household, I want HomeVault to account for workday disruptions so we can coordinate childcare, transportation, and urgent household duties when one adult is suddenly unavailable.**

**Priority:** P2  
**Dependencies:** EP-1001, EP-1401

##### Tasks

- [ ] Add continuity prompts for commute responsibilities, school pickup windows, pet-care midday tasks, and key daytime availability constraints.
- [ ] Add `who can leave work`, `who can cover`, and `what needs advance notice` guidance where relevant.
- [ ] Add quick-share summaries for spouse/partner or backup helper coordination.
- [ ] Add scenario hooks for hospitalization, car trouble, storm closure, and lost-phone events.
- [ ] Add review prompts for households whose daytime logistics depend on one person only.

##### Acceptance Criteria

- [ ] Households can see where daytime life depends too heavily on one adult's availability.
- [ ] Coverage guidance becomes usable under pressure without requiring full schedule management.
- [ ] The experience stays grounded in household continuity rather than workplace tooling.

### EP-30 - Authority, Permission, And Boundary Planning

#### Story EP-3001 - Track helper authority and decision boundaries

**As a household, I want to define what helpers are actually allowed to do so support can happen faster without creating confusion or overreach.**

**Priority:** P1  
**Dependencies:** EP-202, EP-802

##### Tasks

- [ ] Define authority notes for pickups, pet care, home entry, repair approvals, school contact, and medical-support boundaries.
- [ ] Add audience-specific `allowed`, `ask first`, and `not allowed` states for common helper actions.
- [ ] Add links from authority rules into caregiver plans, helper views, packets, and calm-mode guidance.
- [ ] Add missing-data prompts when the household expects help but has not defined boundaries.
- [ ] Add copy that keeps the feature practical and non-legalistic.

##### Acceptance Criteria

- [ ] Helpers can tell what they may do versus when they must escalate.
- [ ] Households reduce ambiguity without turning HomeVault into a legal authorization system.
- [ ] Boundary rules improve real-world handoffs and drills.

#### Story EP-3002 - Add exception handling for edge-case helpers

**As a user, I want HomeVault to capture unusual helper scenarios so the plan still works when a neighbor, contractor, adult child, or temporary caregiver steps in unexpectedly.**

**Priority:** P2  
**Dependencies:** EP-3001, EP-1701

##### Tasks

- [ ] Add focused helper patterns for neighbor check-ins, one-time contractor access, adult-child support, and temporary pet or childcare help.
- [ ] Add time-boxed guidance and redaction defaults for unusual helper types.
- [ ] Add prompts for what context should be shared verbally, digitally, physically, or not at all.
- [ ] Add post-event cleanup prompts for helper access, printed materials, and old assumptions.
- [ ] Add review prompts after real incidents or drills involving ad hoc helpers.

##### Acceptance Criteria

- [ ] Households can prepare for unusual helper scenarios without inventing a custom plan from scratch.
- [ ] Exception-handling flows keep data exposure narrow and intentional.
- [ ] The product better matches the messy way real households get help.

---

## 33. Additional Brainstorm Fuel

### 33.1 Admin And Routine Sparks

- `what stops getting done if I disappear this week`
- A `hidden labor` continuity view for one-person household knowledge
- School form renewal and seasonal paperwork prompts
- Trash day, recycling, and city-service continuity because chaos loves small misses
- `who notices the mail piling up` prompts

### 33.2 Daytime Logistics Sparks

- `who can leave work first` reality checks
- School-closure and weather-delay cheat sheets
- `kid is sick at noon` response planning
- Backup ride and pickup chains
- `phone died during pickup window` rescue flow

### 33.3 Helper Boundary Sparks

- `what the babysitter can decide without texting you`
- `what the contractor should never see`
- `what a neighbor can do in a storm`
- One-time access versus ongoing trust clarity
- `what needs verbal context, not just a packet`

---

## 34. Deeper Continuity Backlog

### EP-31 - Multigenerational And Aging-Parent Continuity

#### Story EP-3101 - Add aging-parent support plans

**As an adult child or caregiver, I want HomeVault to support aging-parent continuity so I can help responsibly without needing full shared household access.**

**Priority:** P1  
**Dependencies:** EP-202, EP-801, EP-1401

##### Tasks

- [ ] Define continuity plans for older adults living independently, with family, or in assisted settings.
- [ ] Add structured fields for key contacts, pharmacy/provider coordination, home-access notes, transportation help, and routine check-ins.
- [ ] Add audience-specific exports for adult child, sibling helper, neighbor check-in, and visiting caregiver.
- [ ] Add prompts for what must be confirmed regularly such as meds, appointments, mobility needs, and backup contacts.
- [ ] Add copy and boundaries that keep the feature practical without implying medical guardianship or legal authority.

##### Acceptance Criteria

- [ ] Families can prepare focused aging-parent continuity plans without exposing unrelated household records.
- [ ] The product supports respectful, privacy-aware caregiving handoffs.
- [ ] Older-adult readiness can be reviewed and improved over time.

#### Story EP-3102 - Add remote support and check-in continuity

**As a distributed family, I want HomeVault to help with remote support so distance does not turn every disruption into confusion.**

**Priority:** P2  
**Dependencies:** EP-3101, EP-2601

##### Tasks

- [ ] Add remote-support patterns for routine check-ins, missed contact escalation, and local-helper backup.
- [ ] Add `who is nearby`, `who can call`, and `who can physically check in` guidance for distributed families.
- [ ] Add light-weight reachability and visit-frequency prompts for older adults or dependents who live elsewhere.
- [ ] Add handoff outputs for local neighbors, nearby relatives, or paid caregivers when distance matters.
- [ ] Add review prompts when the continuity plan relies on one distant person only.

##### Acceptance Criteria

- [ ] Families can see whether remote support plans are realistic.
- [ ] The app helps convert long-distance concern into concrete backup structure.
- [ ] Remote-support planning remains local-first and scope-limited.

### EP-32 - Utility, Climate, And Home Survival Disruption Depth

#### Story EP-3201 - Add deeper utility failure playbooks

**As a homeowner, I want richer utility-failure guidance so outages involving power, water, heat, or cooling do not become guesswork.**

**Priority:** P1  
**Dependencies:** EP-1601, EP-1702

##### Tasks

- [ ] Add playbooks for prolonged power outage, water outage, boil order, heating failure, AC failure, sewer backup, and freezer loss risk.
- [ ] Link each playbook to relevant shutoff notes, providers, supplies, dependent needs, and physical kits.
- [ ] Add decision thresholds such as `stay put`, `call provider`, `move food`, `check on elder`, or `leave the house`.
- [ ] Add missing-data prompts for homes with obvious vulnerability but weak preparation.
- [ ] Add review nudges after seasonal transitions or real incidents.

##### Acceptance Criteria

- [ ] Households can respond more confidently to the most common home-system failures.
- [ ] Utility-disruption guidance reuses the broader continuity model instead of creating isolated checklists.
- [ ] The experience stays practical for ordinary households, not extreme-prepper niche users.

#### Story EP-3202 - Add climate and region-specific readiness overlays

**As a household, I want Emergency Plan to adapt to where we live so readiness feels relevant to our actual risks.**

**Priority:** P2  
**Dependencies:** EP-1101, EP-3201

##### Tasks

- [ ] Add optional region-aware overlays for hurricane, winter freeze, wildfire smoke, heat wave, tornado, and flood-prone households.
- [ ] Map overlays to records, supplies, kits, and home-system checks already tracked in HomeVault.
- [ ] Add seasonal readiness prompts that feel local instead of generic.
- [ ] Add guidance for renters versus homeowners where responsibilities differ.
- [ ] Add low-drama copy that avoids sounding like a disaster-prepper product.

##### Acceptance Criteria

- [ ] Households can opt into risk overlays that match where they live.
- [ ] Regional readiness reuses existing HomeVault data and prompts efficiently.
- [ ] The product feels more personally relevant without requiring external hazard intelligence.

### EP-33 - Household Baseline Evidence And Faster Recovery

#### Story EP-3301 - Build pre-incident home baseline capture

**As a homeowner or renter, I want HomeVault to preserve a baseline view of my household so claims, replacements, and recovery start from something better than memory.**

**Priority:** P1  
**Dependencies:** EP-901, EP-2202

##### Tasks

- [ ] Define baseline evidence capture for rooms, major belongings, serials, warranty context, and critical upgrades.
- [ ] Add prompts for photo/video sweeps that are useful for claims without becoming exhaustive inventory work.
- [ ] Add links between baseline evidence and insurance, documents, provider records, and incident workspaces.
- [ ] Add freshness prompts for homes that have changed materially since the last baseline.
- [ ] Add privacy-aware export summaries for claim start or landlord dispute scenarios.

##### Acceptance Criteria

- [ ] Users can create a practical pre-incident baseline without cataloging every object they own.
- [ ] Baseline evidence materially improves first-day recovery and claim prep.
- [ ] The feature stays purpose-built for continuity rather than general home inventory.

#### Story EP-3302 - Add recovery acceleration workflows

**As a user, I want HomeVault to help me restart household function quickly after damage or disruption so recovery momentum does not stall.**

**Priority:** P2  
**Dependencies:** EP-3301, EP-902

##### Tasks

- [ ] Add `first 24 hours`, `first week`, and `back to normal` recovery tracks for common incidents.
- [ ] Add restart prompts for internet, refrigeration, school routines, work setup, and pet/medication continuity.
- [ ] Add recommendations for which packet, kit, provider, and evidence bundle to use next.
- [ ] Add post-incident prompts that convert real disruption lessons into updated readiness tasks.
- [ ] Add recovery summaries that help a partner or helper take over midstream.

##### Acceptance Criteria

- [ ] Users can move from incident capture into recovery execution with less context switching.
- [ ] Recovery workflows reinforce continuity, not just documentation.
- [ ] The app helps households regain normal function faster.

---

## 35. More Idea Sparks

### 35.1 Multigenerational And Care Circles

- A `care circle` model for siblings, neighbors, and paid helpers around one older adult
- `who would notice first if something was wrong` prompts
- Light-touch continuity plans for older adults who resist apps
- `parent across town` versus `parent across the country` support templates
- A `solo older adult` fragility view

### 35.2 Climate And Utilities

- `how long can this house tolerate no power` confidence prompts
- Heat-wave survival basics for families with pets, elders, or infants
- `our freezer is a hidden dependency` insight nudges
- Renter-safe outage plans when you cannot touch the systems yourself
- Smoke, air quality, and indoor refuge planning without becoming an air-quality app

### 35.3 Baselines And Recovery Momentum

- Annual room sweep reminders for claim-ready evidence
- `what changed since your last home baseline` prompts
- Before/after incident evidence compare views
- A `restart the house` checklist after outage, move, or repair work
- `you already solved this once` resurfacing for repeat disruptions

---

## 36. Additional Household Types Backlog

### EP-34 - Renter, Apartment, And Building Continuity

#### Story EP-3401 - Add renter and apartment emergency profiles

**As a renter or apartment resident, I want Emergency Plan to reflect the systems I actually control and the ones I do not so my readiness advice fits real building life.**

**Priority:** P1  
**Dependencies:** EP-1801, EP-3201

##### Tasks

- [ ] Define renter/apartment profiles for landlord-managed systems, building access, package rooms, maintenance contact paths, and insurance responsibilities.
- [ ] Add structured records for building manager, landlord, front desk, HOA, super, and after-hours maintenance escalation.
- [ ] Add prompts that distinguish `my responsibility` from `building responsibility`.
- [ ] Add building-specific notes for elevators, access fobs, garage access, mailrooms, and amenity/utility shutoff constraints.
- [ ] Add renter-safe playbook links for lockout, leak, outage, and evacuation scenarios.

##### Acceptance Criteria

- [ ] Renter households get emergency guidance that fits apartment and building realities.
- [ ] The app avoids assuming every household owns or controls the property systems involved.
- [ ] Building-context records are easy to use during a disruption.

#### Story EP-3402 - Add landlord and building coordination flows

**As a renter, I want HomeVault to help me coordinate with building contacts during a disruption so I can move faster without scrambling for the right details.**

**Priority:** P2  
**Dependencies:** EP-3401, EP-2401

##### Tasks

- [ ] Add incident coordination patterns for leak reporting, access requests, utility notifications, and repair follow-up with landlords or building staff.
- [ ] Add export/share summaries for building issues that include the minimum relevant context and evidence.
- [ ] Add guidance for documenting maintenance promises, access windows, and repeat unresolved issues.
- [ ] Add prompts for renters insurance, building rules, and temporary relocation dependencies where relevant.
- [ ] Add review prompts after move-in, lease renewal, or major building changes.

##### Acceptance Criteria

- [ ] Renters can coordinate building-related incidents with less confusion.
- [ ] Building coordination reuses incident evidence and provider continuity effectively.
- [ ] The product stays household-focused rather than becoming property-management software.

### EP-35 - Solo Household And Single-Point-of-Failure Readiness

#### Story EP-3501 - Add solo-household fragility planning

**As a person living alone, I want HomeVault to help me plan for the absence of an immediate in-home backup so emergencies do not assume another adult is available.**

**Priority:** P1  
**Dependencies:** EP-1401, EP-1701

##### Tasks

- [ ] Define solo-household continuity prompts for check-ins, key access, pet care, transportation backup, and emergency contact reachability.
- [ ] Add `who notices if I do not respond` and `who can physically help` planning prompts.
- [ ] Add guidance for minimal trusted-helper kits tailored to solo households.
- [ ] Add fragility indicators when essential routines, meds, pets, or access depend on one unavailable person.
- [ ] Add calm, dignity-preserving copy that supports solo living without sounding alarmist.

##### Acceptance Criteria

- [ ] Solo households can build continuity plans that do not assume cohabitants.
- [ ] The app can highlight the most important missing backup structures for people living alone.
- [ ] The experience feels empowering rather than fear-based.

#### Story EP-3502 - Add missed-check-in and welfare-escalation planning

**As a solo user or remote family member, I want a clear missed-check-in plan so concern can turn into action without guesswork.**

**Priority:** P2  
**Dependencies:** EP-3501, EP-3102

##### Tasks

- [ ] Add structured escalation plans for missed texts/calls, failed check-ins, and inability to reach someone.
- [ ] Define roles for nearby contact, out-of-area contact, neighbor, building staff, and emergency escalation.
- [ ] Add time-window guidance that is specific enough to be useful but flexible enough for real life.
- [ ] Add local-only handoff summaries for trusted contacts who may need to intervene.
- [ ] Add review prompts for stale reachability assumptions or outdated nearby-helper coverage.

##### Acceptance Criteria

- [ ] Users can define a realistic missed-check-in plan without creating surveillance vibes.
- [ ] Escalation guidance is practical and privacy-aware.
- [ ] Remote supporters can understand what to do next when contact fails.

### EP-36 - Pet And Animal Continuity Depth

#### Story EP-3601 - Add pet care emergency operations

**As a pet owner, I want HomeVault to help with pet continuity in real disruptions so animals are not treated as an afterthought during household emergencies.**

**Priority:** P1  
**Dependencies:** EP-801, EP-2502

##### Tasks

- [ ] Expand pet continuity records for feeding, meds, behavior triggers, carriers, leashes, safe rooms, boarding options, and vet/emergency-vet contacts.
- [ ] Add incident hooks for evacuation, hospitalization, power outage, travel delay, and lost-primary-caregiver scenarios.
- [ ] Add pet-specific helper handoff cards for neighbor, sitter, family member, or emergency backup.
- [ ] Add missing-data prompts for households with pets but no carrier, no medication instructions, or no backup caregiver.
- [ ] Add review prompts for aging pets, changed meds, and seasonal care risks.

##### Acceptance Criteria

- [ ] Pet-owning households can prepare a truly usable emergency pet plan.
- [ ] Pet continuity is integrated into broader household incidents instead of isolated as a niche module.
- [ ] Helpers can care for animals more safely with less guesswork.

#### Story EP-3602 - Add lost-pet and displacement continuity

**As a household, I want HomeVault to help when a pet is lost or the household is displaced so we can act quickly with the right information.**

**Priority:** P2  
**Dependencies:** EP-3601, EP-2102

##### Tasks

- [ ] Add displaced-pet and lost-pet response playbooks tied to travel, storms, evacuations, and open-door incidents.
- [ ] Add structured fields for microchip, tags, photos, meds, behavior warnings, and boarding/foster options.
- [ ] Add quick-share outputs for pet finder, neighbor helper, sitter, or emergency foster contexts.
- [ ] Add prompts for pet-ready travel kits and temporary-stay pet needs.
- [ ] Add review nudges after a real pet incident to improve future readiness.

##### Acceptance Criteria

- [ ] Households can respond faster when a pet is displaced, lost, or temporarily rehomed during a disruption.
- [ ] Pet-response outputs are narrow, practical, and easy to share.
- [ ] The product treats pets as real continuity dependencies, not decorative extras.

---

## 37. More Brainstorm Threads

### 37.1 Renter And Building Sparks

- Apartment lockout kits and front-desk escalation notes
- `what if the building shuts off the water` prompts
- Shared laundry, mailroom, and package access continuity
- `who actually has the spare fob` reality checks
- Short-term lease and sublet continuity edge cases

### 37.2 Solo-Living Sparks

- `who would know if I missed work tomorrow`
- A `living alone confidence` view
- Minimalist solo-household emergency kits
- A `three people who could help me tonight` prompt
- Dignified check-in planning that does not feel like surveillance

### 37.3 Pet Continuity Sparks

- Evacuation crate readiness
- `can anyone else medicate this pet` warnings
- Multi-pet chaos planning
- Emergency boarding shortlist
- `what does the dog do during thunderstorms` continuity prompts

---

## 38. Shared-Living And Access Backlog

### EP-37 - Roommate And Co-Living Continuity

#### Story EP-3701 - Add roommate-safe continuity plans

**As a household that shares space without sharing everything, I want HomeVault to support roommate and co-living continuity so emergencies can be handled without collapsing privacy boundaries.**

**Priority:** P1  
**Dependencies:** EP-202, EP-3001

##### Tasks

- [ ] Define roommate/co-living household patterns for shared utilities, package handling, key access, guest rules, and emergency contacts.
- [ ] Add scoped ownership and visibility rules for shared vs. private responsibilities.
- [ ] Add audience-safe handoff outputs for roommate, housemate, subletter, or temporary replacement tenant.
- [ ] Add prompts for what every resident should know versus what only one resident should see.
- [ ] Add disruption playbook links for lockout, missed rent-sensitive issues, utilities, and building access problems.

##### Acceptance Criteria

- [ ] Shared-living households can prepare continuity plans without flattening everyone into one fully shared household.
- [ ] The app can separate shared operations from private records clearly.
- [ ] Co-living guidance feels realistic for modern household arrangements.

#### Story EP-3702 - Add household changeover and handoff cleanup

**As a user, I want HomeVault to help when a roommate or co-resident changes so old assumptions and access do not linger after the household shifts.**

**Priority:** P2  
**Dependencies:** EP-3701, EP-1802

##### Tasks

- [ ] Add changeover flows for move-out, sublet, breakup, new roommate arrival, and temporary guest-to-resident transitions.
- [ ] Add prompts for access cleanup, packet refreshes, utility ownership changes, and provider-contact updates.
- [ ] Add review steps for printed materials, helper kits, building access, and old emergency assumptions.
- [ ] Add shared-duty reset prompts for mail, pets, trash, shared bills, and package handling.
- [ ] Add archive guidance for retired household arrangements that should not remain active.

##### Acceptance Criteria

- [ ] HomeVault can help households reset continuity after membership changes.
- [ ] Old access and stale assumptions become visible and actionable.
- [ ] Changeover planning reduces awkward but important operational gaps.

### EP-38 - Guest, Host, And Temporary Stay Continuity

#### Story EP-3801 - Add guest-host emergency kits

**As a host or temporary guest, I want focused continuity guidance so short stays do not become confusing when something goes wrong in an unfamiliar place.**

**Priority:** P2  
**Dependencies:** EP-202, EP-2102

##### Tasks

- [ ] Define guest-host kits for relatives staying over, short-term home guests, college breaks, and temporary caregivers sleeping at the home.
- [ ] Add structured fields for Wi-Fi, alarm boundaries, bathroom/shower quirks, entry/exit rules, parking, and emergency contacts.
- [ ] Add host-safe redaction defaults so guests get what they need without seeing unrelated household details.
- [ ] Add temporary expiry behavior and cleanup prompts after the stay ends.
- [ ] Add `what a guest should do if...` quick actions for lockout, alarm trigger, water leak, power outage, or pet escape.

##### Acceptance Criteria

- [ ] A host can create a narrow, practical emergency kit for a temporary guest.
- [ ] Guest continuity feels safer and less awkward than texting ad hoc instructions.
- [ ] Temporary-stay kits remain clearly separate from full household handoffs.

#### Story EP-3802 - Add college and away-from-home return packs

**As a family with young adults moving between homes, I want HomeVault to support transitional stays so continuity still works across campus, family home, and temporary living situations.**

**Priority:** P2  
**Dependencies:** EP-2001, EP-2102

##### Tasks

- [ ] Add return-home and away-at-school continuity packs for move-in, move-out, semester breaks, and temporary housing.
- [ ] Add fields for campus contacts, dorm/building access, local urgent-care context, transportation fallback, and family helper contacts.
- [ ] Add audience-specific outputs for student, parent, roommate, or visiting family member.
- [ ] Add prompts for what changes each term or move cycle.
- [ ] Add transition nudges when school, lease, or summer arrangements shift.

##### Acceptance Criteria

- [ ] Families can support continuity for young adults moving between living contexts.
- [ ] The product reflects temporary and hybrid living arrangements cleanly.
- [ ] Transition packs stay operational rather than turning into student-life management.

### EP-39 - Offsite Access, Storage, And Hidden-Location Continuity

#### Story EP-3901 - Add offsite-document and key-location planning

**As a household, I want HomeVault to track where critical physical access and backup materials live so the plan is not blocked by one missing key, folder, or box.**

**Priority:** P1  
**Dependencies:** EP-2201, EP-2702

##### Tasks

- [ ] Define structured records for lockboxes, safes, storage units, safe-deposit boxes, trusted-neighbor key holds, and offsite document locations.
- [ ] Add guidance for `exists`, `reachable`, `who knows`, and `who can access` states.
- [ ] Add links from locations to packets, paper readiness, helper authority, and incident playbooks.
- [ ] Add prompts for hidden fragility such as one key holder, one remembered code, or unreachable business-hour access.
- [ ] Add audience-safe exports that explain where to go and what to retrieve without oversharing everything else.

##### Acceptance Criteria

- [ ] Households can tell whether crucial physical backups are truly reachable during a disruption.
- [ ] The app surfaces access fragility around keys, boxes, folders, and offsite storage.
- [ ] Physical-location planning stays practical and security-aware.

#### Story EP-3902 - Add retrieval and business-hours disruption planning

**As a user, I want HomeVault to help when important materials are available only through limited access windows so emergencies do not stall on logistics.**

**Priority:** P2  
**Dependencies:** EP-3901, EP-2601

##### Tasks

- [ ] Add prompts for business-hour access constraints, ID requirements, travel time, and backup retrieval options.
- [ ] Add disruption scenarios for bank closure, storage-unit lockout, office closure, and after-hours access failure.
- [ ] Add fallback guidance for what to do when an expected physical backup cannot be reached.
- [ ] Add review nudges for households relying on inaccessible or stale offsite arrangements.
- [ ] Add recovery summaries for helpers retrieving materials on someone else's behalf.

##### Acceptance Criteria

- [ ] Users can spot when a backup plan fails because the backup itself is inaccessible.
- [ ] Retrieval planning exposes realistic time and access constraints.
- [ ] The feature improves continuity without encouraging risky oversharing of secrets.

---

## 39. More Brainstorm Threads

### 39.1 Shared-Living Sparks

- `what every roommate should know tonight`
- Shared-house outage roles
- `who actually pays this utility` reality checks
- Sublet emergency kits
- Breakup/move-out continuity cleanup with dignity

### 39.2 Guest And Temporary-Stay Sparks

- `staying with grandparents this weekend` rescue pack
- Guest-safe alarm and lock instructions
- Spare-bedroom continuity kits
- `what a visitor does if the dog gets out`
- Hosting-while-renovating edge cases

### 39.3 Offsite Access Sparks

- `the key exists but nobody can get to it` fragility warnings
- Business-hours-only backup frustration checks
- Trusted neighbor envelope kits
- A `where is the paper backup really` confidence prompt
- Storage-unit and safe-deposit-box continuity realities

---

## 40. Late-Stage Continuity Backlog

### EP-40 - Death, Memorial, And Immediate Aftermath Continuity

#### Story EP-4001 - Add immediate-loss household operations planning

**As a household, I want HomeVault to help with the first operational days after a death so basic life coordination does not collapse under grief and confusion.**

**Priority:** P1  
**Dependencies:** EP-1402, EP-2801

##### Tasks

- [ ] Define an `immediate aftermath` continuity plan focused on household operations, not legal estate administration.
- [ ] Add prompts for urgent contacts, caregiving continuity, pet care, mail handling, bill awareness, and who can step into daily operations.
- [ ] Add audience-specific handoff views for spouse/partner, adult child, nearby helper, and trusted friend.
- [ ] Add guidance for what household information should be surfaced first versus what can wait.
- [ ] Add respectful copy and boundaries that keep the feature practical, supportive, and clearly non-legal.

##### Acceptance Criteria

- [ ] Households can prepare a humane operational continuity plan for the first days after a death.
- [ ] The product distinguishes household continuity from wills, probate, and legal advice.
- [ ] Helpers can find the most important next actions without being overwhelmed.

#### Story EP-4002 - Add memorial and notification support planning

**As a family, I want lightweight notification and ceremony support so important people, places, and obligations are not forgotten during an overwhelming transition.**

**Priority:** P2  
**Dependencies:** EP-4001, EP-2602

##### Tasks

- [ ] Add structured prompts for notification groups such as family, close friends, school/work contacts, service providers, and community contacts.
- [ ] Add guidance for what information may be shared broadly versus what should stay private.
- [ ] Add continuity prompts for short-term logistics like childcare, pet support, meal trains, guest arrivals, and home access.
- [ ] Add optional memorial-preference notes with clear limits on scope.
- [ ] Add cleanup prompts for temporary helpers, temporary kits, and one-time household coordination roles.

##### Acceptance Criteria

- [ ] Families can organize the first layer of outreach and support more calmly.
- [ ] Notification planning stays privacy-aware and non-performative.
- [ ] The feature helps real household coordination without becoming a memorial platform.

### EP-41 - Home Restart And Major Appliance Recovery

#### Story EP-4101 - Add home restart playbooks

**As a household, I want HomeVault to guide restarting the house after disruption so power returns, repairs, or reentry do not depend on one person's memory.**

**Priority:** P1  
**Dependencies:** EP-1601, EP-3302

##### Tasks

- [ ] Add `restart the house` playbooks for post-outage, post-evacuation, post-repair, and move-back-in scenarios.
- [ ] Add step sets for internet, fridge/freezer, HVAC, security systems, smart-home devices, water use, and key comfort/safety checks.
- [ ] Add room/system sequencing guidance so households know what to check first.
- [ ] Add links to providers, appliance notes, warranties, and prior incident workspaces.
- [ ] Add prompts for what should be tested, discarded, reset, or re-reviewed after the home comes back online.

##### Acceptance Criteria

- [ ] Households can restart core home function with less guesswork after a disruption.
- [ ] Restart guidance reuses existing HomeVault records and incidents coherently.
- [ ] The feature feels concrete and calming in a messy recovery moment.

#### Story EP-4102 - Add major-appliance and food-loss continuity

**As a homeowner or renter, I want help with appliance failure and food-loss response so a smaller household disruption does not spiral into wasted money and chaos.**

**Priority:** P2  
**Dependencies:** EP-4101, EP-1602

##### Tasks

- [ ] Add playbooks for fridge failure, freezer thaw risk, water-heater failure, washer leak, and HVAC outage.
- [ ] Add decision prompts for save/discard, temporary workaround, urgent repair, and claim/evidence capture.
- [ ] Add structured links to provider profiles, manuals, warranties, serials, and replacement notes.
- [ ] Add pet/medication/infant-food continuity prompts where appliance failure has downstream risk.
- [ ] Add recovery reminders for cleanup, replacement, reimbursement, and restocking.

##### Acceptance Criteria

- [ ] Users can respond faster to common high-stress home failures.
- [ ] Appliance guidance bridges operations, providers, supplies, and evidence clearly.
- [ ] The feature helps ordinary households without becoming a full maintenance platform.

### EP-42 - Subscription, Service, And Account Housekeeping Continuity

#### Story EP-4201 - Add service and subscription dependency tracking

**As a household, I want HomeVault to show which subscriptions and recurring services quietly matter so disruptions do not reveal hidden dependencies too late.**

**Priority:** P2  
**Dependencies:** EP-1201, EP-2801

##### Tasks

- [ ] Define lightweight continuity records for subscriptions and recurring services that materially affect household life.
- [ ] Add categories for internet, cellular, utilities, security, streaming-for-kids, pet supplies, medication delivery, and home services where relevant.
- [ ] Add ownership, autopay awareness, cancellation friction, and backup-access prompts.
- [ ] Add warnings when an important service depends on one person, one email, or one payment path.
- [ ] Add links between service dependencies and incident, financial, and digital-recovery flows.

##### Acceptance Criteria

- [ ] Households can identify which recurring services truly matter during disruptions.
- [ ] Hidden dependency risk becomes visible without creating an expense-tracking product.
- [ ] The feature supports better continuity decisions around access and ownership.

#### Story EP-4202 - Add post-disruption cleanup and handback flows

**As a user, I want HomeVault to help clean up after temporary fixes and workarounds so the household does not stay in an improvised state forever.**

**Priority:** P2  
**Dependencies:** EP-4201, EP-902

##### Tasks

- [ ] Add cleanup flows for temporary helpers, temporary cards, rerouted deliveries, short-term services, replacement devices, and stopgap subscriptions.
- [ ] Add prompts for turning temporary fixes into permanent decisions or removing them cleanly.
- [ ] Add reminders for changed autopays, duplicated services, or emergency-only accounts created during a crisis.
- [ ] Add review prompts for stale workarounds after move, repair, recovery, or household transitions.
- [ ] Add summaries that help a spouse/partner understand what is still in a temporary state.

##### Acceptance Criteria

- [ ] Households can unwind crisis-era workarounds intentionally.
- [ ] The feature reduces lingering mess after incidents and transitions.
- [ ] Cleanup planning feels like a natural closeout step in HomeVault's continuity model.

---

## 41. More Brainstorm Sparks

### 41.1 Immediate Aftermath Sparks

- `what the first trusted friend should know tonight`
- Meal, guest, and pet support coordination after a death
- `who tells the school` and `who tells the vet` prompts
- Gentle continuity support for homes in grief
- `what can wait until next week` helpers

### 41.2 Home Restart Sparks

- Room-by-room restart sequences
- `power is back but the house is not normal yet` guidance
- Fridge/freezer loss confidence prompts
- Smart-home reconnect frustration reducers
- A `what should we test before sleeping here tonight` checklist

### 41.3 Cleanup And Handback Sparks

- `temporary fixes still live here` nudges
- Recovery-mode clutter cleanup
- Emergency-only accounts and services review
- `we solved it but left a mess behind` reports
- A `return to boring normal` milestone

---

## 42. Additional Continuity Depth

### EP-43 - Accessibility And Stress-Aware Continuity

#### Story EP-4301 - Add accessibility-aware emergency plans

**As a household with disability, mobility, sensory, cognitive, or language needs, I want Emergency Plan to account for those realities so the plan remains usable under actual stress.**

**Priority:** P1  
**Dependencies:** EP-801, EP-1502, EP-2501

##### Tasks

- [ ] Define accessibility-aware continuity profiles for mobility limits, sensory sensitivities, hearing/vision support, cognitive load, and communication preferences.
- [ ] Add structured fields for devices, accommodations, triggers, alternate communication methods, and helper guidance.
- [ ] Add audience-safe handoff outputs for caregivers, neighbors, teachers, transport helpers, and emergency contacts.
- [ ] Add prompts for what becomes harder during outage, evacuation, hospitalization, or overload scenarios.
- [ ] Add calm-mode variants that reduce complexity and respect accessibility needs during stressful incidents.

##### Acceptance Criteria

- [ ] Households can prepare continuity plans that reflect real accessibility and support needs.
- [ ] The product remains practical and respectful without pretending to be a medical or disability-services platform.
- [ ] Helpers can understand how to be useful without guessing.

#### Story EP-4302 - Add overload, panic, and low-bandwidth guidance

**As a stressed user or helper, I want simpler, lower-bandwidth guidance so I can still act when attention, energy, or communication breaks down.**

**Priority:** P2  
**Dependencies:** EP-4301, EP-1502

##### Tasks

- [ ] Add low-friction `just the next step` views for incidents where overwhelm is likely.
- [ ] Add optional shorter packet variants with fewer words and clearer action order.
- [ ] Add prompts for what should be visual, spoken, printed, or text-first depending on household needs.
- [ ] Add escalation guidance for when someone cannot process the full plan in the moment.
- [ ] Add review and drill prompts that test whether the simplified guidance is actually usable.

##### Acceptance Criteria

- [ ] HomeVault can present a usable subset of guidance when cognitive bandwidth is limited.
- [ ] Simplified outputs remain grounded in the same trusted records and rules.
- [ ] The feature makes the product more humane without reducing trust or clarity.

### EP-44 - Identity And Civic Recovery Continuity

#### Story EP-4401 - Add lost-ID and identity replacement recovery flows

**As a household, I want help replacing critical identity documents so a lost wallet, theft, or evacuation does not become a maze of forgotten steps.**

**Priority:** P1  
**Dependencies:** EP-2201, EP-2102

##### Tasks

- [ ] Add recovery flows for driver's license/state ID, passport, Social Security card, birth certificate, and insurance cards.
- [ ] Add structured fields for issuing authority, replacement prerequisites, supporting documents, appointment notes, and emergency contact needs.
- [ ] Add prompts for what copies exist, where originals live, and which replacement steps block others.
- [ ] Add guidance for identity-sensitive exports that share only what a helper truly needs.
- [ ] Add incident hooks for theft, lost wallet, travel disruption, fire, flood, and relocation.

##### Acceptance Criteria

- [ ] Users can understand the first practical steps for replacing critical identity documents.
- [ ] The app helps reveal missing prerequisites before a crisis.
- [ ] Identity recovery remains operational and privacy-aware rather than drifting into monitoring or credit products.

#### Story EP-4402 - Add government, benefits, and official-contact continuity

**As a user, I want HomeVault to preserve the official-contact paths that matter during disruption so public-facing logistics do not depend on memory.**

**Priority:** P2  
**Dependencies:** EP-4401, EP-2602

##### Tasks

- [ ] Add continuity records for DMV, passport office, school district, local utilities office, county records, benefits portals, and other official contacts where relevant.
- [ ] Add prompts for office-hour constraints, appointment friction, ID requirements, and helper eligibility.
- [ ] Add linked guidance for families dealing with address changes, replacement docs, benefits interruption, or dependent paperwork.
- [ ] Add audience-specific summaries for spouse/partner, adult child, or helper acting alongside the primary user.
- [ ] Add review nudges for stale office details and outdated assumptions after moves or policy changes.

##### Acceptance Criteria

- [ ] Households can find the right official contact path faster during disruptive admin moments.
- [ ] Government/official continuity remains household-focused, not bureaucratic sprawl.
- [ ] The app supports real recovery coordination without overreaching.

### EP-45 - Home Office And Workday Function Continuity

#### Story EP-4501 - Add remote-work and home-office continuity planning

**As a household, I want HomeVault to account for work-from-home and home-office fragility so income and daily function are less exposed to small household failures.**

**Priority:** P2  
**Dependencies:** EP-1301, EP-2902

##### Tasks

- [ ] Define lightweight home-office continuity records for internet dependency, backup workspace, critical peripherals, and workday communication fallback.
- [ ] Add prompts for which adult's workday is most fragile to internet, power, child-care, or device failure.
- [ ] Add links between remote-work continuity and outage, lost-device, and school-closure scenarios.
- [ ] Add helper-safe summaries that explain what daytime functions must keep running and who can adapt.
- [ ] Add review nudges for households whose income or coverage depends too heavily on one setup.

##### Acceptance Criteria

- [ ] Households can see how home disruptions threaten workday continuity.
- [ ] The feature helps real coordination without becoming workplace software.
- [ ] Workday continuity integrates naturally with broader household planning.

#### Story EP-4502 - Add admin replacement and document-forwarding continuity

**As a user, I want HomeVault to help preserve the practical paperwork path for work, school, and official life so disruptions do not snowball into missed forms and delayed recovery.**

**Priority:** P2  
**Dependencies:** EP-2201, EP-2802, EP-4402

##### Tasks

- [ ] Add continuity prompts for employment forms, school enrollment papers, insurance correspondence, and critical document forwarding.
- [ ] Add guidance for temporary address changes, scanned-copy fallback, and who can gather paperwork physically.
- [ ] Add helper-facing summaries for document retrieval, submission, and follow-up.
- [ ] Add links between paperwork continuity and mail, offsite storage, identity recovery, and travel transitions.
- [ ] Add review prompts after move, job change, school-year reset, or household restructuring.

##### Acceptance Criteria

- [ ] Households can spot where administrative paperwork continuity is fragile.
- [ ] The app helps reduce missed-form chaos during transitions and incidents.
- [ ] Paperwork continuity stays operational rather than turning into full document workflow software.

---

## 43. Additional Brainstorm Threads

### 43.1 Accessibility Sparks

- `what if the person who explains everything is overloaded`
- Visual-first versus text-first packet variants
- Communication cards for helpers who do not know the household well
- Sensory-friendly outage guidance
- `can this plan work when nobody can think clearly` honesty prompts

### 43.2 Identity Recovery Sparks

- `what do you need before you can replace the thing you lost`
- Wallet theft versus house fire identity-recovery differences
- Temporary-paperwork bridge plans
- `the copy exists but the original location is useless right now`
- `what official office would you call first` prompts

### 43.3 Workday Continuity Sparks

- `whose workday breaks first if the internet dies`
- School-closure plus remote-work collision planning
- Backup workspace and hotspot realism checks
- `if one laptop dies this week` household impact prompts
- Workday continuity for single parents and solo households

---

## 44. Reconstitution And Displacement Backlog

### EP-46 - Temporary Displacement And Short-Term Rehousing

#### Story EP-4601 - Add temporary displacement continuity plans

**As a household, I want HomeVault to help when we cannot safely stay at home so short-term displacement does not turn into total operational chaos.**

**Priority:** P1  
**Dependencies:** EP-2102, EP-3302, EP-4001

##### Tasks

- [ ] Define temporary-displacement plans for hotel stays, staying with family, short-term rental, and shelter-like fallback scenarios.
- [ ] Add structured fields for who can host, what must come immediately, pet constraints, medication continuity, and school/workday implications.
- [ ] Add guidance for what records belong in a displacement kit versus what can stay behind.
- [ ] Add continuity prompts for laundry, food, charging, bathing, sleeping arrangements, and transport during multi-day displacement.
- [ ] Add review nudges for households with high displacement risk but no realistic host or fallback path.

##### Acceptance Criteria

- [ ] Households can prepare for the first days away from home with less guesswork.
- [ ] Displacement planning feels more operational than generic travel packing.
- [ ] The product can highlight when a household has no viable short-term landing option.

#### Story EP-4602 - Add return-home and re-entry coordination

**As a user, I want HomeVault to help us move from displacement back into the home so the transition back is safer and less chaotic.**

**Priority:** P2  
**Dependencies:** EP-4601, EP-4101

##### Tasks

- [ ] Add re-entry checklists for safety inspection, cleaning, food restock, utility restoration, and sleeping-at-home readiness.
- [ ] Add prompts for what to verify before children, pets, elders, or medically sensitive people return.
- [ ] Add links between displacement plans, provider coordination, incident evidence, and restart-the-house flows.
- [ ] Add reminders for temporary-service shutdown, mail redirection cleanup, and helper handback after return.
- [ ] Add review prompts that turn displacement lessons into future readiness improvements.

##### Acceptance Criteria

- [ ] Users can coordinate a safer return home after a forced absence.
- [ ] Re-entry guidance bridges incident recovery and ordinary household function.
- [ ] The app helps close the loop on temporary relocation cleanly.

### EP-47 - Device, Network, And Workspace Reconstitution

#### Story EP-4701 - Add critical device replacement continuity

**As a household, I want HomeVault to help replace or reconstitute critical devices so a dead phone, laptop, or router does not wipe out our ability to function.**

**Priority:** P1  
**Dependencies:** EP-401, EP-1301, EP-4501

##### Tasks

- [ ] Define reconstitution guidance for primary phone, family laptop, router, modem, printer, and key smart-home hub scenarios.
- [ ] Add structured fields for restore prerequisites, account dependencies, backup status, replacement preferences, and helper context.
- [ ] Add prompts for what works with `replace now`, `borrow temporarily`, or `restore later` recovery paths.
- [ ] Add links to digital-recovery records, providers, receipts, warranties, and incident workspaces.
- [ ] Add missing-data warnings when a household depends on a device with no backup path, no restore confidence, or no ownership clarity.

##### Acceptance Criteria

- [ ] Households can understand how to recover core device function after loss or failure.
- [ ] Device reconstitution reveals hidden fragility in backups, ownership, and account access.
- [ ] The feature stays continuity-focused rather than becoming an IT asset manager.

#### Story EP-4702 - Add network and home-tech rebuild flows

**As a user, I want HomeVault to guide rebuilding home connectivity so internet, Wi-Fi, and smart-home basics can come back quickly after failure or replacement.**

**Priority:** P2  
**Dependencies:** EP-4701, EP-3201

##### Tasks

- [ ] Add rebuild flows for router replacement, ISP swap, Wi-Fi reset, smart-lock reconnect, and device re-pairing.
- [ ] Add structured links to provider records, admin access notes, physical placement, and dependent systems.
- [ ] Add prompts for what breaks if connectivity is only partially restored.
- [ ] Add helper-safe summaries for non-technical spouses, relatives, or service providers assisting with recovery.
- [ ] Add drill or simulation prompts for households whose entire continuity model depends on a brittle home network.

##### Acceptance Criteria

- [ ] Users can move from `internet is dead` to `the house is usable again` with less friction.
- [ ] Connectivity rebuild flows stay understandable for non-technical households.
- [ ] Home-tech recovery ties back to the broader dependency and incident system.

### EP-48 - Multilingual And Translation-Friendly Continuity

#### Story EP-4801 - Add multilingual emergency outputs

**As a multilingual household, I want HomeVault to support emergency guidance in the languages my family and helpers actually use so stress does not get amplified by translation gaps.**

**Priority:** P2  
**Dependencies:** EP-1002, EP-4301

##### Tasks

- [ ] Define multilingual packet, helper-view, and handoff-output support for the most critical emergency content.
- [ ] Add language-preference fields for household members, caregivers, neighbors, and trusted helpers.
- [ ] Add structured flags for content that should remain literal, simplified, or not translated automatically.
- [ ] Add prompts for where language mismatch creates practical risk in caregiving, medical, school, or provider scenarios.
- [ ] Add review and drill prompts for whether helpers can actually use the translated or simplified outputs.

##### Acceptance Criteria

- [ ] Households can prepare at least one emergency output that is more usable across language boundaries.
- [ ] Translation support remains honest about limits and confidence.
- [ ] The product reduces communication friction without overpromising machine-perfect translation.

#### Story EP-4802 - Add interpreter and communication bridge planning

**As a family, I want HomeVault to preserve who can help bridge communication gaps so incidents do not stall when the right person cannot understand or be understood.**

**Priority:** P2  
**Dependencies:** EP-4801, EP-2601

##### Tasks

- [ ] Add communication-bridge records for bilingual family members, trusted interpreters, provider hotlines, and school/community support contacts.
- [ ] Add prompts for which incidents are most vulnerable to language mismatch.
- [ ] Add helper-safe summaries for when a bridge person should be called first.
- [ ] Add guidance for what information can be relayed through a bridge versus what should stay more private.
- [ ] Add review prompts for stale assumptions about language support availability.

##### Acceptance Criteria

- [ ] Households can identify practical communication bridges before a stressful event.
- [ ] Language-support planning remains privacy-aware and household-centered.
- [ ] The feature helps real coordination without turning HomeVault into a translation service.

---

## 45. More Brainstorm Threads

### 45.1 Displacement Sparks

- `we cannot sleep here tonight` first-hour checklists
- Host-family overload warnings
- Hotel-with-kids and hotel-with-pets continuity prompts
- `what would you regret leaving behind for 72 hours` drills
- Temporary-housing friction like laundry, chargers, meds, and school bags

### 45.2 Reconstitution Sparks

- `if the router died today, who could rebuild this house`
- Borrowed-device survival mode
- `replace now or restore later` decision helpers
- Family printer as hidden continuity dependency
- `this whole house depends on one laptop` warnings

### 45.3 Language And Communication Sparks

- Packet variants for grandparents or helpers who read a different language
- `who can translate for the school, clinic, or landlord`
- Bilingual caregiver handoff cards
- `can the least fluent person still use this plan` honesty prompts
- Low-literacy emergency output variants
