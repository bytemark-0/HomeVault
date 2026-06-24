# HomeVault Beta Device Matrix

**Prepared:** June 23, 2026  
**Purpose:** Define the minimum P0 device coverage required before inviting private beta testers.

---

## Minimum Matrix

| Slot | Platform | Target | Minimum purpose |
| --- | --- | --- | --- |
| A | iPhone | Current iOS release on a modern device | Baseline install, onboarding, photo, reminder, export, restore |
| B | iPhone | Smaller or older iPhone, or approved simulator fallback | Small-screen layout, welcome/onboarding fit, navigation stress |
| C | Android | Current Android device or emulator | Baseline install, onboarding, permissions, export, restore |
| D | Android | Smaller or older Android device or emulator | Small-screen layout, Android back behavior, permission recovery |

Use a physical device whenever possible for Slots A and C. Simulators/emulators are acceptable only when the corresponding physical device is unavailable for the same-day check.

---

## Record For Each Run

- Device model
- OS version
- Build profile (`preview`, `preview:simulator`, or equivalent)
- App version
- iOS build number or Android version code
- Tester
- Date
- Result (`pass`, `pass with notes`, or `fail`)
- Screenshot links for any layout or copy issue

---

## P0 Smoke Flows

Run these on every matrix slot unless explicitly waived:

1. Fresh install opens without crash.
2. Fresh install does not show unexplained sample data.
3. Welcome screen explains HomeVault clearly.
4. Create first home using only required fields.
5. Add or skip the property photo.
6. Add one room.
7. Add one asset.
8. Add one document or attachment.
9. Add one maintenance task.
10. Complete or snooze a maintenance task.
11. Enter sample mode.
12. Exit sample mode without losing real data.
13. Export a backup.
14. Validate an invalid backup safely.
15. Restore a backup on a clean install.
16. Open Beta Support and start a feedback email.

---

## Known Focus Areas

- Welcome screen fit on smaller phones
- Large-text clipping on onboarding, dashboard, forms, and detail screens
- Android hardware back behavior in nested create/edit flows
- Property, room, and asset photo permission recovery
- Backup/export share-sheet behavior
- Restore overwrite confirmation and attachment rebuilds

---

## Run Log Template

| Slot | Device | OS | Build | Tester | Date | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A |  |  |  |  |  |  |  |
| B |  |  |  |  |  |  |  |
| C |  |  |  |  |  |  |  |
| D |  |  |  |  |  |  |  |
