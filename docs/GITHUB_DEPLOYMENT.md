# Enterprise ERP | GitHub Pages Deployment Guide

This guide explains how to compile and host your production-grade ERP system on GitHub Pages.

## Why GitHub Pages?
Our transformed ERP runs complete storage routines, calculations, reports, and Google Drive syncing client-side in the web browser. This means you do not need back-end web servers, allowing you to host the compiled assets on GitHub Pages index directories free of charge.

## Manual Upload Deployment

1. Compile the production configuration locally:
   ```bash
   npm run build
   ```
2. Your bundled single-page resources are saved in `/dist`.
3. Create a clean GitHub repository (e.g. `erp-system`).
4. Commit the files inside `/dist` and push to the repository:
   ```bash
   cd dist
   git init
   git add .
   git commit -m "Deploy production compilation"
   git remote add origin https://github.com/USERNAME/erp-system.git
   git branch -M main
   git push -u origin main --force
   ```
5. On your GitHub Repository:
   - Navigate to **Settings** -> **Pages**.
   - Under **Build and deployment**, select **Deploy from a branch**.
   - Point the directory root to `/` on the `main` branch.
   - Click Save.

Your live application is now accessible worldwide!
