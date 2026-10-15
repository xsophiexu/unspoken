# Unspoken

A word guessing game for grown-ups. Get your team to say the word on the card without saying any of the six banned words.

## Features

- Two decks: **Normal** (100 cards) and **Even Harder** (84 cards)
- Optional round timer (off, 60s, 90s, 120s)
- Correct and Skip buttons with a round summary at the end
- Light and dark mode

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` or `a` for a simulator.

## Project layout

- `App.tsx` switches between the home, play and results screens
- `src/screens/` holds the three screens
- `src/data/cards.ts` holds the card decks. Add cards there.
- `src/game.ts` has the deck list, timer options and shuffle
- `src/theme.ts` has the light and dark colors
