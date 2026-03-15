# Workshop Manager - Cloud Deployment

This folder is now configured to be deployed as a live Web Application on **Render.com**. 
Once deployed, you can access your Workshop Manager from any computer or phone in the world.

---

## 🚀 Deployment Steps (Takes ~5 minutes)

### Step 1: Push to GitHub
Render needs to read your code from GitHub.
1. Go to [GitHub](https://github.com/) and create a new, **private** repository (e.g., named `workshop-manager`).
2. Open a terminal in this `e:\WorkshopApp` folder.
3. Run these commands to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Connect to Render
1. Create a free account on [Render.com](https://render.com/).
2. Go to your Dashboard and click **New +** -> **Blueprint**.
3. Connect your GitHub account and select your `workshop-manager` repository.
4. Render will automatically read the `render.yaml` file in this folder and configure everything!
5. Click **Apply**.

### Step 3: Secure Your App (Important!)
Because your app is now on the public internet, you *must* set a password so strangers cannot see your clients.
1. In your Render Dashboard, go to your new Web Service -> **Environment**.
2. Click **Add Environment Variable**.
3. Set the Key to `APP_PASSWORD`.
4. Set the Value to a strong password (e.g., `MySecretP@ssw0rd`).
5. Save changes. This will restart your app and enable the login screen.

---

## 💾 Important Note on Data & Pricing

By default, Render's **Free Tier** deletes local files every time the app goes to sleep (after 15 mins of inactivity) or redeploys. **This means your SQLite database will be wiped out.**

To prevent this and keep your data permanently, the `render.yaml` file in this project is configured to request a **Persistent Disk**.
* **You must be on a Render Paid Plan (e.g., the $7/mo Starter plan) for the persistent disk to work.**
* If you absolutely want it to be 100% free forever without losing data, the database code would need to be rewritten to use a third-party free cloud database (like Supabase, Neon, or MongoDB Atlas) instead of SQLite.

## Local Development
If you just want to run it on your own computer instead of the cloud:
```bash
npm start
```
