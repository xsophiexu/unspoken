import { router } from 'expo-router';

// Back to the previous screen, or to the game when the screen was opened directly (a web link).
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Back to the game, closing every screen opened from it.
export function backToGame() {
  router.dismissTo('/');
}
