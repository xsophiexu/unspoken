# Unspoken

A word guessing game for grown-ups. Get your team to say the word on the card without saying any of the six banned words.

The interface follows the "Current interface · Decided" row of the Word Game Screens design canvas. The app opens straight into a game on the Current Version screen.

## Features

- Swipe the card right for Correct, left for Skip, with a timer ring around the card
- ··· menu to restart, change mode or change theme (Teal, Heather, Sage, Rose)
- New game setup: difficulty, theme, round timer and skips per round
- 2,289 cards across six difficulties (Normal, Harder, Expert 1, Expert 2, Master 1, Master 2) and seven themes, plus All cards. Defaults: Expert 1, All cards.
- Modes: Classic, Endless, Time attack and Zen. Teams, Escalate, Hot potato and Reverse are listed as coming soon.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` or `a` for a simulator, or `w` for the browser.

## Project layout

- `App.tsx` loads the font and switches between the play, setup and modes screens
- `src/screens/` holds those three screens
- `src/components/` has the timer ring and the ··· menu
- `src/data/word-banks.json` holds every card with its difficulty and theme. Add cards there.
- `src/game.ts` lists the difficulties and modes, and the default settings
- `src/theme.ts` has the four color themes
