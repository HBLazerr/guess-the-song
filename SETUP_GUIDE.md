# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Spotify API Credentials

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create app"**
3. Enter app details:
   - **Name:** LZRS Player
   - **Description:** Music guessing game
   - **Redirect URI:** `http://127.0.0.1:5173/callback`
4. Click **"Save"** and copy your **Client ID**

**⚠️ Important:** Spotify requires `127.0.0.1` (not `localhost`) for security.

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Client ID:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open `http://127.0.0.1:5173` and sign in with Spotify!

## 🎮 Testing the App

1. **Login** - Click "Sign in with Spotify"
2. **Authorize** - Grant permissions to the app
3. **Select Mode** - Choose Artist, Album, or Track mode
4. **Play** - Answer quiz questions
5. **View Results** - See your score and share

## 🚀 Deploy to Production

### Vercel

```bash
npm i -g vercel
npm run build
vercel
```

### Netlify

```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Important:** Update your Spotify app settings with the production redirect URI!

## 🐛 Troubleshooting

- **"Invalid redirect URI"** - Check that the redirect URI in Spotify dashboard matches `.env`
- **"Cannot read token"** - Clear localStorage and try signing in again
- **"No tracks available"** - Make sure your Spotify account has listening history
- **Build errors** - Delete `node_modules` and `package-lock.json`, then run `npm install`

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SPOTIFY_CLIENT_ID` | Your Spotify app Client ID | `abc123...` |
| `VITE_SPOTIFY_REDIRECT_URI` | OAuth callback URL | `http://127.0.0.1:5173/callback` |

---

Need help? Check the [README.md](./README.md) for detailed documentation.
