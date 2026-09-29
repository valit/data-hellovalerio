# Analytics Dashboard

A password-protected GA4 analytics dashboard I designed and built to understand how people use my portfolio.

Rather than reproducing the predefined reports in Google Analytics, I wanted an interface that made the data easier to explore — allowing me to filter, cross-reference, and move between different views of the same activity.

The dashboard connects directly to the Google Analytics Data API and is deployed on Vercel.

## What it does

- Displays portfolio traffic and engagement data from GA4
- Supports cross-filtering across dashboard views
- Provides session-level exploration
- Connects related dimensions of the data rather than treating them as separate reports
- Fetches data directly from GA4 without maintaining a separate database

## Built with

- Next.js
- TypeScript
- Google Analytics Data API
- Vercel
- AI-assisted development

## Design and development

I designed and built the dashboard as an independent project using AI-assisted development. It grew out of wanting to explore my own portfolio data in ways that weren't easy in the standard Google Analytics interface.

---

## Setup

### 1. Find your GA4 numeric property ID

1. Open [Google Analytics](https://analytics.google.com/)
2. Click the gear icon (**Admin**) in the bottom-left
3. Under **Property**, click **Property Settings**
4. Your Property ID is the number shown at the top right (e.g. `317481234`) — copy it

### 2. Create a Google service account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project (e.g. `Analytics Dashboard`)
3. In the left menu, go to **APIs & Services → Enabled APIs & Services**
4. Click **+ Enable APIs and Services**, search for **Google Analytics Data API**, and enable it
5. Go to **APIs & Services → Credentials**
6. Click **+ Create Credentials → Service Account**
7. Give it any name (e.g. `analytics-reader`) and click **Done**
8. Click the service account you just created and go to the **Keys** tab
9. Click **Add Key → Create new key → JSON**

This downloads a `.json` file containing the service account credentials.

### 3. Grant the service account access to your GA4 property

1. Return to **GA4 Admin → Property Access Management**
2. Click the **+** button → **Add users**
3. Enter the service account email  
   (it will look something like `analytics-reader@your-project.iam.gserviceaccount.com`)
4. Set the role to **Viewer**
5. Save

### 4. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
DASHBOARD_PASSWORD=your-chosen-password

# The numeric property ID from step 1
GA4_PROPERTY_ID=317481234

# Paste the entire contents of the downloaded JSON key file as a single line
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

To convert the JSON file to a single line, run:

```bash
cat /path/to/downloaded-key.json | tr -d '\n'
```

Then paste the output as the value of `GOOGLE_SERVICE_ACCOUNT_JSON`.

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your dashboard password.

---

## Deploy to Vercel

### Initial deployment

1. Push the repository to GitHub
2. Go to [Vercel](https://vercel.com/new) and import the repository
3. In **Environment Variables**, add the three variables from the setup above
4. Deploy

### Add a custom domain

In Vercel:

1. Go to **Project → Settings → Domains**
2. Add your custom domain

Vercel will provide the DNS configuration required for your domain.

For a subdomain, this will typically be a CNAME record similar to:

```text
Type: CNAME
Name: data
Value: cname.vercel-dns.com
```

Add the record through your DNS provider and allow time for DNS propagation.

### Update environment variables on Vercel

After deploying, go to:

**Settings → Environment Variables**

Confirm that all three environment variables are present.

Changes to environment variables require a new deployment.

---

## Data notes

- All analytics data is fetched live from the GA4 Data API — there is no separate database.
- Responses are cached server-side for one hour (`revalidate = 3600`).
- The session explorer groups data by `sessionId`, showing one row per session with landing page, exit page, page count, and duration.
- Page-by-page session sequences are not available through the GA4 Data API and would require a BigQuery export.
- The GA4 measurement ID used in the website tracking snippet (e.g. `G-XXXXXXXXXX`) is different from the numeric GA4 property ID used by the Data API.
