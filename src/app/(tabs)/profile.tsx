import Icons from "@/components/Icons";
import SafeAreaView from "@/components/SafeAreaView";
import { ShaderBackground } from "@/components/shader-background";
import Text from "@/components/Text";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, View } from "react-native";

const membershipBenefits = {
  free: ["10 projects", "15 Version/Project", "Compile, Flash, Serial Monitor"],
  plus: [
    "20 projects",
    "30 Version/Project",
    "Use Plotter",
    "Download .bin file",
    "Link to Github",
    "Access limited ESP32 Tools",
  ],
  pro: [
    "Unlimited projects",
    "Unlimited Version/Project",
    "Use Plotter",
    "Download .bin file",
    "Link to Github",
    "Access all ESP32 Tools",
  ],
};
export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 flex flex-col p-4 gap-4">
      <View className="absolute top-0 left-0 right-0 h-[290px] overflow-hidden">
        <ShaderBackground active={true} />
        <LinearGradient
          className="absolute inset-0"
          colors={[
            "rgba(13,17,20,.4)",
            "rgba(13,17,20,.15)",
            "rgba(13,17,20,.75)",
            Colors.dark.background,
          ]}
          locations={[0, 0.4, 0.78, 1]}
          pointerEvents="none"
        />
      </View>

      <View className=" flex-1 mt-16 gap-8">
        <View className="flex flex-col items-center gap-4">
          <Image
            source={{
              uri: "https://avatars.githubusercontent.com/u/69747065?v=4",
            }}
            contentFit="contain"
            loading="lazy"
            style={{
              width: 84,
              height: 84,
              borderRadius: 9999,
            }}
          />
          <View className="flex flex-row gap-1 items-center">
            <Icons name="IconBrandGithub" size={20} color={"#ffffff"} />
            <Text weight="bold" className="text-primary text-2xl">
              grkndev
            </Text>
          </View>
        </View>
        <View className="bg-[#12181D] gap-4 p-4 rounded-xl">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-secondary">Created at</Text>
            <Text className="text-primary">19 AĞU 2026</Text>
          </View>
          <View className="h-px bg-zinc-700" />
          <View className="flex flex-row items-center justify-between">
            <Text className="text-secondary">Project limit</Text>
            <Text className="text-primary">1 / 20</Text>
          </View>
          <View className="h-px bg-zinc-700" />
          <View className="flex flex-row items-center justify-between">
            <Text className="text-secondary">Membership</Text>
            <Text className="text-primary">Pro</Text>
          </View>
        </View>

        <View className="bg-[#12181D] gap-4 p-4 rounded-xl">
          <View className="flex flex-col gap-2 border-b border-zinc-700 pb-2">
            <Text className="text-secondary text-sm">Current subscription</Text>
            <Text weight="bold" className="text-primary text-3xl">
              Pro
            </Text>
          </View>
          <FlatList
            data={membershipBenefits.pro}
            renderItem={({ item, index }) => <BenefitComp benefit={item} />}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ gap: 6 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
function BenefitComp({ benefit }: { benefit: string }) {
  return (
    <View className="flex flex-row items-center gap-2">
      <Icons name="IconCheckFilled" color={"#8F8EFC"} size={20} />
      <Text weight="regular" className="text-primary">
        {benefit}
      </Text>
    </View>
  );
}
