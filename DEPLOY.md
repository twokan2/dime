# Dime — Deployment Guide
## From zero to live, step by step.

---

### STEP 1: Install the tools (one-time setup)

If you don't already have these on your computer:

**a) Install Node.js**
- Go to https://nodejs.org
- Download the LTS version (the green button)
- Run the installer, click through everything
- To verify it worked, open Terminal (Mac) or Command Prompt (Windows) and type:
```
node --version
```
You should see a version number like v20.x.x

**b) Install Git**
- Go to https://git-scm.com/downloads
- Download for your OS
- Run the installer with default settings
- To verify: open Terminal and type:
```
git --version
```

**c) Create a GitHub account (if you don't have one)**
- Go to https://github.com and sign up (free)

---

### STEP 2: Create the GitHub repository

1. Go to https://github.com/new
2. Repository name: `dime`
3. Description: `Learn conversational Spanish`
4. Set it to **Public**
5. Do NOT check "Add a README file" — leave it empty
6. Click **Create repository**
7. You'll see a page with setup instructions — leave this tab open, you'll need the URL

---

### STEP 3: Set up the project on your computer

Open Terminal (Mac) or Command Prompt (Windows). Run these commands one at a time:

```bash
# Navigate to where you want the project (e.g., Downloads or Desktop)
cd ~/Downloads

# Clone the empty repo
git clone https://github.com/YOUR_USERNAME/dime.git

# Go into the project folder
cd dime
```

Now copy ALL the project files I gave you into this `dime` folder:
- `package.json`
- `vite.config.js`
- `index.html`
- `src/main.jsx`
- `src/App.jsx`

The folder structure should look like:
```
dime/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx
```

---

### STEP 4: Install dependencies and test locally

```bash
# Install all packages
npm install

# Run the app locally to make sure it works
npm run dev
```

Open your browser to http://localhost:5173/dime/ — you should see Dime running. Press Ctrl+C in terminal to stop it when you're done testing.

---

### STEP 5: Deploy to GitHub Pages (free hosting)

```bash
# Build and deploy in one command
npm run deploy
```

This will:
- Build the optimized production version
- Push it to a special `gh-pages` branch on GitHub
- Your site will be live in about 1-2 minutes

---

### STEP 6: Enable GitHub Pages (first time only)

1. Go to your repo: https://github.com/YOUR_USERNAME/dime
2. Click **Settings** (top tab, near the right)
3. In the left sidebar, click **Pages**
4. Under "Source", it should already say `gh-pages` branch. If not, select it.
5. Click **Save**
6. Wait 1-2 minutes
7. Your site is now live at: `https://YOUR_USERNAME.github.io/dime/`

---

### STEP 7: Push your source code too

The deploy command only pushes the built files. Push your actual code:

```bash
git add .
git commit -m "Initial commit - Dime v1"
git push origin main
```

---

### STEP 8: Get a custom domain ($8-12/year)

**a) Buy the domain**
1. Go to https://porkbun.com (cheapest registrar)
2. Search for your preferred domain name. Suggestions:
   - `playdime.com`
   - `dimeapp.co`
   - `getdime.app`
   - `learnwithdime.com`
3. Add to cart, checkout (should be $8-12/year)

**b) Point the domain to GitHub Pages**
1. In Porkbun, go to **Domain Management** → click your domain → **DNS Records**
2. Add these records:

| Type  | Host | Answer                        |
|-------|------|-------------------------------|
| CNAME |      | YOUR_USERNAME.github.io       |

(Leave "Host" blank for the root domain)

If you want `www` to also work, add:

| Type  | Host | Answer                        |
|-------|------|-------------------------------|
| CNAME | www  | YOUR_USERNAME.github.io       |

**c) Tell GitHub about your domain**
1. Go to your repo → **Settings** → **Pages**
2. Under "Custom domain", type your domain (e.g., `playdime.com`)
3. Click **Save**
4. Check "Enforce HTTPS" (may take a few minutes to become available)

**d) Update vite.config.js**
Once your custom domain is working, change the `base` in vite.config.js:

```javascript
// BEFORE (GitHub Pages subdirectory)
base: '/dime/',

// AFTER (custom domain — root path)
base: '/',
```

Then redeploy:
```bash
npm run deploy
```

---

### STEP 9: Future updates

Whenever you want to push changes:

```bash
# Save your code
git add .
git commit -m "Description of what changed"
git push origin main

# Deploy the updated site
npm run deploy
```

---

### Troubleshooting

**"npm: command not found"** → Node.js isn't installed. Go back to Step 1a.

**"git: command not found"** → Git isn't installed. Go back to Step 1b.

**Site shows 404 after deploy** → Go to Settings → Pages and make sure the source branch is set to `gh-pages`. Wait 2 minutes and refresh.

**Site looks broken / blank page** → Make sure `base: '/dime/'` is set in vite.config.js (must match your repo name). If using a custom domain, change it to `base: '/'`.

**Custom domain not working** → DNS changes can take up to 24 hours. Usually it's 10-15 minutes. Make sure the CNAME record is correct.

**"Permission denied" on git push** → You need to authenticate. Run:
```bash
gh auth login
```
Or set up an SSH key: https://docs.github.com/en/authentication

---

### What's deployed

- **12 levels** (10 neutral Latin American + 2 Caribbean/PR)
- **240 questions** total (20 per level)
- **3 question types**: translate, fill-in-the-blank, scenario
- **Audio pronunciation** (Web Speech API)
- **Share functionality** (native share on mobile, clipboard on desktop)
- **XP, streaks, combos, accuracy tracking**
- **Progressive unlock** — Caribbean levels require completing all neutral levels
- **Zero hosting cost** (GitHub Pages)
