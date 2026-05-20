# Mélange — 30 June 2026, Bikaner

A static React landing page for **Mélange**, the joint celebration of the
wedding reception of **Shivendra Singh Tanwar & Divyani Jain**, the **60th
birthday of Sarandha Tanwar**, and her **retirement from Sophia School**.

Live site: **https://shivendrasinghtanwar.github.io/melange-26/**

The page is built with Vite + React + TypeScript + Tailwind, deployed as a
purely static bundle to GitHub Pages via GitHub Actions. The RSVP form
submits to a Google Apps Script Web App that writes each reply to a
Google Sheet — no backend required.

## Run it locally

```bash
npm install
npm run dev
```
The dev server prints a local URL (default `http://localhost:5173/`).
Edits to any file under `src/` hot-reload automatically.

```bash
npm run build      # produce dist/
npm run preview    # serve dist/ to verify the production bundle
```

## Editing event details

All copy that changes year-to-year lives in **`src/lib/config.ts`** —
edit names, date, venue address, the itinerary, and the RSVP deadline
there and the whole site updates.

## Adding photos

Drop JPGs (or PNGs) into `public/assets/gallery/`. The three gallery
placeholders in `src/components/Gallery.tsx` are styled cards — replace
them with real `<img>` tags pointing at your photos when you're ready.

Suggested aspect ratios per slot:

| Slot | Aspect | Filename suggestion          |
| ---- | ------ | ----------------------------- |
| I    | 3 : 4  | `public/assets/gallery/01.jpg` |
| II   | 16 : 9 | `public/assets/gallery/02.jpg` |
| III  | 4 : 3  | `public/assets/gallery/03.jpg` |

## Connecting the RSVP form

The form posts to a Google Apps Script Web App. One-time setup:

1. Open a fresh Google Sheet. Put these headers in row 1:
   `Name`, `Phone`, `Guests`, `Message`, `Timestamp`.
2. **Extensions → Apps Script**. Paste this and save:

   ```javascript
   const sheetName = 'Sheet1';
   const scriptProp = PropertiesService.getScriptProperties();

   function intialSetup() {
     const ss = SpreadsheetApp.getActiveSpreadsheet();
     scriptProp.setProperty('key', ss.getId());
   }

   function doPost(e) {
     const lock = LockService.getScriptLock();
     lock.tryLock(10000);
     try {
       const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
       const sheet = doc.getSheetByName(sheetName);
       const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
       const nextRow = sheet.getLastRow() + 1;
       const newRow = headers.map(h => h === 'Timestamp' ? new Date() : e.parameter[h]);
       sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
       return ContentService.createTextOutput(JSON.stringify({ result: 'success', row: nextRow }))
         .setMimeType(ContentService.MimeType.JSON);
     } catch (err) {
       return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: String(err) }))
         .setMimeType(ContentService.MimeType.JSON);
     } finally {
       lock.releaseLock();
     }
   }
   ```
3. Run `intialSetup` once (it links the script to the sheet).
4. **Deploy → New deployment → Web App**. Execute as **Me**, access
   **Anyone**. Copy the Web App URL.
5. Paste the URL into `src/lib/config.ts`:

   ```ts
   export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/…/exec';
   ```
6. Commit and push to `release`. The deploy workflow will rebuild and
   roll out the change.

## Deploying

The repository's default branch is `release`. Every push to `release`
triggers `.github/workflows/deploy.yml`, which:

1. Installs deps with `npm ci`.
2. Builds the site with `VITE_BASE=/melange-26/` so all asset URLs are
   served correctly from the project page.
3. Uploads `dist/` as a Pages artifact and deploys it to GitHub Pages.

One-time setup on GitHub:

- **Settings → Pages → Source: GitHub Actions**.
- **Settings → General → Default branch: `release`**.

Once that's in place, day-to-day deploys are just `git push origin release`.

## Project layout

```
.github/workflows/deploy.yml   GitHub Pages deploy workflow
public/                         Static assets (served as-is)
  .nojekyll                       stop Jekyll from rewriting paths
  assets/gallery/                 drop event photos here
src/
  main.tsx                        React root
  App.tsx                         page composition
  index.css                       Tailwind + custom CSS (cloth, ornaments, etc.)
  lib/config.ts                   EVENT constants + APPS_SCRIPT_URL
  lib/rsvp.ts                     validation + form submission
  hooks/useReveal.ts              IntersectionObserver hook
  components/
    OrnamentSprites.tsx             shared SVG <defs> sheet
    Hero.tsx                        arch + Ganesh + wordmark
    Milestones.tsx                  Love / Life / Legacy
    Gallery.tsx                     three-placeholder asymmetric grid
    Details.tsx                     burgundy itinerary + venue
    RsvpForm.tsx                    controlled form + submission
    Footer.tsx                      paisley monogram + closing
docs/                              design exploration (mockups + plan)
```

## Attribution

The Ganesh silhouette used in `OrnamentSprites.tsx` is from
[Noun Project icon #744441 via Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Noun_Project_Ganesha_icon_744441_cc.svg),
licensed CC BY-SA 3.0.
