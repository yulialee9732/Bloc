# Focus Block Timer — Project Plan

## Overview
A cross-platform productivity app (iPhone + Mac) that tracks deep work sessions across customizable focus blocks, syncs in real time via Firebase, and surfaces live timers on the iPhone lock screen and Mac menu bar. Includes streaks, daily goals, session reflections, a unified stats screen with monthly productivity chart, live AI-powered analysis, and CSV export.

---

## Tech Stack

### iPhone App
- **React Native** (with Expo) — iPhone App Store + Mac via react-native-macos

- **React Native Live Activities** — lock screen timer display
- **Firebase SDK** — auth + real-time sync
- **Expo Notifications** — push notifications
- **React Navigation** — screen routing (3 tabs: Home, Planner, Stats)
- **React Native SF Symbols** — icon library integration
- **Victory Native** — charts (bar chart for stats screen)
- **Claude API** — AI analysis and insights

### Mac App
- **Electron** — cross-platform desktop app, direct download
- **Firebase SDK** — same backend, real-time sync
- **menubar (npm)** — tray/menu bar item with dropdown
- **node-mac-sound** — play sound on timer completion
- **canvas-confetti** — particle burst animations for ring completion
- **react-native-sound** — 3 selectable completion sounds (Soft Chime, Piano Note, Game Clear)
- **Recharts** — charts in full Mac window

### Backend
- **Firebase Authentication** — Sign in with Apple + Email/password
- **Firebase Firestore** — real-time database for blocks, sessions, habits, streaks, stats
- **Firebase Cloud Messaging (FCM)** — push notifications

---

## Project Structure

```
focus-block-timer/
├── mobile/                   # React Native (Expo) iPhone app
│   ├── app/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx           # Main timer UI (tab 1)
│   │   │   ├── PlannerScreen.tsx        # Weekly/daily planner (tab 2)
│   │   │   ├── WeekCalendarView.tsx     # 7-column week grid
│   │   │   ├── DayCalendarView.tsx      # Vertical time grid + daily add bar
│   │   │   ├── EditBlockScreen.tsx      # Edit block name/icon/color/duration/goal
│   │   │   ├── StatsScreen.tsx          # Unified weekly/monthly stats + AI analysis (tab 3)
│   │   │   ├── ReflectionModal.tsx      # Post-session reflection prompt
│   │   │   └── SettingsScreen.tsx       # Theme, auth, notifications, export
│   │   ├── components/
│   │   │   ├── BlockTimer.tsx           # Individual stopwatch card (with streak badge)
│   │   │   ├── HabitTracker.tsx         # Bottom habit row with streak counts
│   │   │   ├── StreakBadge.tsx          # Flame icon + count per block
│   │   │   ├── IconPicker.tsx           # SF Symbols search + select
│   │   │   ├── ColorThemePicker.tsx     # Theme selector
│   │   │   └── charts/
│   │   │       ├── DailyBarChart.tsx    # Total focus time per day (monthly view)
│   │   │       ├── WeeklyBarChart.tsx   # Per-block bars (weekly view)
│   │   │       └── BlockBreakdown.tsx   # Color-coded block split
│   │   ├── hooks/
│   │   │   ├── useBlocks.ts             # Block state + Firestore sync
│   │   │   ├── useTimer.ts              # Stopwatch logic
│   │   │   ├── useHabits.ts             # Habit tracker + streak calculation
│   │   │   └── useStats.ts              # Aggregated stats, live recalculation
│   │   ├── services/
│   │   │   ├── firebase.ts              # Firebase init
│   │   │   ├── auth.ts                  # Login logic
│   │   │   ├── notifications.ts         # Push notification setup
│   │   │   ├── analysis.ts              # Claude API — live AI insight generation
│   │   │   └── planner.ts               # Claude API — weekly generation + daily replan
│   │   │   └── export.ts                # CSV export logic
│   │   └── constants/
│   │       ├── themes.ts                # Curated color themes
│   │       └── defaultBlocks.ts         # Default 4 blocks
│   └── app.json
│
├── mac/                      # Electron Mac app
│   ├── src/
│   │   ├── main.ts                      # Electron main process
│   │   ├── tray.ts                      # Menu bar icon + dropdown
│   │   ├── windows/
│   │   │   └── MainWindow.tsx           # Full Mac app UI
│   │   ├── services/
│   │   │   ├── firebase.ts              # Firebase init (shared config)
│   │   │   ├── sound.ts                 # Completion sound + fanfare sounds
│   │   │   └── confetti.ts              # canvas-confetti ring + fullscreen effects
│   │   └── renderer/                    # React UI for full Mac window
│   │       └── screens/
│   │           ├── HomeScreen.tsx
│   │           └── StatsScreen.tsx      # Same stats/analysis, adapted for desktop
│   └── package.json
│
├── shared/                   # Shared types and utilities
│   ├── types.ts               # Block, Session, HabitEntry, StatsEntry, Streak interfaces
│   └── utils.ts               # Time formatting, color helpers, stat aggregators, CSV builder
│
└── firebase/
    ├── firestore.rules        # Security rules
    └── firestore.indexes.json
```

