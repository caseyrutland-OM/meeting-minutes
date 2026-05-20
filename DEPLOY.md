# Deployment Guide — Meeting Minutes Generator

## What you need
- An Azure subscription (you already have one via M365)
- An Anthropic API key — get one at https://console.anthropic.com
- A GitHub account (free) for the deployment pipeline

---

## Step 1 — Push code to GitHub

1. Create a new **private** GitHub repository (e.g. `meeting-minutes`)
2. Open a terminal in the `meeting-minutes` folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-ORG/meeting-minutes.git
   git push -u origin main
   ```

---

## Step 2 — Create the Azure Static Web App

1. Go to **portal.azure.com** → **Create a resource** → search **Static Web App**
2. Fill in:
   | Field | Value |
   |-------|-------|
   | Name | `meeting-minutes` |
   | Plan type | **Free** |
   | Region | UAE North (or nearest to your users) |
   | Deployment source | **GitHub** |
   | Repository | select your repo + branch `main` |
   | Build preset | **Custom** |
   | App location | `/` |
   | Api location | `api` |
   | Output location | *(leave blank)* |
3. Click **Review + Create** → **Create**

Azure adds a GitHub Actions workflow to your repo automatically and deploys within ~3 minutes.

---

## Step 3 — Add the API key (staff will NEVER see this)

1. In the Azure portal, open your Static Web App resource
2. Go to **Settings → Environment variables**
3. Add a new variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-...` (your key from console.anthropic.com)
4. Click **Save** — the function restarts automatically

---

## Step 4 — Embed in SharePoint

1. Copy your app URL from the Azure portal overview
   (looks like `https://purple-ocean-123.azurestaticapps.net`)
2. Open the SharePoint page you want to add it to → **Edit**
3. Click **+** to add a web part → search **Embed**
4. Paste the URL → **Apply**
5. Resize the web part height to **~900px** for comfortable display
6. **Republish** the page

Staff click the SharePoint page and the tool is right there — no login, no key, no install.

---

## Updating the app in future

Push any changes to `main` — GitHub Actions redeploys automatically in ~2 minutes.

---

## Cost estimate

| Component | Monthly cost |
|-----------|-------------|
| Azure Static Web Apps (Free tier) | $0 |
| Azure Functions (1M calls free/month) | $0 |
| Anthropic API (claude-sonnet) | ~$0.003–$0.02 per meeting |

100 meetings/month ≈ under $2 in API costs.
