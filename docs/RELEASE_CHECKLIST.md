# Release Checklist Workflow

This document outlines the mandatory steps for a production release of Devonz.

## 1. Pre-Release Validation
- [ ] Run `pnpm run lint:fix` and `pnpm run typecheck`.
- [ ] Verify all tests pass with `pnpm run test`.
- [ ] Check `SECURITY.md` and `DEPLOYMENT.md` for any required env var updates.
- [ ] Update `CHANGELOG.md` with recent accomplishments.

## 2. Desktop Verification (Windows)
- [ ] Run `build-msix.ps1` to verify packaging.
- [ ] Test the generated `.msix` in a clean environment.
- [ ] Verify port resolution logic works if port 3000 is occupied.

## 3. Deployment
- [ ] Merge `develop` into `main`.
- [ ] Tag the release: `git tag -a v1.x.x -m "Release v1.x.x"`.
- [ ] Push tags: `git push origin --tags`.
- [ ] Verify CI Pipeline passes on the tagged commit.

## 4. Post-Release
- [ ] Monitor logs in the production aggregator.
- [ ] Check crash reporter for any immediate regression bursts.