---

## Data Models (Firestore)

### `users/{userId}/blocks/{blockId}`
```ts
{
  id: string
  name: string           // e.g. "Learning"
  icon: string           // SF Symbol name e.g. "book.fill"
  color: string          // hex color
  duration: number       // in seconds e.g. 7200 = 2hrs
  dailyGoal: number      // minimum seconds to count as "hit" e.g. 3600 = 1hr
  order: number          // display order
  createdAt: timestamp
}
```

### `users/{userId}/sessions/{sessionId}`
```ts
{
  blockId: string
  date: string           // "YYYY-MM-DD"
  elapsed: number        // seconds spent
  completed: boolean     // true if hit 0
  reflection: string     // optional one-line note written after session
  startedAt: timestamp
  endedAt: timestamp
}
```

### `users/{userId}/habits/{date}`
```ts
{
  date: string           // "YYYY-MM-DD"
  entries: {
    [blockId]: boolean   // true = checked (auto or manual)
  }
  goalHit: {
    [blockId]: boolean   // true = daily goal seconds reached
  }
}
```

### `users/{userId}/streaks/{blockId}`
```ts
{
  blockId: string
  current: number        // current consecutive days hitting daily goal
  longest: number        // all-time longest streak
  lastHitDate: string    // "YYYY-MM-DD" — used to calculate if streak is still alive
  updatedAt: timestamp
}
```

### `users/{userId}/timerState/{blockId}`
```ts
{
  status: "running" | "paused" | "idle"
  elapsed: number        // seconds counted so far
  startedAt: timestamp   // when last resumed
  updatedAt: timestamp
}
```
> This collection drives real-time sync between iPhone and Mac.

### `users/{userId}/stats/{YYYY-MM}`
```ts
{
  month: string          // "YYYY-MM"
  dailyTotals: {
    [date: string]: number   // total seconds across all blocks that day
  }
  blockTotals: {
    [blockId: string]: number  // total seconds per block this month
  }
  updatedAt: timestamp
}
```
> Recalculated live every time a session ends. Drives the monthly chart without querying all sessions.

---

## Screens & Features

### iPhone

#### Home Screen
- List of all blocks as cards
- Each card shows: icon, name, stopwatch (counting up), progress ring, streak badge (🔥 N days)
- Active block highlighted with its color
- Tap card to start/pause
- Long press to edit block
- Bottom bar: habit tracker row — one dot per block, auto-fills on completion, shows streak count
- Top right: settings icon
- Floating + button to add new block

#### Reflection Modal (appears after session ends)
- Triggered automatically when a session is stopped or hits 0
- Single text input: "How did this session go?" (optional — can dismiss)
- Confirms habit check + shows streak update ("🔥 Streak: 4 days!")
- Saved to session document in Firestore
- Feeds into AI analysis

