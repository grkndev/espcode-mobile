import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SafeAreaView({ style, children, ...props }: ViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingTop: insets.top, paddingBottom: insets.bottom }, style]} {...props}>
      {children}
    </View>
  );
}
