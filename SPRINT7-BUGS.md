# Sprint 7 Known Bugs

## Bug 1: RiskPredictor array index mismatch (services/ml/models.ts)
**Status:** Open
**Test:** `RiskPredictor > should predict higher risk for database with many dependencies`
**Problem:** `forwardPass()` uses hardcoded array indices to access features from `Object.values(features)`, but indices are wrong:
- `statefulIdx = 20` should be `19`
- `complianceIdx = 19` should be `18`
- `encryptedIdx = 22` should be `21`
- `input[23]` is `age_days` (default 365), NOT `is_public` (index 22)

This causes `age_days * 10 = 3650` which caps all risk scores at 100, making simple and complex workloads indistinguishable.

**Fix:** Change indices to:
```
depIdx = 10       // dependency_count ✓ (already correct)
complianceIdx = 18  // has_compliance
statefulIdx = 19    // is_stateful
dataSizeIdx = 11    // data_size_gb ✓ (already correct)
encryptedIdx = 21   // is_encrypted
input[22]           // is_public
```

## Bug 2: Root tsconfig missing JSX flag (tsconfig.json)
**Status:** Open (cosmetic — only affects root `tsc --noEmit`, Next.js builds fine)
**Problem:** `frontend/desktop/app/agents/page.tsx` errors with `TS17004: Cannot use JSX unless '--jsx' flag is provided` when running root-level `tsc --noEmit`.
**Fix:** Add `"jsx": "preserve"` to root `tsconfig.json` compilerOptions.

## Test Results: 39/40 passing
Only Bug 1 causes a test failure. All other 39 tests pass.
