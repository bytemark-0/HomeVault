# HomeVault Beta Privacy Notes

**Prepared:** June 20, 2026  
**Audience:** Private beta testers and release operators.

---

## Plain-Language Beta Position

HomeVault is local-first. During private beta, the app stores vault records on the user's device and does not upload household records to a HomeVault server.

This includes:

- Home names and addresses
- Rooms
- Assets
- Serial numbers
- Notes
- Documents and document metadata
- Photos and attachment paths
- Maintenance tasks
- Repairs and parts

---

## Backups and Exports

Backups and exports are files the user chooses to create.

Private beta testers should treat exported files as sensitive because they may contain household records and attachment metadata. Testers are responsible for storing backup/export files somewhere safe.

Restore behavior:

- Restoring a backup replaces the current local vault after confirmation.
- Invalid backups should be rejected with an actionable error.
- Testers should export a backup before destructive restore testing.

---

## Permissions

HomeVault should request permissions only when they are relevant to the user action.

- **Photos:** Used when attaching room, asset, repair, property, or document images.
- **Camera:** Used for barcode scanning and taking HomeVault photos when the user chooses those actions.
- **Notifications:** Used for maintenance reminders and should be requested in context.
- **Microphone:** Not needed for private beta and should not appear in the generated Android manifest.

---

## Feedback and Diagnostics

The in-app Beta Support screen opens a feedback email template with:

- App version/build context
- Platform
- Sample/real vault mode
- Aggregate record counts

It does not automatically attach diagnostics, addresses, serial numbers, notes, document contents, photos, or attachment files.

Testers should avoid sending private household details unless support specifically requests them.

---

## Data Deletion

For private beta, testers can delete local data by removing the app or using platform app-storage controls.

If they need to move data first, they should export a backup from the Export screen and restore that backup on another install.

---

## Open Launch Decisions

- Confirm the private beta support email is configured and monitored.
- Decide whether a hosted formal privacy policy is required before external beta invitations.
- Verify Android generated native manifest does not include microphone permission.
- Decide whether app-level encrypted storage is required for public launch or deferred.