#### Stats Screen
- Toggle at top: **Weekly** / **Monthly**
- **Weekly view:**
  - Bar chart — one bar per day this week, colored by block breakdown
  - Summary row: total focus time, best day, most focused block
  - Habit completion rate this week per block (e.g. "Learning: 5/7 days 🔥12")
  - AI analysis panel (see below)
- **Monthly view:**
  - Bar chart — one bar per day this month, total focus time (all blocks combined)
  - Tap any bar to see block breakdown for that day
  - Summary row: total hours this month, daily average, longest streak
  - AI analysis panel (see below)
- **AI Analysis Panel** (live, updates after each session):
  - Simple stats line: "Best day: Tuesday · Total this month: 34h 20m · Top block: Portfolio"
  - Trend observation: "You focused 40% more in week 3 than week 1"
  - Behavioral insight: "Your Portfolio sessions drop on Thursdays — consider shifting to mornings"
  - Reflection summary: patterns from your session notes (if reflections are written)
  - Powered by Claude API, recalculates live as sessions complete

#### Edit Block Screen
- Change name (text input)
- Change duration (scroll picker — hours/minutes)
- Change daily goal (scroll picker — minimum time to count as a hit)
- Change icon (SF Symbols browser with search)
- Change color (from active color theme palette)
- Delete block

#### Settings Screen
- Account (logged in as / sign out)
- Color theme picker (curated themes)
- Notification preferences
- Export data as CSV (current month or all time)
- Completion sound selection: Soft Chime / Piano Note / Game Clear
- App version

### Mac

#### Menu Bar
- Shows: `[icon] [block name] [remaining time]` for the currently running block only
- If nothing running: shows app icon only
- Click opens dropdown:
  - Each block listed with start/pause button and streak badge
  - Divider
  - "Open [App Name]" button → opens full Mac window

#### Full Mac Window
- Same screens as iPhone adapted for desktop layout
- Home: block cards in a grid, stopwatch, habit tracker with streaks
- Stats: weekly/monthly chart + AI analysis panel side by side
- Real-time sync with iPhone

---

## AI Analysis — Logic Detail

The `analysis.ts` service listens to Firestore for session writes. On each new session end:

1. Pulls the last 30 days of `stats/{YYYY-MM}` documents
2. Pulls recent session reflections (last 14 days) if any exist
3. Builds a compact data summary (block names, daily totals, weekly totals, habit completion rates, streak lengths)
4. Sends to Claude API with a system prompt instructing it to return four things:
   - One stats line (best day, total, top block)
   - One trend sentence (week-over-week or pattern)
   - One actionable behavioral insight
   - One reflection pattern note (if reflection notes exist)
5. Streams the response into the AI panel in real time
6. Caches the last result in Firestore so it loads instantly on next open

---

## Streak Logic

- A streak increments when a block's `dailyGoal` seconds are reached on a given day
- Streak is calculated nightly: if `lastHitDate` is yesterday or today, streak is alive
- If a day is missed, streak resets to 0 but `longest` is preserved
- Streak badge shows on block card and habit tracker row
- Reflection Modal celebrates streak milestones (3, 7, 14, 30 days)

---

## CSV Export Format

Export includes one row per session:

```
date, block_name, elapsed_seconds, elapsed_formatted, completed, daily_goal_hit, reflection
2025-04-21, Learning, 7243, 2h 00m 43s, true, true, "Good focus, got through chapter 4"
2025-04-21, Portfolio, 3600, 1h 00m 00s, false, true, ""
```

Available from Settings screen on both iPhone and Mac. Exports as `.csv` file to Files app / Downloads folder.

---

## Color Themes

Each theme defines 4 coordinated colors (one per default block slot) plus a background and surface color.

