# 🎵 LZRS Player - Spotify Song Guessing Game

A minimalist web app where users test how fast they can identify songs by their favorite artists, albums, or genres. Built with React, TypeScript, and the Spotify Web API.

![Tech Stack](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Vite](https://img.shields.io/badge/Vite-6.0-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)

## ✨ Features

- 🔐 **Spotify OAuth Login** - Secure authentication using PKCE flow
- 🎮 **Multiple Game Modes** - Artist, Album, or Track identification
- ⏱️ **Time-Based Scoring** - Earn more points for faster answers
- 🔥 **Streak Bonuses** - Build streaks for extra points
- 🌊 **Animated Soundwave** - Real-time audio visualization
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Glass-morphic UI** - Sleek, modern dark theme
- 🏆 **Detailed Results** - Track your performance and share scores

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Spotify account (Premium not required)
- Spotify Developer credentials

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd guess-the-song
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Spotify API Credentials

#### Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in the details:
   - **App name:** LZRS Player (or any name)
   - **App description:** Song guessing game
   - **Redirect URI:** `http://127.0.0.1:5173/callback`
   - **API/SDKs:** Web API
5. Agree to terms and click **"Save"**
6. Copy your **Client ID**

**Important:** Spotify requires loopback IP address (127.0.0.1) instead of localhost for security reasons.

#### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Spotify Client ID:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
   ```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://127.0.0.1:5173`

**Note:** Use `127.0.0.1` instead of `localhost` as required by Spotify's security policy.

## 🎮 How to Play

1. **Sign In** - Click "Sign in with Spotify" to authenticate
2. **Choose Mode** - Select Artist, Album, or Track mode
3. **Play** - Listen to 30-second previews and identify the correct answer
4. **Score** - Earn points based on speed and accuracy
5. **Share** - View your results and share with friends

## 🏗️ Project Structure

```
guess-the-song/
├── src/
│   ├── components/
│   │   ├── screens/          # Main screen components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   └── ResultScreen.tsx
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Container.tsx
│   │   └── SoundWave.tsx      # Audio visualization
│   ├── hooks/
│   │   ├── useSpotify.ts      # Spotify API integration
│   │   └── useGameLogic.ts    # Game state management
│   ├── lib/
│   │   ├── spotify.ts         # OAuth & token management
│   │   └── utils.ts           # Helper functions
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind config
└── vite.config.ts             # Vite config
```

## 🎨 Design System

The app follows a consistent design system based on an 8px spacing grid:

- **Colors:**
  - Primary: `#1DB954` (Spotify Green)
  - Background: `#121212` (Dark)
  - Accent: `#535353` (Gray)
  - Secondary: `#FFFFFF` (White)

- **Typography:**
  - Font: Poppins
  - Scale: 12px - 40px

- **Spacing:**
  - Base unit: 8px
  - Scale: xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px), 3xl(64px)

- **Responsive Breakpoints:**
  - sm: 600px
  - md: 900px
  - lg: 1200px
  - xl: 1440px

## 🔒 Security & Privacy

- **PKCE Flow** - Secure OAuth 2.0 authorization
- **Client-Side Only** - No backend server required
- **Short-Lived Tokens** - Tokens expire after 1 hour
- **No Data Storage** - Session data stored locally only
- **Minimal Permissions** - Only requests necessary Spotify scopes

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3.4
- **Animation:** Framer Motion 11
- **Icons:** Lucide React
- **Routing:** React Router 6
- **API:** Spotify Web API

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Update Spotify redirect URI in your Spotify app settings:
   - Add: `https://your-domain.vercel.app/callback`

### Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. Update Spotify redirect URI in your Spotify app settings

## 🧪 Development

### Lint Code

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## 🎯 Scoring System

Points are calculated based on three factors:

```javascript
base_points = 100
time_bonus = (remaining_time / total_time) × 50
streak_bonus = streak × 10
total_score = base_points + time_bonus + streak_bonus
```

- Answer correctly to earn base points
- Answer quickly for time bonus (up to 50 points)
- Build streaks for multiplier bonuses

## 📝 Spotify API Scopes

The app requests the following permissions:

- `user-top-read` - Access your top artists and tracks
- `user-read-playback-position` - Read playback position
- `streaming` - Control playback
- `user-read-email` - Read email address
- `user-read-private` - Read user profile

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Powered by [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- Icons by [Lucide](https://lucide.dev)
- Animations by [Framer Motion](https://www.framer.com/motion)

## 📞 Support

If you encounter any issues:

1. Make sure your `.env` file is configured correctly
2. Check that your Spotify app has the correct redirect URI
3. Ensure you're using Node.js 18 or higher
4. Clear your browser cache and localStorage

---

Built with ❤️ for music lovers everywhere
