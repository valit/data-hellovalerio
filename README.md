# data.hellovaler.io — Personal Analytics Dashboard

A private GA4 analytics dashboard deployed at `data.hellovaler.io`. Password-protected, dark mode, server-side only credential access.

---

## Setup

### 1. Find your GA4 numeric property ID

1. Open [analytics.google.com](https://analytics.google.com)
2. Click the gear icon (Admin) in the bottom-left
3. Under **Property**, click **Property Settings**
4. Your **Property ID** is the number shown at the top right (e.g. `317481234`) — copy it

### 2. Create a Google service account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select or create a project (e.g. "Analytics Dashboard")
3. In the left menu: **APIs & Services → Enabled APIs & Services**
4. Click **+ Enable APIs and Services**, search for **Google Analytics Data API**, enable it
5. Go to **APIs & Services → Credentials**
6. Click **+ Create Credentials → Service Account**
7. Give it any name (e.g. `analytics-reader`), click **Done**
8. Click the service account you just created, go to the **Keys** tab
9. Click **Add Key → Create new key → JSON** — this downloads a `.json` file

### 3. Grant the service account access to your GA4 property

1. Back in GA4 Admin → **Property Access Management** (under Property column)
2. Click the **+** button → **Add users**
3. Enter the service account email (looks like `analytics-reader@your-project.iam.gserviceaccount.com`)
4. Set role to **Viewer**, save

### 4. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
DASHBOARD_PASSWORD=your-chosen-password

# The numeric property ID from step 1
GA4_PROPERTY_ID=317481234

# Paste the entire contents of the downloaded JSON key file as a single line
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

To paste the JSON as one line, run:
```bash
cat /path/to/downloaded-key.json | tr -d '\n'
```
Then paste the output as the value of `GOOGLE_SERVICE_ACCOUNT_JSON`.

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your password.

---

## Deploy to Vercel

### Initial deploy

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. In the **Environment Variables** section, add the three variables from step 4 above
4. Deploy

### Add the custom domain

1. In Vercel, go to your project → **Settings → Domains**
2. Add `data.hellovaler.io`
3. Vercel will show you a CNAME record to add — go to your DNS provider and add:
   - **Type:** CNAME
   - **Name:** `data`
   - **Value:** `cname.vercel-dns.com`
4. Wait for DNS propagation (usually a few minutes, up to an hour)

### Update environment variables on Vercel

After deploying, go to **Settings → Environment Variables** and confirm all three are set. Any change requires a redeploy (Vercel does this automatically when you push).

---

## Data notes

- All data is fetched live from the GA4 Data API — no database
- Responses are cached for 1 hour server-side (`revalidate = 3600`)
- The session explorer groups by `sessionId` — it shows one row per session with landing page, exit page, page count, and duration. Page-by-page sequence is not available via the GA4 Data API (that requires BigQuery export).
- GA4 property ID in the tracking snippet (`G-MNGEE06DVE`) is different from the numeric property ID used by the API
