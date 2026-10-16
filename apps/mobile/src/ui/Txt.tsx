import type { TextPart } from '@unspoken/core';
import { nativeTextStyle, type TextStyleName } from '@unspoken/design-tokens';
import { Text, type TextProps } from 'react-native';

type Props = TextProps & {
  // A text style from the design tokens.
  variant: TextStyleName;
  color: string;
  // Override the style's size (fitted words, a style's own header size).
  size?: number;
};

// Every piece of text in the app: a design-token text style in a region color.
export function Txt({ variant, color, size, style, ...rest }: Props) {
  return <Text {...rest} style={[nativeTextStyle(variant, size), { color }, style]} />;
}

type PartsProps = Omit<Props, 'children'> & {
  // A copy template and its values ("{mode} · {difficulty}") or pieces from pluralParts.
  parts: readonly TextPart[];
  // How the filled values read, by placeholder name.
  params: Readonly<Record<string, { variant: TextStyleName; color: string; size?: number }>>;
};

// A message whose filled values are styled apart from the words around them.
export function TxtParts({ parts, params, ...rest }: PartsProps) {
  return (
    <Txt {...rest}>
      {parts.map((part, i) => {
        const look = part.param ? params[part.param] : undefined;
        return look ? (
          <Txt key={i} variant={look.variant} color={look.color} size={look.size}>
            {part.text}
          </Txt>
        ) : (
          part.text
        );
      })}
    </Txt>
  );
}
