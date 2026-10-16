// What the play screen hands every round screen.
export type RoundScreenProps = {
  // A sheet or the How to play tour covers the round: no answers, no clock.
  blocked: boolean;
  sheetOpen: boolean;
  onMenu: () => void;
  onHeader: () => void;
  // Called before a link leaves the play screen.
  onLeave: () => void;
};
