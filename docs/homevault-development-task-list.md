# HomeVault Development Task List

Last reviewed: 2026-06-14

## Current State

HomeVault is a working Expo/React Native app with local persistence, demo household data, core household/inventory/documents/maintenance screens, export manifest generation, backup validation, sample restore flow, restore confirmation/audit feedback, export readiness routing, empty states, form validation, Household backup status, demo workspace onboarding, document search/filter, asset duplicate/copy flow, richer asset categories, service history timeline, cost summaries, recurring task generation, snooze controls, repair event entry from maintenance, warranty expiration tracking with home dashboard alerts, asset photo support (camera/library picker), geometric tab icons, accessibility labels, loading/error states, toast feedback, model lookup affordance, in-memory repository tests (13 cases), task utility tests (12 cases), ESLint v9 CI hygiene, and a CI workflow.

Current branch: `codex/homevault-stabilization`

Latest slice before this update: `99245ed Extract task utilities and add 12 unit tests`

## Review Questions

1. Should the app stay local-first only for the first usable release, or should account/sync work start now?
2. Should document attachments remain as local file references for now, or should we build real file-copy/storage semantics next?
3. Should export/restore be treated as the MVP completion bar, or should mobile polish and onboarding come first?
4. Do we want to push the current branch to GitHub now, knowing it includes the design brief PDF in repository history/context?

## P0: Finish The Usable Local MVP

- [x] Decide whether to keep and commit smarter export-fix routing.
- [x] Add an onboarding/reset path that explains demo data versus a real household.
- [x] Add empty states for inventory, documents, rooms, maintenance, and export readiness.
- [x] Add basic form validation messages for required fields and invalid dates/amounts.
- [x] Add delete confirmations for destructive record actions.
- [x] Add edit flows for all primary record types: property, rooms, assets, documents, tasks.
- [x] Verify navigation return paths after every create/edit/delete action.
- [x] Add a small “backup last created/restored” status indicator on Household or Export.

## Destructive Action Audit

Current destructive actions exposed in the app:
- Document delete: confirmed from document detail.
- Task delete: confirmed from task detail, including a completion-history warning when relevant.
- Repair delete: confirmed from asset repair history.
- Demo data reset: confirmed from Household readiness.
- Backup restore: guarded by validation, preview, dry-run checklist, and typed `RESTORE` confirmation.

Asset and room delete are not currently exposed as user actions.

## Navigation Return Audit

Current create/edit/delete return behavior:
- Room-scoped asset, document, and task additions return to the room detail screen.
- Asset-scoped document, task, repair, task delete, repair delete, and document delete flows return to asset detail.
- Document and task edits return to their detail screens so the user can review the saved record.
- Room edits return to room detail; property edits return to Household.
- Generic inventory, document, and maintenance creates return to the relevant tab list.
- Restore and demo reset clear selected records and return to Household.

No broken return paths were found in the currently exposed flows.

## Primary Edit Flow Audit

Current primary record edit coverage:
- Property: Household property card and demo onboarding panel open `EditPropertyScreen`.
- Rooms/areas: room detail exposes Edit and saves through `AddRoomScreen`.
- Assets: asset detail exposes Edit and saves through `AddAssetScreen`.
- Documents: document detail exposes Edit and saves through `AddDocumentScreen`.
- Tasks: task detail exposes Edit and saves through `AddTaskScreen`.

No missing primary edit affordances were found in the currently exposed flows.

## P1: Documents And Attachments

- [x] Define the file attachment model for native mobile and web preview.
- [x] Copy picked files into an app-owned storage location instead of storing picker URIs directly.
- [x] Add attachment presence/status labels in document list and detail views.
- [x] Allow documents to link to multiple records, not just one asset/room/property.
- [x] Add a “missing attachment” filtered view from export readiness.
- [x] Add a “missing asset documentation” filtered view from export readiness.
- [x] Add document search/filter by type, linked record, vendor, and date. *(codex)*

Attachment model note:
- Documents preserve backward-compatible `filePath` values and optional structured attachment metadata.
- Native picked files are copied into app-owned `homevault-documents` storage when filesystem access is available.
- Web preview and copy failures fall back to `external_reference` attachments.
- Document lists and detail views distinguish app-owned copies, external file references, and metadata-only records.
- The document form now supports multi-select links and document summaries collapse multiple linked records.
- Export readiness can open filtered document review views for missing attachments and assets without documents.

## P1: Export, Restore, And Trust

