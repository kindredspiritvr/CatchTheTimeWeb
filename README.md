# Catch the Time · Web

A standalone installable PWA version of Catch the Time for iPhone, iPad, Android and desktop browsers.

## What works
- Current and next catch time
- Full daily timeline with passed/current/next states
- Default, mixed and custom-only time modes
- Pattern packs: repeats, runs up, runs down and mirrors
- Custom times
- Per-device palette and font choices
- Editable phrase and emoji sharing
- Copy/share actions
- CTT3 setup-code import/export compatible with the Android v3 app
- Offline use after first load
- Add to Home Screen / standalone PWA mode
- Optional live notifications while the web app remains open

## iPhone limitation
Reliable scheduled notifications after iOS suspends or closes the PWA need Web Push from a server. This build intentionally has no server and no account requirement. The UI and settings continue to work offline.

## GitHub Pages deployment
This repo includes `.github/workflows/pages.yml`.

1. Push the files to a GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open **Actions** and run/re-run **Deploy Catch the Time Web** if needed.
5. GitHub will show the public Pages URL after deployment.

On iPhone, open that URL in Safari, tap **Share → Add to Home Screen**.
