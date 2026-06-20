# HomeVault Security Audit Register

**Prepared:** June 20, 2026  
**Scope:** Dependency audit triage for private beta readiness.  
**Command:** `npm audit --audit-level=moderate`

---

## Summary

`npm audit` currently reports:

- Critical: 0
- High: 0
- Moderate: 38

The moderate findings are transitive dependency issues in the Expo, React Native, Jest, and related build/test dependency graph. The suggested `npm audit fix --force` path would install breaking framework upgrades such as newer Expo or React Native versions. That is not appropriate for the first private beta candidate without a dedicated framework-upgrade branch and full device regression pass.

Private beta decision:

- Accept these moderate findings temporarily for private beta.
- Do not run `npm audit fix --force` on the beta branch.
- Revisit after beta build validation or when Expo SDK-compatible patches are available.

---

## Findings

### AUD-001 - `js-yaml` via Jest/Istanbul tooling

**Severity:** Moderate  
**Advisory:** `GHSA-h67p-54hq-rp68`  
**Path:** `jest` -> `babel-plugin-istanbul` -> `@istanbuljs/load-nyc-config` -> `js-yaml`  
**Area:** Test/build tooling  
**Beta risk:** Accepted

Rationale:

- This dependency path is used by test and instrumentation tooling.
- It is not part of normal user-entered household data flows.
- The automatic fix path requires breaking framework changes through React Native/Jest-related dependencies.

Required follow-up:

- Re-check after Expo/Jest dependency updates.
- Avoid feeding untrusted YAML into project test tooling.

---

### AUD-002 - `postcss` via Expo Metro tooling

**Severity:** Moderate  
**Advisory:** `GHSA-qx2v-qp2m-jg93`  
**Path:** `expo` -> `@expo/cli` / `@expo/metro-config` -> `postcss`  
**Area:** Build/export tooling  
**Beta risk:** Accepted

Rationale:

- The issue affects CSS stringify behavior.
- HomeVault does not accept arbitrary user-authored CSS.
- The automatic fix path requires a breaking Expo upgrade.

Required follow-up:

- Re-check after the next Expo SDK-compatible upgrade.
- Keep web export as a release gate so build regressions are visible.

---

### AUD-003 - `uuid` via Expo config plugins

**Severity:** Moderate  
**Advisory:** `GHSA-w5hq-g745-h8pq`  
**Path:** `expo` -> `@expo/config-plugins` -> `xcode` -> `uuid`  
**Area:** Native project/config tooling  
**Beta risk:** Accepted

Rationale:

- This dependency path is used by native config/build tooling.
- The vulnerable API requires buffer-oriented UUID calls that are not used by HomeVault app code.
- The automatic fix path requires a breaking Expo upgrade.

Required follow-up:

- Re-check after Expo config tooling updates.
- Validate generated native project output during EAS build.

---

## Beta Release Rule

Before each beta candidate:

- [ ] Re-run `npm audit --audit-level=moderate`.
- [ ] Confirm there are still no critical or high findings.
- [ ] Confirm moderate findings are limited to the accepted tooling paths above, or add new findings to this register.
- [ ] Do not ship if a runtime dependency vulnerability appears in user-data handling, attachment parsing, backup/restore, file export, or networking behavior without a specific mitigation.

