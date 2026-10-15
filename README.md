# Unspoken

A word guessing game for grown-ups. Get your team to say the word on the card without saying any of the six banned words.

**Play now, no setup:** https://claude.ai/artifact/SXDwUy3D3ZzAyVBZun3dq1 (works on any phone or computer browser)

The interface follows the "Current interface · Decided" row of the Word Game Screens design canvas. The app opens straight into an Endless game on the Current Version screen.

## Features

- Swipe the card right for Correct, left for Skip, with a timer ring around the card
- Tap the difficulty badge next to the mode name to switch level mid-game (starts a new game)
- ··· menu to restart, change settings or change colors (Teal, Heather, Sage, Rose)
- Change settings: tap a mode, then set difficulty, themes (pick several, or All cards), round timer and skips
- Cards show 5 banned words at Normal and Harder, 6 at the other levels
- The round timer defaults to 2:30 at Expert 1 and scales with difficulty, from 1:30 at Normal to 5:00 at Grandmaster. Type a time to override it.
- 5,017 cards across eight difficulties (Normal, Harder, Expert 1, Expert 2, Master 1, Master 2, Master 3, Grandmaster) and 17 themes, plus All cards. Every card has 10 banned words, strongest first, and some cards sit in two themes. All cards leaves out names, specific events and insider jargon (they stay in their themes) and balances the mix so niche themes come up less. Defaults: Expert 1, All cards.
- Modes: Classic, Endless, Time attack, Escalate, Hot potato, Reverse and Mind Reader. Endless is the default. Teams is coming soon.
  - **Escalate:** no clock. Starts with 4 banned words and adds one for every correct answer. Get 3 correct with all 10 showing to win.
  - **Endless:** no clock and no skip limit; the header counts correct and skipped words.
  - **Hot potato:** no timer to set. The hidden clock runs a random length; the shortest possible round grows with difficulty, from 0:45 at Normal to 2:30 at Grandmaster, and the longest is double that. Pass the phone after every word; whoever holds it when time runs out loses a point.
  - **Mind Reader:** three players, no timer. The Mind Reader sees the word and types 5 words they think the Clue Giver will say, then hands the phone over. The Clue Giver sees only the word and gives clues to the Guesser; the Mind Reader counts how many of their words get said.
  - **Reverse:** the guesser reads the banned words as clues and guesses the hidden word. Three clues show to start; each extra clue makes the word worth a point less.

## Ways to play

| You want to | Use | Needs a computer? |
| --- | --- | --- |
| Just play | [The web version](https://claude.ai/artifact/SXDwUy3D3ZzAyVBZun3dq1) | No |
| Test the app on your own phone while editing code | Expo Go | Yes, to run the dev server |
| Install the app on an Android phone | An APK from EAS Build | Only to start the build |
| Test on a virtual phone | Android emulator or iOS simulator | Yes, they run on the computer |

The Android emulator and iOS simulator are programs on a Mac or PC. They can't run on a phone. On a phone, use the web version, Expo Go, or an installed APK.

### 1. Play in a browser (no setup)

Open https://claude.ai/artifact/SXDwUy3D3ZzAyVBZun3dq1 on your phone or computer. On a phone, use your browser's **Add to Home Screen** for an app-like icon.

### 2. One-time computer setup (for every other option)

1. Install [Node.js](https://nodejs.org) (the LTS version).
2. Open a terminal and turn on pnpm: `corepack enable`
3. Get the code and install it:
   ```bash
   git clone https://github.com/xsophiexu/unspoken.git
   cd unspoken
   pnpm install
   ```

### 3. Your own phone with Expo Go (recommended for testing)

1. Install **Expo Go** on your phone from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. On the computer, in the `unspoken` folder, run:
   ```bash
   pnpm start
   ```
   A QR code appears in the terminal.
3. Scan it. On iPhone use the Camera app; on Android use the scanner inside Expo Go. The game opens and reloads whenever the code changes.

If your phone and computer are on different Wi-Fi networks, or the scan times out, run `pnpm start --tunnel` instead.

### 4. Install it on an Android phone (APK)

This builds a real app in Expo's cloud, so you don't need Android Studio.

1. Create a free account at [expo.dev](https://expo.dev/signup).
2. In the `unspoken` folder:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --platform android --profile preview
   ```
   The first build asks to create the project and an Android signing key; answer yes to both.
3. When the build finishes (it shows a link and a QR code), open the link on your Android phone, download the APK and install it. Android may ask you to allow installs from your browser.

iPhones can't install apps this way without an Apple Developer account; use the web version or Expo Go instead.

### 5. Web dev server on the computer

```bash
pnpm web
```

Opens the game at http://localhost:8081 and reloads as you edit. `pnpm build:web` makes a static copy in `dist/` that any web host can serve.

### 6. Android emulator (on the computer)

1. Install [Android Studio](https://developer.android.com/studio) and open it.
2. Go to **More Actions → Virtual Device Manager**, create a device (any recent Pixel) and press play to start it.
3. Add the Android tools to your PATH. On macOS add these lines to `~/.zshrc`, then open a new terminal:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```
   On Windows the SDK is at `%LOCALAPPDATA%\Android\Sdk`; add its `platform-tools` folder to PATH.
4. With the emulator running, in the `unspoken` folder:
   ```bash
   pnpm android
   ```
   Expo installs Expo Go on the emulator and opens the game.

### 7. iOS simulator (Mac only)

Install Xcode from the Mac App Store, open it once to finish setup, then run `pnpm ios`.

## Checks

```bash
pnpm lint        # ESLint (eslint-config-expo)
pnpm typecheck   # TypeScript
```

## Project layout

- `App.tsx` loads the font and switches between the play, setup and modes screens
- `src/screens/` holds the play screen (Classic, Endless, Time attack, Hot potato), the Reverse screen, New game setup and Modes
- `src/components/` has the header, timer ring, ··· menu and difficulty picker
- `src/data/word-banks.json` holds every card with its difficulty and theme. Add cards there.
- `src/game.ts` lists the difficulties and modes, the timer defaults and the default settings
- `src/theme.ts` has the four color themes
