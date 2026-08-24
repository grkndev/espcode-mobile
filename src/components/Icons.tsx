import * as TablerIcons from "@tabler/icons-react-native";
import type { Icon, IconProps } from "@tabler/icons-react-native";

type IconsModule = typeof TablerIcons;

export type IconName = {
  [K in keyof IconsModule]: IconsModule[K] extends Icon ? K : never;
}[keyof IconsModule];

type Props = IconProps & {
  name: IconName;
};

export default function Icons({ name, ...props }: Props) {
  const IconComponent = TablerIcons[name];
  return <IconComponent {...props} />;
}
