# HomeVault Development Task List

Last reviewed: 2026-06-15

## Current State

HomeVault is a working Expo/React Native app with local persistence, demo household data, core household/inventory/documents/maintenance screens, export manifest generation, backup validation, sample restore flow, restore confirmation/audit feedback, export readiness routing, empty states, form validation, Household backup status, demo workspace onboarding, document search/filter, asset duplicate/copy flow, richer asset categories, service history timeline, cost summaries, recurring task generation, snooze controls, repair event entry from maintenance, warranty expiration tracking with home dashboard alerts, asset photo support (camera/library picker), geometric tab icons, accessibility labels, loading/error states, toast feedback, model lookup affordance, barcode scanner with UPC product lookup in the asset form, in-memory repository tests (13 cases), task utility tests (12 cases), ESLint v9 CI hygiene, and a CI workflow.

The app runs on a real iPhone via Expo Go (SDK 54).

Current branch: `codex/expo-go-setup`

Latest slice before this update: `1c92403 Downgrade to Expo SDK 54 for Expo Go and add barcode scanner to asset form`

## Review Questions

1. Should the app stay local-first only for the first usable release, or should account/sync work start now?
2. ~~Should document attachments remain as local file references for now, or should we build real file-copy/storage semantics next?~~ *(resolved — files are copied into app-owned storage; references-only backup format decided for this release)*
3. Should export/restore be treated as the MVP completion bar, or should mobile polish and onboarding come first?
4. ~~Do we want to push the current branch to GitHub now, knowing it includes the design brief PDF in repository history/context?~~ *(resolved — `codex/homevault-stabilization` pushed; new work on `codex/expo-go-setup`)*

## P0: Finish The Usable Local MVP

- [x] Decide whether to keep and commit smarter export-fix routing.
- [x] Add an onboarding/reset path that explains demo data versus a real household.
- [x] Add empty states for inventory, documents, rooms, maintenance, and export readiness.
- [x] Add basic form validation messages for required fields and invalid dates/amounts.
- [x] Add delete confirmations for destructive record actions.
- [x] Add edit flows for all primary record types: property, rooms, assets, documents, tasks.
- [x] Verify navigation return paths after every create/edit/delete action.
- [x] Add a small "backup last created/restored" status indicator on Household or Export.

## Destructive Action Audit

Current destructive actions exposed in the app:
- Document delete: confirmed from document detail.
- Task delete: confirmed from task detail, including a completion-history warning when relevant.
- Repair delete: confirmed from asset repair history.
- Room delete: confirmed from room detail; confirmation alert shows asset count; cascades through assets, their tasks/completions/repairs; documents preserved.
- Demo data reset: confirmed from Household readiness.
- Backup restore: guarded by validation, preview, dry-run checklist, and typed `RESTORE` confirmation.

Asset delete is not currently exposed as a user action.

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
- [x] Add a "missing attachment" filtered view from export readiness.
- [x] Add a "missing asset documentation" filtered view from export readiness.
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
- [x] Verify on real device. *(resolved — app runs on iPhone via Expo Go SDK 54)*

## P2: Engineering Hardening

- [x] Add screen-level tests for key flows where practical. *(codex — extracted pure utils from App.tsx into taskUtils.ts; 12 tests covering date math, recurrence, and currency formatting)*
- [x] Add repository tests for SQLite parity with in-memory repository behavior. *(codex — 13 tests in tests/repository.test.ts covering CRUD, completions, snapshots, and dashboard)*
- [x] Add linting/formatting scripts if we want stricter CI hygiene. *(codex — ESLint v9 flat config with @typescript-eslint; 0 errors across packages, mobile src, and tests)*
- [x] Add CI workflow for typecheck, tests, and web export. *(codex — .github/workflows/ci.yml runs typecheck:packages, typecheck:app, and npm test)*
- [x] Document local development commands in the README. *(codex)*
- [x] Push branch and open for review. *(codex/homevault-stabilization pushed to GitHub 2026-06-15)*

## P3: Missing From Original Brief

Features defined in the design brief that were not translated into the original codex task list.

- [x] **Local push notifications** — wire up `expo-notifications` so maintenance reminders appear on the lock screen. The task state machine (due, upcoming, snoozed, completed) is fully built; notifications are the missing delivery layer. Reschedule on snooze, cancel on completion. *(Must — brief section 10)*
- [x] **Parts and supplies** — add a `Part/Supply` record type linked to assets: filter sizes, part numbers, battery types, paint colors, replacement links. Show parts on asset detail and let users add/edit/delete them. *(Should — brief section 5 and data model)*
- [ ] **Global search** — unified search screen across assets, documents, and tasks simultaneously. Per-screen search exists everywhere but there is no cross-record search entry point. *(Must — brief section 5)*
- [ ] **OCR label capture** — photograph a manufacturer label and extract brand, model, and serial via on-device text recognition. User confirms before saving. Requires a native build (not Expo Go). *(Must — brief sections 5, 6, 9)*
- [ ] **PDF / printable property summary export** — formatted printable export for home sale, insurance, or handoff. Current export is JSON only. *(Should — brief section 6D)*
- [ ] **Projects and improvements** — track renovations, upgrades, and contractor work at the property level with dates, cost, documents, and linked rooms/assets. *(roadmap — brief data model)*
- [ ] **Skipped task state** — record a skipped occurrence without marking the task complete, preserving the history that a due date was intentionally passed. *(brief section 10)*

## Suggested Next Slices

All original P0, P1, and P2 engineering tasks are complete. Current work and open questions:

