# Deploy the showcase

Live: https://red-after-midnight.vercel.app (Vercel project `brisk-poplar-4nc25xu`).

The showcase imports `../storyboard.json` from the repo root, so it is built locally and the
static `dist/` folder is uploaded. A remote Vercel build from `showcase/` alone would not see
the storyboard.

## Media

`public/media/` holds copies of pipeline outputs used by the page:

- `film_en_16x9.mp4` ← `outputs/films/red-after-midnight_en_16x9.mp4`
- `keyframes/shot_XX.jpg` ← `outputs/keyframes/shot_XX.jpg`

Re-copy them after regenerating the film.

## Redeploy (PowerShell)

```powershell
cd showcase
npm run build
$env:VERCEL_ORG_ID = "team_4r0TKJXXEIHWc87biYmatU3j"
$env:VERCEL_PROJECT_ID = "prj_waTKCVkVWC5b8bch9VMiCRnpSFns"
npx vercel deploy dist --prod
```

The two IDs pin the upload to the existing project; without them, deploying `dist` creates a
new project named `dist`. They are identifiers, not secrets (the login token stays in the CLI).

## Graded film

The primary graded cut (Amharic 9:16) and all four exports are on
[Google Drive](https://drive.google.com/drive/folders/1Xatyvm5bmQ2fJDovh3T2HrSjtuFrVHNh).
