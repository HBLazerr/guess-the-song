# Product Requirements Document (PRD)
## Project: LZRS Player — Spotify-Powered Song Guessing Game

---

## 1. Overview

**Purpose**  
LZRS Player is a minimalist web app where users test how fast they can identify songs by their favorite artists, albums, or genres. It integrates the **Spotify Web API** to fetch live audio previews and personalized data after user login.  
Built as a **portfolio and social project**, it’s designed to showcase engineering and design skill while being playable by **friends, followers, and LinkedIn connections** — not for monetization.  

**Vision**  
Deliver a sleek, music-centric experience demonstrating advanced front-end development, clean UI/UX, and modern Spotify API integration.  

**Goals**
- Demonstrate React, Spotify API, and animation expertise.  
- Enable authenticated users to quiz themselves on their own listening data.  
- Provide a link others can play for fun and share.  

---

## 2. Scope

### In-Scope (MVP)
- Spotify OAuth login with user’s own Spotify account  
- Artist / Album / Genre quiz selection  
- 10-round quiz flow with track previews  
- Time-based scoring system  
- Animated progress bar and dynamic soundwave  
- Responsive layout  
- Local session score tracking  

### MVP+ (Optional)
- Leaderboard using Firebase or Supabase  
- Persistent profile (scores and history)  
- Dark/Light mode toggle  

---

## 3. Target Audience
- Developers and recruiters evaluating your portfolio  
- Friends and LinkedIn followers testing their music knowledge  
- Music enthusiasts exploring an interactive trivia app  

---

## 4. User Experience (UX)

### Flow
1. **Login:** “Sign in with Spotify” required to play.  
2. **Mode Select:** Choose Artist, Album, or Genre.  
3. **Game Screen:**  
   - 10 rounds auto-progress.  
   - Each round plays a 30-second preview.  
   - Four multiple-choice answers shown.  
   - Timer and soundwave active.  
4. **Results:**  
   - Display total score, accuracy, and streaks.  
   - “Replay” and “Share” buttons at end.  

### Scoring
```
base_points = 100
time_bonus = remaining_time / total_time * 50
streak_bonus = streak * 10
total_score = base_points + time_bonus + streak_bonus
```

---

## 5. UI / Design System

### Theme
- **Primary:** #1DB954 (Spotify Green)  
- **Secondary:** #FFFFFF  
- **Background:** #121212  
- **Accent:** #535353  
- **Font:** Poppins / Inter  

### Style
- Minimal, dark, glass-morphic interface  
- Rounded corners, clean spacing  
- Animated transitions via Framer Motion  

### Layout
| Screen | Elements |
|---------|-----------|
| **Login** | Spotify button, short intro text |
| **Home** | Start Game, Mode Selector |
| **Game** | Soundwave animation, progress bar, answer buttons |
| **Results** | Score summary, replay/share |

---

## 6. Technical Architecture

### Frontend
- React + Vite  
- Tailwind CSS + shadcn/ui  
- Framer Motion for animation  
- Lucide React for icons  

### Backend / Services
| Purpose | Technology |
|----------|-------------|
| Auth | Spotify OAuth 2.0 (Sign in with Spotify) |
| API Data | Spotify Web API (user-specific data) |
| Optional storage | Firebase / Supabase for scores |

---

### Spotify Integration (Final Spec)
- **OAuth Login:** Users must sign into **their own Spotify accounts**.  
- **Access Token:** Obtained via OAuth 2.0 implicit or PKCE flow.  
- **Permissions:** `user-top-read`, `user-read-playback-position`, `streaming`.  
- **Data Fetched:**  
  - Top artists, albums, genres  
  - Song metadata (title, preview_url, cover)  
- **Security:** Tokens stored client-side, short-lived, no centralized account.  

---

## 7. Components Breakdown

| Component | Description |
|------------|-------------|
| `LoginScreen.tsx` | Spotify OAuth sign-in |
| `HomeScreen.tsx` | Mode selector, start button |
| `GameScreen.tsx` | Audio playback, timer, options |
| `ResultScreen.tsx` | Score, accuracy, replay |
| `SoundWave.tsx` | Animated waveform visualization |
| `useSpotify.ts` | Handles API calls and token management |
| `useGameLogic.ts` | Manages timer, scoring, round logic |

---

## 8. Data Models

### User
```
{
  id: string,
  name: string,
  email?: string,
  spotify_id: string,
  profile_img?: string,
  createdAt: timestamp
}
```

### GameSession
```
{
  sessionId: string,
  userId: string,
  mode: "artist" | "album" | "genre",
  totalRounds: 10,
  score: number,
  accuracy: number,
  createdAt: timestamp
}
```

---

## 9. Non-Functional Requirements
- First load under 2 seconds  
- Mobile-first responsive design  
- WCAG AA color contrast  
- Audio auto-pause when tab inactive  
- Graceful fallback for missing previews  

---

## 10. Future Enhancements
- Multiplayer (socket.io)  
- Playlist-specific quizzes  
- Achievements and shareable result cards  
- Adaptive difficulty (shorter previews, mixed genres)  
- Optional React Native port  

---

## 11. Deliverables
- Complete React + Vite source code  
- README with Spotify API setup instructions  
- OAuth redirect setup guide  
- Screenshots and short demo video for LinkedIn  
- Optional Firebase config for persistent scoring  

---

## 12. Success Metrics
- Functional login and Spotify integration.  
- 10-round game flow with scoring and animation.  
- Fully responsive and visually polished.  
- Playable link for friends, followers, and recruiters.  