| Theme | Block 1 | Block 2 | Block 3 | Block 4 |
|-------|---------|---------|---------|---------|
| **Forest** | #3B7A57 | #6B9E78 | #A8C5A0 | #2D5A45 |
| **Ocean** | #1A6B8A | #2E9BB5 | #5BC8D8 | #0D4D6E |
| **Ember** | #C0392B | #E67E22 | #F1C40F | #8E44AD |
| **Slate** | #2C3E50 | #5D6D7E | #85929E | #1A252F |
| **Blossom** | #C0588A | #E88FB0 | #9B59B6 | #7D3C98 |
| **Moss** | #556B2F | #8FBC8F | #6B8E23 | #3B5323 |

User can assign any color from the active theme to any block.

---

## Build Phases

### Phase 1 — Core (build first)
- [ ] Firebase project setup
- [ ] Auth (email + Apple Sign In)
- [ ] Block CRUD (create, edit, delete, daily goal)
- [ ] Stopwatch logic with Firestore sync
- [ ] iPhone home screen UI
- [ ] Habit tracker (auto + manual) with streak badges
- [ ] Streak calculation logic + Firestore streaks collection
- [ ] Reflection modal (post-session)
- [ ] Mac menu bar with timer display and streak badge
- [ ] Mac dropdown (start/pause controls)
- [ ] Sound on Mac at completion
- [ ] Push notification on iPhone at completion
- [ ] Control Center widget on iPhone (start/pause active block)

### Phase 2 — Stats & Analysis
- [ ] Session aggregation into stats documents (live on session end)
- [ ] Stats screen — weekly view with bar chart
- [ ] Stats screen — monthly view with daily bar chart
- [ ] Tap bar → block breakdown for that day
- [ ] AI analysis panel with Claude API integration (incl. reflection patterns)
- [ ] Stats screen on Mac (desktop layout)

### Phase 3 — Polish
- [ ] Single ring confetti burst + chime sound (Mac)
- [ ] All-rings fullscreen fanfare + sound (Mac)
- [ ] Haptic feedback on ring completion (iPhone)
- [ ] canvas-confetti integration (Mac)
- [ ] Live Activity on iPhone lock screen
- [ ] SF Symbols icon picker with search
- [ ] Color theme switcher
- [ ] CSV export (Settings screen, iPhone + Mac)
- [ ] Offline support (local cache)
- [ ] Streak milestone celebrations in Reflection Modal

### Phase 4 — Distribution
- [ ] Mac: code signing for direct download (free with Xcode)
- [ ] iPhone: App Store submission ($99 Apple Developer account)
- [ ] App Store assets (screenshots, description, icon)

---

## Setup Requirements (one time)

### Tools to install
- Node.js 18+
- Expo CLI — `npm install -g expo`
- EAS CLI — `npm install -g eas-cli` (for App Store builds)
- Xcode (Mac App Store, free) — required for iOS simulator + Mac builds
- CocoaPods — `sudo gem install cocoapods`

### Firebase setup
1. Go to console.firebase.google.com
2. Create new project
3. Enable Authentication (Email/Password + Apple)
4. Create Firestore database
5. Add iOS app + Mac app to Firebase project
6. Download `google-services.json` and `GoogleService-Info.plist`

### Claude API setup
1. Go to console.anthropic.com
2. Create an API key
3. Add to app environment variables as `ANTHROPIC_API_KEY`

---

## Decisions (all resolved)
| Question | Decision |
|----------|----------|
| Mac app architecture | **Electron** — separate desktop app, direct download, no App Store needed |
| History data retention | **Indefinite** — all session data kept forever |
| Completion sound | **User selectable** — 3 options in Settings: Soft Chime, Piano Note, Game Clear. Single block = chosen sound, all-blocks fanfare = extended version |
| App name | **Bloc** |

---

## Mac Home Screen — UI Design

### Block display
- Each block is shown as a **large circle** on the Mac home screen
- Inside each circle: block icon (large), block name, stopwatch time
- The circle border is a **progress ring** that fills with the block's color as elapsed time approaches the daily goal
- Ring track (unfilled portion) shown in a light tint of the block color
- No status text — running/paused state shown via play/pause icon only

