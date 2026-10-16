'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import styles from './Sheet.module.css';

type SheetProps = {
  // The id of the sheet's title, for its accessible name.
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

// A bottom sheet on the native modal <dialog>: focus stays inside, Escape and the backdrop close it,
// and the page behind is inert. Render it while open; unmount it to close.
export function Sheet({ labelledBy, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={labelledBy}
      data-region="base"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Clicks land on the dialog itself only outside the panel, on the backdrop.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={styles.panel}>
        <span className={styles.grabber} aria-hidden="true" />
        {children}
      </div>
    </dialog>
  );
}
