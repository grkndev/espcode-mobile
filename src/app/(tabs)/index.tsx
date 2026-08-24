import Icons from "@/components/Icons";
import SafeAreaView from "@/components/SafeAreaView";
import { ShaderBackground } from "@/components/shader-background";
import Text from "@/components/Text";
import { Colors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background p-4 gap-8">
      <View className="absolute top-0 left-0 right-0 h-[150px]">
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
      <View className="flex-row items-center justify-between w-full">
        <Text weight="bold" className="text-2xl text-primary">
          espcode
        </Text>
        <TouchableOpacity className="p-2 rounded-full">
          <Icons name="IconBell" color={"#ffffff"} />
        </TouchableOpacity>
      </View>
      <View className="gap-4 flex-1">
        <Text weight="bold" className="text-primary text-3xl">
          Projelerim
        </Text>
        <TouchableOpacity className="bg-[#151A26] flex-row items-center gap-2 rounded-full p-4 border border-[#2A3239]">
          <Icons name="IconSearch" color={"#71717a"} size={18} />
          <Text className="text-zinc-500">Projelerde ara.</Text>
        </TouchableOpacity>
        <FlatList
          data={[1, 1, 1]}
          renderItem={() => <ProjectCard />}
          contentContainerClassName="gap-2"
          ListFooterComponent={
            <TouchableOpacity className="border border-zinc-800 border-dashed rounded-xl p-4 justify-center items-center flex-row gap-2">
              <Icons name="IconPlus" color={"#ffffff"} size={14} />
              <Text className="text-white text-sm" weight="bold">
                Yeni Proje
              </Text>
            </TouchableOpacity>
          }
          className="flex-1"
        />
      </View>
    </SafeAreaView>
  );
}

function ProjectCard() {
  return (
    <TouchableOpacity className="bg-[#12181D] border border-[#2A3239] p-4 rounded-xl gap-2">
      <View className="flex flex-row items-center justify-between">
        <Text className="text-zinc-600 text-sm">PRJ-001</Text>
        <View className="flex flex-row items-center justify-center gap-1">
          <Icons name="IconGitBranch" size={14} color={"#52525b"} />
          <Text className="text-zinc-600 text-sm">main</Text>
        </View>
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="text-primary text-2xl" weight="bold">
          test
        </Text>
        <View className="border border-purple-600 py-1 px-2 rounded-xl">
          <Text className="text-purple-600 text-xs" weight="semibold">
            ESP32-S3
          </Text>
        </View>
      </View>
      <View className="h-px bg-zinc-800" />
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row gap-2 ">
          <Text className="text-zinc-600 text-sm">12 sürüm</Text>
          <Text className="text-zinc-600 text-sm">·</Text>
          <Text className="text-zinc-600 text-sm">4 sa önce</Text>
        </View>
        <View className="flex flex-row items-center">
          <Text className="text-purple-600 text-sm" weight="bold">
            Aç
          </Text>
          <Icons name="IconChevronRight" color={"#9333ea"} size={16} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
