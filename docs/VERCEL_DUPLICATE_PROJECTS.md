# Fixing duplicate Halal Kitchen projects on Vercel

If you have two Halal Kitchen projects on Vercel and one serves an old version, use this to get the right one on **halalkitchen.app**.

## 1. See which project is live

1. Open **https://halalkitchen.app** in your browser.
2. **View page source** (right‑click → “View Page Source”, or Ctrl+U / Cmd+Option+U).
3. In the `<head>` section, look for:
   ```html
   <meta name="halal-kitchen-deploy-source" content="halal-recipe-frontend-main" />
   ```
   - **If you see it** → The deployment from this repo (halal-recipe-frontend) is the one serving the site. The “old” version is coming from the other project.
   - **If you don’t see it** → The domain is still pointing at the other (old) project.

## 2. Fix it in Vercel

1. In the **Vercel dashboard**, open the **project that is connected to this repo** (halal-recipe-frontend, or the one you push to from this codebase).
2. Go to **Settings → Domains**.
3. Add **halalkitchen.app** (and **www.halalkitchen.app** if you use it) to this project, if they aren’t already.
4. If the domain is already on the **other** (old) project:
   - Open that other project → **Settings → Domains**.
   - **Remove** halalkitchen.app (and www if present) from that project.
5. In the **correct** project, make sure halalkitchen.app is set as **Production** and is the one you want to use.

## 3. Optional: remove the duplicate project

- If you don’t need the old project at all: **Settings → General → Delete Project** for the one that was serving the old version (after moving the domain to the correct project as above).
- Or leave it but with no production domain, so only the correct project serves halalkitchen.app.

## 4. Redeploy and confirm

1. Trigger a new deploy on the **correct** project (e.g. push to the connected Git branch).
2. After the deploy finishes, open https://halalkitchen.app and view source again.
3. Confirm you see `halal-kitchen-deploy-source` with value `halal-recipe-frontend-main` and that the AdSense meta tag and script are present.
