# Enterprise ERP | Installation Guide

This document outlines how to set up, install, and execute the Enterprise ERP locally.

## Prerequisite Systems
- **Web Browser**: Any modern web evergreen browser supporting ES6 and IndexedDB (Chrome, Edge, Safari, Firefox).
- **Runtime Tooling**: [Node.js](https://nodejs.org) (v18.0.0 or higher) for packing during deployment (not required for runtime browser hosting).
- **Package Manager**: `npm` or `yarn`.

## Local Setup & Development Execution

1. Clone or download your repository structure.
2. Initialize and download standard build tooling within the directory:
   ```bash
   npm install
   ```
3. Run the fast local development server:
   ```bash
   npm run dev
   ```
4. Access the live interface in your browser:
   ```
   http://localhost:3000
   ```

## Production compilation

To compile the ERP into single-page static files ready for GitHub Pages or simple CDN distributions, execute:

```bash
npm run build
```

This outputs fully bundled resources into the `/dist` directory. The contents of `/dist` are static and can be drag-and-dropped directly onto free static servers like Vercel, Netlify, or Apache without any database or backend runtime requirements.
