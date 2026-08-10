# Vitals — Personal Health Log

A private health dashboard for blood tests, Garmin activities, sleep, and
weight. Runs as a website you can open from your PC or add to your iPhone
home screen, backed by your own free Supabase database.

Total cost: **$0/month** on free tiers (Vercel + Supabase), for personal use.

---

## 1. Set up the database (Supabase) — ~5 min

1. Go to https://supabase.com -> sign up (free) -> **New project**.
   - Pick any name/region, set a database password (save it somewhere).
2. Once the project is ready, open **SQL Editor** -> **New query**.
3. Paste in the contents of `supabase-schema.sql` (included in this project)
   and click **Run**. This creates four tables: `blood_tests`, `activities`,
   `sleep`, `body_metrics`.
4. Go to **Storage** -> **New bucket** -> name it `lab-reports` -> make it
   **private** -> Create.
5. Go to **Project Settings -> API**. Copy two values, you'll need them next:
   - **Project URL**
   - **anon public** key

Your anon key is safe to put in a frontend app: Row Level Security (already
set up by the SQL script) restricts what it can do. Still, treat it as a
personal secret rather than posting it publicly — it lives in environment
variables below, not in code.

---

## 2. Deploy the website (Vercel) — ~5 min

**Easiest path: no local install needed.**

1. Create a free GitHub account if you don't have one, and a new empty repo,
   e.g. `health-tracker`.
2. Upload every file in this project folder into that repo (drag-and-drop
   works fine on github.com, or use GitHub Desktop).
3. Go to https://vercel.com -> sign up with your GitHub account.
4. **Add New -> Project** -> import your `health-tracker` repo.
   Vercel auto-detects Vite; leave build settings as default.
5. Before deploying, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL from step 1
   - `VITE_SUPABASE_ANON_KEY` = your anon key from step 1
6. Click **Deploy**. In ~1 minute you'll get a live URL like
   `https://health-tracker-yourname.vercel.app`.

That URL is your app — open it on your PC, and on your iPhone in Safari.

### Updating the app later
Any time you want a design/feature change, ask me and I'll hand you updated
files. Replace them in your GitHub repo and Vercel redeploys automatically.

---

## 3. Add it to your iPhone home screen

1. Open the Vercel URL in **Safari** on your iPhone.
2. Tap the **Share** icon -> **Add to Home Screen**.
3. It now opens full-screen, like a native app, with no browser chrome.

---

## 4. iPhone Shortcut — auto-push Health/Garmin data

Garmin activities and sleep sync into Apple Health automatically if you have
the Garmin Connect app installed with Health sync turned on. This Shortcut
reads from Health and pushes straight into your database.

**Build once in the Shortcuts app:**

1. Create a new Shortcut, name it "Sync Health Data".
2. Add action **Get Health Sample** (or "Find Health Samples") for the type
   you want, e.g. Sleep Analysis, for Yesterday.
3. Add a **Text** action to build a JSON body from the result, e.g. for sleep:
   ```json
   {
     "sleep_date": "2026-08-09",
     "duration_min": 435,
     "score": null,
     "source": "Apple Health"
   }
   ```
   (Use Shortcuts' date-formatting and math actions to compute the real
   values from the Health sample — this is the fiddly part; if you send me a
   screenshot of your Health app's sleep data fields, I'll write the exact
   Shortcuts steps for your data.)
4. Add action **Get Contents of URL**:
   - **URL**: `https://YOUR-PROJECT.supabase.co/rest/v1/sleep`
   - **Method**: POST
   - **Headers**:
     - `apikey`: your anon key
     - `Authorization`: `Bearer YOUR_ANON_KEY`
     - `Content-Type`: `application/json`
     - `Prefer`: `return=minimal`
   - **Request Body**: the JSON Text from step 3
5. Test it: run the Shortcut manually once, then check the Sleep page in the
   app to confirm the row appeared.
6. Optional: **Automation** tab -> **Create Personal Automation** -> Time of
   Day (e.g. 8am daily) -> Run this Shortcut, so it syncs itself every
   morning.

Repeat the same pattern for **activities** (Health action: "Find Workouts")
and **body_metrics** (Health action: "Get Weight").

---

## 5. Importing your existing data

- **Blood tests (PDFs)**: upload each PDF to me in a Claude chat and ask me
  to extract the values into a CSV matching the template shown on the
  Upload Data page (columns: `test_date,marker,value,unit,ref_low,ref_high,panel_name`).
  Import the CSV on the **Upload Data** page. Send the PDFs whenever you're
  ready — I can process a batch at once.
- **Garmin history**: Garmin Connect -> Account -> Export Your Data (or
  export individual activities as CSV) -> send me the export and I'll
  convert it to the app's CSV format.
- **Apple Health export**: iPhone Health app -> profile icon -> Export All
  Health Data -> produces a zip with `export.xml`. Send it to me and I'll
  pull sleep, weight, and workouts into importable CSVs.

---

## Project structure
```
src/
  pages/        Dashboard, BloodTests, Activities, Sleep, Upload, Settings
  components/   RangeBar (lab value vs reference range), StatCard, TrendChart, Sidebar
  lib/          supabaseClient.js, queries.js, refRanges.js (fallback ranges)
supabase-schema.sql   Run once in Supabase SQL editor
.env.example          Copy to .env for local dev (npm install && npm run dev)
```

## Local development (optional)
```
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```
