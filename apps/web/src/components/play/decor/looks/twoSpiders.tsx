import { HangingSpider, Web } from '../art';
import { Body, Room, Text, type DecorBodyProps, type LookDecor } from '../frame';
import styles from '../Decor.module.css';

// Two spiders (N25-cw02, CW8): a cobweb in the top right corner with two orange spiders hanging from
// it, the small one down beside the word; the banned words as rows with orange square bullets.

function TwoSpidersBody({ word, banned, swipeItem }: DecorBodyProps) {
  return (
    <Body look="twoSpiders">
      <Room view={[0, 100, 372, 196]} align="xMaxYMax">
        <Web x={372} y={100} size={196} spokes={7} rings={5} color="#8C7E6E" width={1.8} flip />
        <HangingSpider x={243.8} top={104} depth={178.3} scale={1} color="#F6A65A" thread="#8C7E6E" legWidth={2.6} />
        <HangingSpider x={330.4} top={104} depth={250.5} scale={0.48} color="#B86A2A" thread="#8C7E6E" legWidth={1.2} />
      </Room>
      <Text className={styles.twoSpidersText}>
        <div className={styles.besideSpider}>{swipeItem(word)}</div>
        {swipeItem(banned)}
      </Text>
    </Body>
  );
}

export const twoSpiders: LookDecor = { Body: TwoSpidersBody };
