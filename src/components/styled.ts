import { GLView as ExpoGLView } from "expo-gl";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";

export const LinearGradient = cssInterop(ExpoLinearGradient, { className: "style" });
export const GLView = cssInterop(ExpoGLView, { className: "style" });