### Play/pause control
- A small circular button at the bottom of each circle (inside the SVG)
- Shows a **pause icon** when the block is running
- Shows a **play icon** when paused or idle
- Clicking anywhere on the circle toggles the block
- Only one block can run at a time — starting one pauses any other running block

### Weekly habit tracker
- Displayed below the circles as a **table**
- Rows = blocks (+ any custom habits added)
- Columns = Mon through Sun, with Today highlighted
- Each cell is a **checkbox** — click to check/uncheck
- Checked cells fill with the block's own color
- "Stats & analysis →" button sits in the top-right of the section header, links to Stats screen
- "+ add habit" button below the table adds a new custom row

---

## Fanfare Effects — Ring Completion

### Single ring hits 100%
- **Animation:** confetti/particle burst radiates outward from that circle's ring
- Particles use the block's color palette
- Animation lasts ~1.5 seconds, does not interrupt the UI
- **Sound:** short celebratory chime (distinct from the regular timer completion sound)
- Triggers every time the ring hits 100%, not just once per day

### All rings complete (every block hits 100% on the same day)
- **Animation:** fullscreen confetti overlay covers the entire Mac window
- Multi-color particles using all block colors
- Overlay auto-dismisses after ~3 seconds OR user can click anywhere / press a key to dismiss
- **Sound:** a bigger, more triumphant fanfare sound (longer than the single-ring chime)
- Triggers every time all rings are completed on the same day

### Implementation notes
- Use `canvas-confetti` (npm) for the particle system — lightweight, no dependencies
- Single ring burst: origin point set to the center of the completed circle
- Fullscreen burst: multiple origin points spread across the window
- Sounds stored as local audio files in `mac/src/assets/sounds/`
  - `chime-single.mp3` — single block completion
  - `fanfare-all.mp3` — all blocks complete
- Both effects also play on iPhone (haptic feedback instead of sound for single ring, push notification + sound for all-complete)

---

## Planner — Full Specification

### Overview
An AI-powered daily/weekly planner built as a third tab inside Bloc (alongside Home and Stats). The user dumps tasks, events, and context as free text — the AI parses everything and generates a full calendar view for the week. Daily additions automatically trigger a replan.

### App navigation (3 tabs)
```
[ Home ]   [ Planner ]   [ Stats ]
```

---

### Weekly input flow

1. User opens Planner tab at the start of the week
2. A free-text input area is shown — user types everything in one go:
```
이번 주 할일:
- React 챕터 3, 4 끝내기 (각 2시간)
- 포트폴리오 navbar 완성
- 이력서 강남 스타트업 3곳 지원
- 수요일 치과 2시 강남역 (이동 30분)
- 목요일 친구 저녁 7시 홍대 (이동 40분)
기상 5:20, 산책 2시간 고정, 취침 9:30
```
3. User taps **"생성"** button
4. Claude API parses the text and generates a full Mon–Sun calendar plan
5. Result appears as a **calendar view** — each day shows color-coded time blocks

---

### Daily addition flow

1. Each day view has a **"+ 오늘 추가"** input bar at the top
2. User types anything: "오후에 편의점 다녀와야 해 30분" or "미팅이 4시로 바뀌었어"
3. AI re-plans that day's remaining schedule around the new item
4. Calendar updates immediately — affected blocks shift automatically

---

### AI replan triggers
- Weekly "생성" button → full week plan generated
- Daily addition submitted → that day replanned
- Event time change detected in text → that day replanned
- Any conflict detected → AI resolves by shifting lower-priority blocks

---

### Calendar view design

- **Week view** — Mon–Sun columns, time rows from wake time to sleep time
- **Day view** — tap any day to expand into full-day detail
- Each time block shows:
  - Color (matches block category or event type)
  - Icon + name
  - Time range
  - Short AI note (e.g. "이동 30분 포함", "에너지 높은 시간대")
