import { Text as RNText, type TextProps } from "react-native";

const FONT_FAMILY = {
  light: "DMSans_300Light",
  regular: "DMSans_400Regular",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
} as const;

export type FontWeight = keyof typeof FONT_FAMILY;

type Props = TextProps & {
  weight?: FontWeight;
};

export default function Text({ weight = "regular", style, ...props }: Props) {
  return <RNText style={[{ fontFamily: FONT_FAMILY[weight] }, style]} {...props} />;
}
