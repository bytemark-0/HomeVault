# HomeVault Beta Release Checklist

**Prepared:** June 20, 2026  
**Purpose:** Shared beta-release runbook for Codex, Claude Code, and human release work.

---

## Current Beta Branch

- Branch: `main`
- Preview app config: `apps/mobile/app.json`
- EAS build config: `apps/mobile/eas.json`
- CI workflow: `.github/workflows/ci.yml`

---

## Required Local Gate

Run from the repository root before cutting a beta candidate:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run export:web --workspace=apps/mobile
git diff --check
```

Expected result:

- All commands pass.
- Web export writes to `apps/mobile/dist`.
- No generated files appear as unexpected changes except intentional build output.

---

## Dependency Audit Gate

Run before each beta candidate:

```bash
npm audit --audit-level=moderate
```

Current decision:

- Critical findings: stop ship.
- High findings: stop ship unless explicitly mitigated.
- Moderate findings: may ship only if they are documented in `docs/homevault-security-audit-register.md`.
- Do not run `npm audit fix --force` on the beta branch without a dedicated framework-upgrade regression pass.

---

## GitHub CI Gate

Required checks for beta:

- Typecheck packages
- Typecheck mobile app
- Lint
- Tests
- Generated sample backup fixture consistency
- Web export

Release rule:

- Do not distribute a beta build unless CI is green on the branch or commit used for the build.
- Web export is a required CI job, not informational.
- If branch protection is not configured yet, manually verify the green CI run and record the link in the release notes.

---

## Native Permission Check

Before distributing the first Android beta build:

- [ ] Confirm the generated Android manifest does not request microphone/audio recording permission.
- [ ] Confirm camera permission appears only because barcode scanning and photo capture require it.
- [ ] Confirm photo/media permissions match current app behavior.
- [ ] Confirm notification permission copy appears only when reminders are relevant.

Current config note:

- `apps/mobile/app.json` blocks `android.permission.RECORD_AUDIO`.
- Expo public config may still list the camera dependency's implicit audio permission; validate the generated native build before shipping.

---

## EAS Preview Build Commands

Run from `apps/mobile`:

```bash
npx eas-cli build --profile preview --platform ios
npx eas-cli build --profile preview --platform android
```

Optional simulator build:

```bash
npx eas-cli build --profile preview:simulator --platform ios
```

Optional native pre-build inspection:

```bash
npx eas-cli build:inspect --platform android --profile preview --stage pre-build --output /private/tmp/homevault-android-inspect --force
```

Current blocker:

- `npx eas-cli build:inspect ...` requires an Expo account login before it can generate the native project.

Beta distribution decision for now:

- Use EAS internal distribution for the first private beta candidate.
- Move to TestFlight and Google Play Internal Testing after the first installable builds are validated.

---

## Versioning

Current values:

- Expo version: `1.0.0`
- iOS bundle identifier: `com.homevault.app`
- iOS build number: `1`
- Android package: `com.homevault.app`
- Android version code: `1`

Before each beta build:

- Increment iOS `buildNumber`.
- Increment Android `versionCode`.
- Keep Expo `version` stable unless the user-facing app version changes.

---

## Device Smoke Matrix

Minimum before first private beta:

- [ ] Current iPhone on a current iOS release
- [ ] Smaller or older iPhone, or simulator equivalent
- [ ] Current Android device or emulator
- [ ] Smaller or older Android device or emulator

Reference:

- Device matrix and run log: `docs/homevault-beta-device-matrix.md`
- First-user pilot script: `docs/homevault-first-user-pilot-script.md`

Record for each test:

- Device model
- OS version
- Build profile
- Build number/version code
- Tester
- Date
- Result

---

## P0 Smoke Flows

- [ ] Fresh install opens without crash.
- [ ] Fresh install does not show unexplained sample data.
- [ ] Create first home with only required fields.
- [ ] Add one room.
- [ ] Add one asset.
- [ ] Add one document or attachment.
- [ ] Add one maintenance task.
- [ ] Complete a maintenance task.
- [ ] Enter sample mode.
- [ ] Exit or delete sample mode without losing real data.
- [ ] Export backup.
- [ ] Restore backup on clean install.
- [ ] Invalid backup is rejected safely.
- [ ] Search finds a known asset or document.
- [x] Feedback/support instructions are findable.

Verification note:

- June 20, 2026: Browser verified the main top-bar support control opens Beta Support from the `http://127.0.0.1:8081/` local preview.

---

## Emergency Plan Release Hardening

Run this focused pass before calling the Emergency Plan release ready:

- [ ] Verify onboarding → Emergency tab → packet export → trusted share on a clean install.
- [ ] Verify upgraded-install behavior with existing household continuity data present.
- [ ] Verify empty, partial, and fully prepared household states across Emergency, Export, and annual review.
- [ ] Verify trusted-share, packet export, and annual review behavior on web and native surfaces.
- [ ] Verify sensitive values do not appear in previews, logs, notifications, or stale-route recovery screens.
- [ ] Run at least one spouse/partner and one helper handoff pilot.

Required regression command:

```bash
npm run test:emergency-plan
```

Record findings in the release notes or link follow-up bugs before shipping.

---

## Stop-Ship Rules

Pause beta distribution for any:

- Data loss
- Backup export failure
- Restore failure
- Migration failure
- Crash on launch
- Fresh-install onboarding dead end
- Sample data mistaken for real user data
- Support/diagnostic flow that exposes private household data by default
