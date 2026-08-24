import Icons from "@/components/Icons";
import SafeAreaView from "@/components/SafeAreaView";
import { ShaderBackground } from "@/components/shader-background";
import Text from "@/components/Text";
import { TouchableOpacity, View } from "react-native";

export default function Enterance() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background p-4">
      <ShaderBackground className="absolute inset-0" active />

      <View className="flex-1 items-start justify-between">
        <Text weight="bold" className="text-3xl text-primary">
          espcode
        </Text>
        <View className="flex-col gap-4 mb-8">
          <View className="flex-col gap-4">
            <View className="flex-col gap-1">
              <Text weight="bold" className="text-4xl text-primary">
                Her an, Her yerde,
              </Text>
              <Text weight="bold" className="text-5xl text-primary">
                Yaz, Yükle ve Çalıştır.
              </Text>
            </View>
            <Text weight="regular" className="text-base text-secondary">
              ESP32 projelerin için derleme, flash, seri monitör ve versiyonlama
              ve daha fazla tek bir yerde
            </Text>
          </View>
          <TouchableOpacity className="bg-white rounded-3xl mt-4 p-4 items-center justify-center flex flex-row gap-1">
            <Icons
              name="IconBrandGithub"
              strokeWidth={2}
              size={20}
              color="black"
            />
            <Text weight="semibold" className="text-base">
              Github ile devam et
            </Text>
          </TouchableOpacity>
          <Text className="text-xs text-white/25 text-center">
            Giriş yaparak kullanım şartlarını kabul etmiş olursunuz.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
