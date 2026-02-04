# 🚀 Deployment Guide for AI Creative Studio

Your project is a full-stack application (React + Node.js Express). For the easiest "Go Live" experience, I recommend using **Zeabur** or **Render**, as they can host both frontend and backend easily.

## 1. Security Check (Completed ✅)
- **API Keys**: All sensitive keys (Google, Replicate) are now safely stored in `.env` and accessed via `process.env`. They are NOT in the code.
- **Rate Limiting**: Added `express-rate-limit` to the server to prevent abuse (default: 100 requests / 15 mins).
- **Environment**: Your `.env` file lists the keys. **NEVER commit `.env` to GitHub.**

## 2. Recommended Hosting: Zeabur (Easiest for full-stack)
Zeabur automatically detects your project structure.

1.  **Push to GitHub**: Make sure your code is in a GitHub repository.
2.  **Sign up**: Go to [zeabur.com](https://zeabur.com) and login with GitHub.
3.  **Create Project**: Click "New Project" -> "Deploy New Service" -> Select your repo.
4.  **Environment Variables**:
    *   In Zeabur settings for the backend service, go to "Variables".
    *   Add `GOOGLE_API_KEY`: `AIza...`
    *   Add `REPLICATE_API_TOKEN`: `r8_...`
5.  **Enjoy**: Zeabur will give you a public URL (e.g., `ai-studio.zeabur.app`).

## 3. Alternative: Render.com
1.  **Web Service**: Create a new Web Service for the backend.
    *   Command: `node server.js`
    *   Env Vars: Add keys here.
2.  **Static Site**: Create a Static Site for the frontend (`vite build`).
    *   *Note*: You'll need to update the frontend API calls to point to your Render backend URL instead of `localhost:3001`.

## 🔒 Safety Tips
- **Monitor Usage**: Check your Google Cloud Console and Replicate Dashboard regularly for unusual spikes.
- **Billing Limits**: Set up budget alerts in Google Cloud to strictly limit spending.
