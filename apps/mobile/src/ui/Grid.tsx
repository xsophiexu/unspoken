import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

// Equal columns with a gap, without measuring: each cell takes 1/columns of the row.
export function Grid({ columns, gap, children }: { columns: number; gap: number; children: ReactNode }) {
  return (
    <View style={[styles.grid, { marginHorizontal: -gap / 2, rowGap: gap }]}>
      {Children.map(children, (child) =>
        child === null ? null : <View style={{ width: `${100 / columns}%`, paddingHorizontal: gap / 2 }}>{child}</View>,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
