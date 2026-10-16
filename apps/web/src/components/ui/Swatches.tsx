import { en } from '@unspoken/content';
import { COLOR_IDS, palettes, type ColorId } from '@unspoken/design-tokens';

import { cx } from '@/lib/ui';

import styles from './Swatches.module.css';

type SwatchesProps = { label: string; value: ColorId; onChange: (color: ColorId) => void };

// The seven color dots on Customize.
export function Swatches({ label, value, onChange }: SwatchesProps) {
  return (
    <div role="radiogroup" aria-label={label} className={styles.row}>
      {COLOR_IDS.map((id) => (
        <label key={id} className={cx(styles.swatch, id === value && styles.on)} style={{ color: palettes[id].swatch }} title={en.customize.colors[id]}>
          <input type="radio" name="color" className="visually-hidden" checked={id === value} onChange={() => onChange(id)} aria-label={en.customize.colors[id]} />
        </label>
      ))}
    </div>
  );
}
