# Unspoken

A word guessing game for grown-ups. Get your team to say the word on the card without saying any of the six banned words.

**Play it in the browser:** https://claude.ai/artifact/SXDwUy3D3ZzAyVBZun3dq1

The interface follows the "Current interface · Decided" row of the Word Game Screens design canvas. The app opens straight into a game on the Current Version screen.

## Features

- Swipe the card right for Correct, left for Skip, with a timer ring around the card
- Tap the difficulty badge next to the mode name to switch level mid-game (starts a new game)
- ··· menu to restart, change settings or change colors (Teal, Heather, Sage, Rose)
- Change settings: tap a mode, then set difficulty, theme, round timer and skips
- The round timer defaults to 2:30 at Expert 1 and scales with difficulty, from 1:30 at Normal to 4:00 at Master 2. Type a time to override it.
- 2,289 cards across six difficulties (Normal, Harder, Expert 1, Expert 2, Master 1, Master 2) and seven themes, plus All cards. Defaults: Expert 1, All cards.
- Modes: Classic, Endless, Time attack, Hot potato, Zen and Reverse. Teams and Escalate are coming soon.
  - **Hot potato:** the clock is hidden and ends at a random point near the set time. Pass the phone after every word; whoever holds it when time runs out loses a point.
  - **Reverse:** the guesser reads the banned words as clues and guesses the hidden word. Three clues show to start; each extra clue makes the word worth a point less.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer and [pnpm](https://pnpm.io/installation) (`corepack enable` sets it up). Then:

```bash
git clone https://github.com/xsophiexu/unspoken.git
cd unspoken
pnpm install
```

### In the browser

```bash
pnpm web
```

This starts the Expo dev server and opens the game at http://localhost:8081. It reloads as you edit.

To build a static copy for hosting, run `pnpm build:web`. The site lands in `dist/`; serve it with any static file server, for example `npx serve dist`.

### Android emulator

1. Install [Android Studio](https://developer.android.com/studio). In **More Actions → Virtual Device Manager**, create a device (any recent Pixel with a recent system image) and start it.
2. Make sure `adb` is on your PATH. On macOS add these lines to your shell profile:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```
   On Windows the SDK is at `%LOCALAPPDATA%\Android\Sdk`.
3. With the emulator running:
   ```bash
   pnpm android
   ```
   Expo installs Expo Go on the emulator and opens the game.

### iOS simulator (macOS only)

Install Xcode from the Mac App Store, open it once to finish setup, then:

```bash
pnpm ios
```

### On your phone

Install **Expo Go** from the App Store or Google Play, run `pnpm start`, and scan the QR code (Camera app on iPhone, Expo Go on Android). Phone and computer need to be on the same Wi-Fi.

## Checks

```bash
pnpm lint        # ESLint (eslint-config-expo)
pnpm typecheck   # TypeScript
```

## Project layout

- `App.tsx` loads the font and switches between the play, setup and modes screens
- `src/screens/` holds the play screen (Classic, Endless, Time attack, Hot potato, Zen), the Reverse screen, New game setup and Modes
- `src/components/` has the header, timer ring, ··· menu and difficulty picker
- `src/data/word-banks.json` holds every card with its difficulty and theme. Add cards there.
- `src/game.ts` lists the difficulties and modes, the timer defaults and the default settings
- `src/theme.ts` has the four color themes