1. **Account/sync** — stay local-first for the first usable release, or start backend work now?
2. **Room delete** — done. *(codex — deleteRoom cascades through assets, their tasks/completions/repairs; confirmation alert shows asset count; documents preserved)*
3. **Zip-bundled export** — pack document attachments and asset photos into a zip archive alongside the JSON manifest for true portable backups.
4. **Onboarding polish** — done. *(codex — Home tab shows a 3-step getting-started card when vault is empty; Household demo banner is hidden once the property label is renamed away from the default; property initials derive from label; asset form shows a hint when no rooms exist yet)*
5. **Asset lifecycle fields** — done. *(codex — install date (shown with age), purchase date, and purchase cost added to asset form and detail screen; Field gains optional keyboardType prop)*
6. **Bug fixes and data quality** — done. *(codex — nextTaskLabel now derived from actual open tasks; snoozed tasks re-surface when snooze expires, fixed in both repos; ensureColumn migrations for install_date/purchase_date/cost_cents/properties.photo_uri/task_completions.photo_uri; lastServiceLabel now considers task completions alongside repair events; 'Open file' button on document detail; task instructions shown on complete screen; scope tap-through navigation from task detail)*
7. **Repair event editing** — done. *(codex — updateRepairEvent added to repository interface, memory repo, and SQLite repo; AddRepairEventScreen supports edit mode via optional repairEvent prop; service history repair rows now show Edit + Delete side by side; App.tsx wires editRepairEvent mode)*
8. **Task completion photo** — done. *(codex — library/camera photo pickers added to CompleteTaskScreen; image copied to homevault-assets/ storage; photoUri passed through CompleteTaskInput to existing task_completions.photo_uri column; completion history in TaskDetailScreen shows photo thumbnail when present)*
9. **Inventory sort + asset completion photo** — done. *(codex — InventoryScreen sorts filtered results: attention assets first, then alphabetical by name. AssetDetailScreen service history maintenance rows now show completion photo thumbnail when one is present — ServiceItem maintenance variant gains optional photoUri)*
10. **Service history search + year filter; next task in AssetRow** — done. *(codex — ServiceHistoryScreen gains text search (title/asset name) and a year filter row that renders only when history spans multiple years; empty state copy distinguishes no-data from no-match. AssetRow now shows the next open task title in blue when nextTaskLabel is not 'No open tasks')*
11. **Room photo support** — done. *(codex — RoomArea domain type gains photoUri; SQLite DDL adds photo_uri column plus ensureColumn migration; createRoom/updateRoom/toRoom all updated; memory repo picks up field automatically. AddRoomScreen adds library/camera picker; RoomDetailScreen shows full-width photo below hero; HouseholdScreen room rows show 36×36 thumbnail)*
12. **Task completion editing** — done. *(codex — updateTaskCompletion added to repository interface, memory repo, and SQLite repo; CompleteTaskScreen supports edit mode via optional completion prop (pre-populates date, cost, notes, photo; title/button labels switch; handleSave branches on isEditing); TaskDetailScreen completion rows show Edit button inline with cost; App.tsx wires editTaskCompletion mode returning to taskDetail on save)*
13. **Task completion deletion** — done. *(codex — deleteTaskCompletion added to repository interface, memory repo (splice by index), and SQLite repo (DELETE FROM task_completions WHERE id = ?); TaskDetailScreen completion rows gain a Delete button alongside Edit with a confirmation alert; App.tsx wires handleDeleteTaskCompletion and passes onDeleteCompletion prop)*
14. **Completion edit/delete in asset service history** — done. *(codex — ServiceItem maintenance variant gains completionId; AssetDetailScreen adds onEditCompletion + onDeleteCompletion props; maintenance rows now show Edit + Delete buttons matching repair rows; editTaskCompletion mode gains completionEditReturnTarget state so Save/Cancel returns to assetDetail when launched from there)*
15. **Property photo on home screen** — done. *(codex — HomeScreen gains optional propertyPhotoUri prop; renders full-width 180px image between health summary and metric grid when present; App.tsx passes appData.property.photoUri)*
16. **Attention count in household room rows** — done. *(codex — when room.attentionCount > 0, the room row in HouseholdScreen shows "N need/needs attention" in amber instead of the open task count, giving a quicker visual signal for which rooms have assets needing action)*
17. **Tappable linked records in document detail** — done. *(codex — LinkedRecordItem type added to DocumentListItem with id/label/kind; toDocumentListItem computes it inline (replacing formatLinkedRecordLabel helper); DocumentDetailScreen gains onLinkedRecordPress prop and renders a "Linked records" panel with tappable rows; App.tsx routes to asset detail, room detail, or household tab based on record kind)*
18. **Scope type filter on maintenance screen** — done. *(codex — activeScope state added; scopeTypes useMemo derives distinct scope types from task list; a second filter row (All scopes / Property / Room / Asset) appears only when tasks span multiple scope types; filteredTasks respects both state and scope filters)*
19. **Tappable cost summary rows for asset and room dimensions** — done. *(codex — CostSummaryScreen gains onAssetPress/onRoomPress optional props; when viewing 'By asset' or 'By room', group rows become Pressable and the cost total gets an underline; App.tsx wires navigation to openAssetDetail and roomDetail mode)*
20. **Expo Go / SDK 54 compatibility** — done. *(codex — all expo-* packages downgraded to SDK 54 equivalents; expo-image-picker removed from root package.json; expo-sharing removed from app.json plugins; tsconfig ignoreDeprecations set to "6.0" for TypeScript 5.9 baseUrl compatibility; fresh package-lock.json generated)*
21. **Barcode scanner in asset form** — done. *(codex — expo-camera CameraView added to AddAssetScreen as a full-screen Modal; scans EAN-13, EAN-8, UPC-A, UPC-E, Code128, Code39, and QR; tries UPC Item DB product lookup and pre-fills name/brand/model if found, otherwise drops raw barcode into serial field; NSCameraUsageDescription added to app.json iOS infoPlist)*
