# Deploy

How to publish MDView to GitHub.

## One-time setup

```bash
# 1. Create the repo on GitHub (https://github.com/new).
#    Name: mdview
#    Visibility: public
#    Do NOT initialize with README, license, or .gitignore — we already have them.

# 2. Add the remote.
git remote add origin https://github.com/8u9i/mdview.git

# 3. Push the initial commit.
git push -u origin master
```

If your default branch is `main` instead of `master`:

```bash
git branch -M main
git push -u origin main
```

## Tagging a release

```bash
# 1. Update CHANGELOG.md with the new version's notes.

# 2. Build the installers locally so you can attach them.
npm install
npm run build

# 3. Commit the changelog bump.
git add CHANGELOG.md
git commit -m "Release v0.1.0"

# 4. Tag the release.
git tag -a v0.1.0 -m "MDView 0.1.0"

# 5. Push the tag.
git push origin master --tags

# 6. Create a GitHub release with the installers attached.
gh release create v0.1.0 \
  src-tauri/target/release/mdview.exe \
  src-tauri/target/release/bundle/msi/MDView_0.1.0_x64_en-US.msi \
  src-tauri/target/release/bundle/nsis/MDView_0.1.0_x64-setup.exe \
  --title "MDView 0.1.0" \
  --notes-file CHANGELOG.md
```

## CI-driven releases (optional)

The included GitHub Actions workflow (`.github/workflows/ci.yml`) builds installers on every push to `main`. To publish them automatically as a GitHub Release when you push a tag, add this job at the bottom of the workflow:

```yaml
publish:
  name: Publish GitHub Release
  needs: release
  if: startsWith(github.ref, 'refs/tags/')
  runs-on: windows-latest
  permissions:
    contents: write
  steps:
    - uses: actions/download-artifact@v4
      with:
        path: artifacts

    - name: Create GitHub Release
      uses: softprops/action-gh-release@v2
      with:
        files: artifacts/**/*
        generate_release_notes: true
```

## Secrets

The CI workflow does not require any secrets for the included jobs. If you add code-signing later (recommended for production), set these repository secrets:

| Secret | Purpose |
|---|---|
| `WINDOWS_CERT_FILE` | Base64-encoded `.pfx` signing certificate. |
| `WINDOWS_CERT_PASSWORD` | Password for the certificate. |

Then add to `.github/workflows/ci.yml`:

```yaml
- name: Decode signing cert
  run: |
    [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${{ secrets.WINDOWS_CERT_FILE }}")) | Out-File -Encoding ascii mdview.pfx
- name: Sign the executable
  uses: alexliesenfeld/msbuild-signtool@v1
  with:
    certificate-path: mdview.pfx
    certificate-password: ${{ secrets.WINDOWS_CERT_PASSWORD }}
    signed-files: src-tauri/target/release/mdview.exe
```
