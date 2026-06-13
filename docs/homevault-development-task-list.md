# HomeVault Development Task List

Last reviewed: 2026-06-13

## Current State

HomeVault is a working Expo/React Native app with local persistence, demo household data, core household/inventory/documents/maintenance screens, export manifest generation, backup validation, sample restore flow, and restore confirmation/audit feedback.

Current branch: `codex/homevault-stabilization`

Latest committed slice: `b581022 Make export fixes actionable`

In-progress, uncommitted slice:
- Smarter export readiness routing in `apps/mobile/App.tsx`
- Status: implemented locally, typecheck/test/web export passed before interruption, not committed
- Behavior: export fix rows can open the first unlinked document, missing-file document, open task, undocumented asset link flow, or repair-history fallback instead of landing on a generic tab

## Review Questions

1. Should the app stay local-first only for the first usable release, or should account/sync work start now?
2. Should document attachments remain as local file references for now, or should we build real file-copy/storage semantics next?
3. Should export/restore be treated as the MVP completion bar, or should mobile polish and onboarding come first?
4. Do we want to push the current branch to GitHub now, knowing it includes the design brief PDF in repository history/context?

## P0: Finish The Usable Local MVP

- [ ] Decide whether to keep and commit smarter export-fix routing.
- [ ] Add an onboarding/reset path that explains demo data versus a real household.
- [ ] Add empty states for inventory, documents, rooms, maintenance, and export readiness.
- [ ] Add basic form validation messages for required fields and invalid dates/amounts.
- [ ] Add delete confirmations for destructive record actions.
- [ ] Add edit flows for all primary record types: property, rooms, assets, documents, tasks.
- [ ] Verify navigation return paths after every create/edit/delete action.
- [ ] Add a small “backup last created/restored” status indicator on Household or Export.

## P1: Documents And Attachments

- [ ] Define the file attachment model for native mobile and web preview.
- [ ] Copy picked files into an app-owned storage location instead of storing picker URIs directly.
- [ ] Add attachment presence/status labels in document list and detail views.
- [ ] Allow documents to link to multiple records, not just one asset/room/property.
- [ ] Add a “missing attachment” filtered view from export readiness.
- [ ] Add a “missing asset documentation” filtered view from export readiness.
- [ ] Add document search/filter by type, linked record, vendor, and date.

## P1: Export, Restore, And Trust

- [ ] Add a full export package download path for native platforms.
- [ ] Add restore preview diff details beyond record counts.
- [ ] Add restore conflict warnings when current data would be replaced.
- [ ] Add backup package version compatibility messaging.
- [ ] Add import error states for malformed JSON, unsupported versions, and partial records.
- [ ] Add tests for checklist action routing and restore confirmation edge cases.
- [ ] Decide whether backup packages should include copied attachment payloads or references only.

## P1: Maintenance Workflow

- [ ] Add recurring task generation from completed tasks.
- [ ] Add better snooze controls: date picker, common presets, and reason/note.
- [ ] Add service history timeline by asset and by household.
- [ ] Add cost summaries by year, room, asset, and category.
- [ ] Add repair event entry from maintenance history without requiring users to first open an asset.
- [ ] Add task filters for overdue, due soon, snoozed, completed, and assigned.

## P2: Inventory And Household Depth

- [ ] Add asset photo support.
- [ ] Add warranty-expiration tracking and alerts.
- [ ] Add model/serial lookup affordances.
- [ ] Add room-level summaries for documents, tasks, assets, and attention items.
- [ ] Add asset duplicate/copy flow for repeated fixtures or appliances.
- [ ] Add richer asset categories and category-specific fields.

## P2: App Polish

- [ ] Replace letter-only tab icons with real icons.
- [ ] Tighten mobile layout spacing and text wrapping across small screens.
- [ ] Add loading, saving, and error states for all async actions.
- [ ] Add toast/banner feedback after saves, deletes, exports, and restores.
- [ ] Add accessibility labels for icon-only and compact controls.
- [ ] Verify with in-app browser screenshots once browser access policy allows it.

## P2: Engineering Hardening

- [ ] Add screen-level tests for key flows where practical.
- [ ] Add repository tests for SQLite parity with in-memory repository behavior.
- [ ] Add linting/formatting scripts if we want stricter CI hygiene.
- [ ] Add CI workflow for typecheck, tests, and web export.
- [ ] Document local development commands in the README.
- [ ] Decide when to push branch and open a draft PR.

## Suggested Next Three Slices

1. Commit or revise the smarter export-fix routing currently in progress.
2. Add empty states and form validation messages across the five core tabs.
3. Define and implement real document attachment storage semantics.