- Block categories and colors:
  - Focus blocks → each block's own color (Learning = green, Portfolio = blue, etc.)
  - Fixed events → red (외부 일정)
  - Travel → amber (이동)
  - Meals → gray (식사 — time slot only, no menu)
  - Rest / personal → light gray

---

### AI planning rules (system prompt logic)

Claude API receives the user's raw text + these constraints every time:

1. **Fixed anchors first** — user-specified times (치과 2시) are locked, everything else fits around them
2. **Travel time** — if address is mentioned, add travel buffer before the event
3. **Focus blocks in peak hours** — schedule deep work (Learning, Portfolio) in the morning when possible
4. **Meal slots** — insert breakfast, lunch, dinner at natural times, no menu suggestion
5. **No back-to-back focus blocks** — always insert a short break between focus sessions
6. **Sleep boundary** — nothing scheduled after stated bedtime
7. **Wake routine** — always insert walk + prep time after stated wake time
8. **Conflict resolution** — lower-priority items (personal errands) shift before focus blocks

---

### Data models (Firestore additions)

#### `users/{userId}/plans/{weekId}`
```ts
{
  weekId: string           // "2025-W17"
  rawInput: string         // original free text the user typed
  generatedAt: timestamp
  days: {
    [date: string]: PlanDay  // "2025-04-21": { blocks: [...] }
  }
}
```

#### `PlanDay`
```ts
{
  date: string
  blocks: PlanBlock[]
  lastUpdatedAt: timestamp
  dailyAdditions: string[]   // raw text of each daily addition
}
```

#### `PlanBlock`
```ts
{
  id: string
  startTime: string        // "08:15"
  endTime: string          // "10:15"
  name: string
  category: "focus" | "meal" | "travel" | "event" | "rest"
  blockId?: string         // links to focus block if category = "focus"
  color: string
  note?: string            // AI-generated short note
  isFixed: boolean         // true = user specified exact time, cannot be moved
}
```

---

### New screens & components

#### iPhone — Planner tab
- **WeeklyInputScreen** — full-screen text area + "생성" button
- **WeekCalendarView** — horizontal scroll, 7 day columns, tap to expand
- **DayCalendarView** — vertical time grid, color blocks, "+ 오늘 추가" input bar at top
- **ReplanLoadingOverlay** — shown while Claude API is regenerating the plan

#### Mac — Planner tab
- **WeeklyInputPanel** — left sidebar text input + "생성" button
- **WeekCalendarView** — full-width 7-column grid
- **DayDetailPanel** — right panel, expands when day is clicked
- **DailyAddBar** — always-visible input bar at the top of the day detail

---

### Tech additions for Planner

#### iPhone
- `planner.ts` service — Claude API calls for weekly generation + daily replan
- `usePlan.ts` hook — Firestore plan state + optimistic UI updates
- `WeekCalendarView.tsx` — custom calendar grid component
- `DayCalendarView.tsx` — vertical time grid with drag-reorder (future)

#### Mac
- `planner.ts` service (same logic as mobile)
- `WeekCalendarView.tsx` — desktop calendar grid
- `DayDetailPanel.tsx` — expanded day view

---

### Phase additions

#### Phase 1 additions
- [ ] Planner tab added to app navigation (iPhone + Mac)
- [ ] Weekly input screen with free text area + "생성" button
- [ ] Claude API weekly plan generation
- [ ] Week calendar view (7 columns)
- [ ] Day calendar view (vertical time grid)
- [ ] Firestore plan storage

#### Phase 2 additions
- [ ] Daily addition input bar + same-day replan
- [ ] Event time change detection + auto replan
- [ ] Travel time calculation from address mention
- [ ] Conflict resolution logic
- [ ] Replan loading overlay

#### Phase 3 additions
- [ ] Week-over-week plan history
- [ ] Planner + Stats integration (did you follow the plan?)