- [x] Add a full export package download path for native platforms. *(codex)*
- [x] Add restore preview diff details beyond record counts. *(codex)*
- [x] Add restore conflict warnings when current data would be replaced. *(codex)*
- [x] Add backup package version compatibility messaging. *(codex)*
- [x] Add import error states for malformed JSON, unsupported versions, and partial records. *(codex — covered by errorKind classification in version compatibility slice)*
- [x] Add tests for checklist action routing and restore confirmation edge cases. *(codex)*
- [x] Decide whether backup packages should include copied attachment payloads or references only. *(decision: references only for this release — attachment files can be large, the JSON format is not suitable for embedding binary data, and users on the same device always have access to app-owned copies; a zip-bundled backup format is a future feature)*

## P1: Maintenance Workflow

- [x] Add recurring task generation from completed tasks. *(codex)*
- [x] Add better snooze controls: date picker, common presets, and reason/note. *(codex)*
- [x] Add service history timeline by asset and by household. *(codex)*
- [x] Add cost summaries by year, room, asset, and category. *(codex)*
- [x] Add repair event entry from maintenance history without requiring users to first open an asset. *(codex)*
- [x] Add task filters for overdue, due soon, snoozed, completed, and assigned. *(codex — All/Urgent/Upcoming/Snoozed/Completed pills already present; assigned N/A in local-only mode)*

## P2: Inventory And Household Depth

- [x] Add asset photo support. *(codex — expo-image-picker with camera/library picker, copy to app storage, preview in add form and detail screen; warranty_expiry and photo_uri columns added to SQLite with ensureColumn migration)*
- [x] Add warranty-expiration tracking and alerts. *(codex)*
- [x] Add model/serial lookup affordances. *(codex — "Look up" chip on model field opens web search for brand + model)*
- [x] Add room-level summaries for documents, tasks, assets, and attention items. *(codex)*
- [x] Add asset duplicate/copy flow for repeated fixtures or appliances. *(codex)*
- [x] Add richer asset categories and category-specific fields. *(codex — 11 preset categories with custom fallback; domain type remains string for backward compatibility)*

## P2: App Polish

- [x] Replace letter-only tab icons with real icons. *(codex)*
- [x] Tighten mobile layout spacing and text wrapping across small screens. *(codex — flex hero layout replacing hardcoded maxWidth, conditional brand/model/serial in AssetRow, keyboardShouldPersistTaps on all form screens)*
- [x] Add loading, saving, and error states for all async actions. *(codex)*
- [x] Add toast/banner feedback after saves, deletes, exports, and restores. *(codex)*
- [x] Add accessibility labels for icon-only and compact controls. *(codex)*
- [ ] Verify with in-app browser screenshots once browser access policy allows it.

## P2: Engineering Hardening

- [x] Add screen-level tests for key flows where practical. *(codex — extracted pure utils from App.tsx into taskUtils.ts; 12 tests covering date math, recurrence, and currency formatting)*
- [x] Add repository tests for SQLite parity with in-memory repository behavior. *(codex — 13 tests in tests/repository.test.ts covering CRUD, completions, snapshots, and dashboard)*
- [x] Add linting/formatting scripts if we want stricter CI hygiene. *(codex — ESLint v9 flat config with @typescript-eslint; 0 errors across packages, mobile src, and tests)*
- [x] Add CI workflow for typecheck, tests, and web export. *(codex — .github/workflows/ci.yml runs typecheck:packages, typecheck:app, and npm test)*
- [x] Document local development commands in the README. *(codex)*
- [ ] Decide when to push branch and open a draft PR.

## Suggested Next Slices

All P0, P1, and P2 engineering tasks are complete. Remaining open questions for the next phase:

1. **Account/sync** — stay local-first for the first usable release, or start backend work now?
2. **Room delete** — done. *(codex — deleteRoom cascades through assets, their tasks/completions/repairs; confirmation alert shows asset count; documents preserved)*
3. **Zip-bundled export** — pack document attachments and asset photos into a zip archive alongside the JSON manifest for true portable backups.
4. **Onboarding polish** — done. *(codex — Home tab shows a 3-step getting-started card when vault is empty; Household demo banner is hidden once the property label is renamed away from the default; property initials derive from label; asset form shows a hint when no rooms exist yet)*
5. **Asset lifecycle fields** — done. *(codex — install date (shown with age), purchase date, and purchase cost added to asset form and detail screen; Field gains optional keyboardType prop)*
6. **Bug fixes and data quality** — done. *(codex — nextTaskLabel now derived from actual open tasks; snoozed tasks re-surface when snooze expires, fixed in both repos; ensureColumn migrations for install_date/purchase_date/cost_cents; lastServiceLabel now considers task completions alongside repair events; 'Open file' button on document detail routes through Linking.openURL)*
