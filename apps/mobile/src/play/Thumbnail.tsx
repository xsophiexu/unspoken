import { layout, resolveTheme, type ThemeSelection } from '@unspoken/design-tokens';
import { StyleSheet, View } from 'react-native';

import { previewModel } from './model';
import { PlayView } from './PlayView';

const { width: W, height: H } = layout.referenceScreen;
let sample: ReturnType<typeof previewModel> | null = null;

// A live miniature of the play screen in a style: the real PlayView at the reference size, scaled
// down, showing the sample round. Nothing in it responds to touch.
export function Thumbnail({ selection, width }: { selection: ThemeSelection; width: number }) {
  sample ??= previewModel();
  const scale = width / W;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { width, height: H * scale, borderRadius: layout.thumbnail.radius }]}
    >
      <View style={[styles.screen, { transform: [{ scale }] }]}>
        <PlayView theme={resolveTheme(selection)} model={sample} screen={layout.referenceScreen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  screen: { width: W, height: H, transformOrigin: 'top left' },
});
