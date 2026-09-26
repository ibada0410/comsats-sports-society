# Connect the recruitment form to Google Sheets

Every application submitted on `recruitment.html` becomes a new row in a Google Sheet owned by the society. It takes about 5 minutes and is free.

## 1. Create the sheet
1. Sign in to the society's Google account and create a new Google Sheet (e.g. "CSS Recruitment").
2. Open **Extensions → Apps Script**.

## 2. Add the script
1. Delete everything in `Code.gs` and paste in the contents of [`Code.gs`](Code.gs) from this folder.
2. (Optional) To get an email for each application, set `NOTIFY_EMAIL` at the top, e.g. `const NOTIFY_EMAIL = "society@gmail.com";`
3. Click **Save**.

## 3. Deploy it as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access** and allow the permissions (Google shows a warning because it's your own unverified script: click *Advanced → Go to project*).
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy.../exec`.

## 4. Paste the URL into the website
Open the admin panel (**yoursite.vercel.app/admin**) → **Recruitment → Status & applications**, paste the link into **Google Sheet web-app link**, and click **Publish**.

You can also paste your Google Sheet's normal link into **Applications sheet** so the admin has a button that opens it.

Submit a test application. A sheet tab called **Applications** appears with a header row and your test entry.

## Notes
- **Duplicates:** the script rejects a second application with the same registration number and the form tells the applicant.
- **Changing the script later:** use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL.
- **Privacy:** the sheet holds students' phone numbers and emails. Share it only with the council.
