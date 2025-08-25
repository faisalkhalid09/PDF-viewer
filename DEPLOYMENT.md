# 🚀 TLDraw PDF Viewer - Railway Deployment Guide

This guide will help you deploy the TLDraw PDF Viewer to Railway.

## 📋 Prerequisites

- [GitHub](https://github.com) account
- [Railway](https://railway.app) account
- Git installed on your system

## 🔧 Deployment Files Included

The following files have been created for Railway deployment:

- ✅ `railway.json` - Railway deployment configuration
- ✅ `nixpacks.toml` - Build configuration for Railway
- ✅ `.gitignore` - Files to exclude from Git
- ✅ `.env.example` - Environment variables template
- ✅ `package.json` - Updated with Railway-compatible scripts

## 📚 Step-by-Step Deployment

### Step 1: Create GitHub Repository

1. **Go to [GitHub](https://github.com)** and sign in
2. **Click "New Repository"** or visit [github.com/new](https://github.com/new)
3. **Repository Settings:**
   - Name: `tldraw-pdf-viewer` (or your preferred name)
   - Description: `Custom PDF Viewer Component for TLDraw with annotation support`
   - Visibility: `Public` (recommended) or `Private`
   - ✅ Check "Add a README file"
   - ✅ Add .gitignore: `Node`
   - License: `MIT License` (optional)
4. **Click "Create repository"**

### Step 2: Upload Files to GitHub

#### Option A: Using Git Command Line

1. **Clone your new repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tldraw-pdf-viewer.git
   cd tldraw-pdf-viewer
   ```

2. **Copy all project files** to the cloned directory

3. **Add and commit files:**
   ```bash
   git add .
   git commit -m "Initial commit: TLDraw PDF Viewer with Railway deployment config"
   git push origin main
   ```

#### Option B: Using GitHub Web Interface

1. **Go to your repository** on GitHub
2. **Click "uploading an existing file"** or "Add file" → "Upload files"
3. **Drag and drop all files** from your project directory
4. **Commit the changes** with message: "Initial commit: TLDraw PDF Viewer"

### Step 3: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)** and sign in
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository:** `tldraw-pdf-viewer`
5. **Railway will automatically:**
   - Detect the Node.js project
   - Use the `railway.json` and `nixpacks.toml` configurations
   - Install dependencies with `npm ci`
   - Build the project with `npm run build`
   - Start the server with `npm run preview`

### Step 4: Configure Domain (Optional)

1. **In Railway dashboard**, go to your deployed project
2. **Click "Settings"** tab
3. **Go to "Domains"** section
4. **Click "Generate Domain"** for a free Railway subdomain
5. **Or add custom domain** if you have one

### Step 5: Verify Deployment

1. **Click on the generated URL** in Railway dashboard
2. **You should see the TLDraw PDF Viewer** application
3. **Test the features:**
   - Load sample PDF
   - Test maximize/minimize controls
   - Try TLDraw annotation tools

## 📁 Files to Upload to GitHub

Upload **ALL** of these files to your GitHub repository:

### 📋 **Core Application Files:**
```
src/
├── components/
│   ├── PdfViewerComponent.tsx
│   ├── SimplePdfViewer.tsx
│   ├── TldrawEditor.tsx
│   └── VirtualClassroom.tsx
├── shapes/
│   └── PdfViewerShape.tsx
├── App.tsx
├── main.tsx
└── index.css

public/
└── sample-pdf/
    └── page-1.svg
```

### ⚙️ **Configuration Files:**
```
package.json           (✨ Updated for Railway)
tsconfig.json
tsconfig.node.json
vite.config.ts
index.html
```

### 🚀 **Deployment Files:**
```
railway.json           (🆕 Railway config)
nixpacks.toml         (🆕 Build config)
.gitignore            (🆕 Git ignore)
.env.example          (🆕 Environment template)
```

### 📖 **Documentation Files:**
```
README.md
QUICK_START.md
DEMO.md
INTEGRATION_EXAMPLE.md
DEPLOYMENT.md         (🆕 This file)
```

## 🔧 Environment Variables (Optional)

If you need to set environment variables in Railway:

1. **Go to Railway project dashboard**
2. **Click "Variables" tab**
3. **Add variables:**
   - `NODE_ENV=production`
   - `PORT` (Railway sets this automatically)

## 🐛 Troubleshooting

### Build Issues
- **Check Railway build logs** in the deployment tab
- **Verify all dependencies** are in `package.json`
- **Ensure TypeScript compiles** locally with `npm run build`

### Runtime Issues
- **Check Railway deploy logs** for startup errors
- **Verify port configuration** in `package.json` scripts
- **Test locally** with `npm run preview`

### Common Fixes
```bash
# If build fails locally, try:
npm install
npm run build
npm run preview

# If TypeScript errors:
npm run type-check
```

## 🌟 Features Available After Deployment

- ✅ **Public URL** for sharing the application
- ✅ **Automatic deployments** on GitHub pushes
- ✅ **HTTPS** enabled by default
- ✅ **Custom domain** support
- ✅ **Environment variables** support
- ✅ **Build logs** and monitoring

## 🎉 Success!

Once deployed, your TLDraw PDF Viewer will be available at your Railway URL and ready to use! 

**Share the URL** with others to demonstrate the PDF annotation capabilities and TLDraw integration.

---

**Need help?** 
- Check Railway documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord community: [railway.app/discord](https://railway.app/discord)
- GitHub issues for this project
