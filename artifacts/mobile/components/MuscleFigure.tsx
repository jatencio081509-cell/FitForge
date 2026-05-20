import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Svg, { Path, Circle, Ellipse, G } from "react-native-svg";

export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "full_body";

interface Props {
  activeMuscles?: MuscleGroup[];
  onMusclePress?: (muscle: MuscleGroup) => void;
  primaryColor?: string;
  bodyColor?: string;
  size?: number;
}

const PRIMARY = "#00E6D2";
const BODY = "#25252C";
const OUTLINE = "#3A3A46";

export function MuscleFigure({
  activeMuscles = [],
  onMusclePress,
  primaryColor = PRIMARY,
  bodyColor = BODY,
  size = 200,
}: Props) {
  const scale = size / 200;
  const isActive = (m: MuscleGroup) => activeMuscles.includes(m) || activeMuscles.includes("full_body");
  const fill = (m: MuscleGroup) => isActive(m) ? primaryColor : bodyColor;
  const glow = (m: MuscleGroup) => isActive(m) ? primaryColor + "55" : "transparent";

  return (
    <View style={{ width: size * 2.2, alignItems: "center" }}>
      <View style={{ flexDirection: "row", gap: size * 0.1 }}>
        {/* FRONT VIEW */}
        <Svg width={size} height={size * 2.4} viewBox="0 0 100 240">
          {/* Head */}
          <Circle cx={50} cy={18} r={13} fill={bodyColor} stroke={OUTLINE} strokeWidth={1} />
          {/* Neck */}
          <Path d="M44,30 L56,30 L54,42 L46,42 Z" fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />

          {/* Shoulders */}
          <Pressable onPress={() => onMusclePress?.("shoulders")}>
            <Ellipse cx={28} cy={52} rx={12} ry={8} fill={fill("shoulders")} stroke={isActive("shoulders") ? primaryColor : OUTLINE} strokeWidth={isActive("shoulders") ? 1.5 : 0.8} />
            <Ellipse cx={72} cy={52} rx={12} ry={8} fill={fill("shoulders")} stroke={isActive("shoulders") ? primaryColor : OUTLINE} strokeWidth={isActive("shoulders") ? 1.5 : 0.8} />
          </Pressable>

          {/* Chest */}
          <Pressable onPress={() => onMusclePress?.("chest")}>
            <Path d="M38,42 Q50,38 62,42 L64,68 Q50,72 36,68 Z" fill={fill("chest")} stroke={isActive("chest") ? primaryColor : OUTLINE} strokeWidth={isActive("chest") ? 1.5 : 0.8} />
          </Pressable>

          {/* Core / Abs */}
          <Pressable onPress={() => onMusclePress?.("core")}>
            <Path d="M40,70 L60,70 L58,105 L42,105 Z" fill={fill("core")} stroke={isActive("core") ? primaryColor : OUTLINE} strokeWidth={isActive("core") ? 1.5 : 0.8} />
            {/* Abs lines */}
            <Path d="M41,82 L59,82" stroke={isActive("core") ? primaryColor : OUTLINE} strokeWidth={0.7} strokeDasharray="2,2" />
            <Path d="M41,94 L59,94" stroke={isActive("core") ? primaryColor : OUTLINE} strokeWidth={0.7} strokeDasharray="2,2" />
            <Path d="M50,70 L50,105" stroke={isActive("core") ? primaryColor : OUTLINE} strokeWidth={0.7} strokeDasharray="2,2" />
          </Pressable>

          {/* Arms */}
          <Pressable onPress={() => onMusclePress?.("arms")}>
            {/* Left arm */}
            <Path d="M16,46 L8,46 Q4,60 8,90 L18,90 Q22,60 16,46 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={isActive("arms") ? 1.5 : 0.8} />
            {/* Right arm */}
            <Path d="M84,46 L92,46 Q96,60 92,90 L82,90 Q78,60 84,46 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={isActive("arms") ? 1.5 : 0.8} />
            {/* Forearms */}
            <Path d="M8,90 L10,90 L14,120 L6,120 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={0.8} />
            <Path d="M92,90 L90,90 L86,120 L94,120 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={0.8} />
          </Pressable>

          {/* Hip / Pelvis */}
          <Path d="M38,104 L62,104 L64,115 L36,115 Z" fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />

          {/* Legs */}
          <Pressable onPress={() => onMusclePress?.("legs")}>
            {/* Left thigh */}
            <Path d="M37,114 L50,114 L48,175 L34,175 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={isActive("legs") ? 1.5 : 0.8} />
            {/* Right thigh */}
            <Path d="M50,114 L63,114 L66,175 L52,175 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={isActive("legs") ? 1.5 : 0.8} />
            {/* Left shin */}
            <Path d="M34,175 L48,175 L46,220 L32,220 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={0.8} />
            {/* Right shin */}
            <Path d="M52,175 L66,175 L68,220 L54,220 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={0.8} />
            {/* Knees */}
            <Ellipse cx={41} cy={178} rx={8} ry={5} fill={isActive("legs") ? primaryColor + "40" : OUTLINE} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={0.6} />
            <Ellipse cx={59} cy={178} rx={8} ry={5} fill={isActive("legs") ? primaryColor + "40" : OUTLINE} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={0.6} />
          </Pressable>

          {/* Hands */}
          <Ellipse cx={10} cy={125} rx={5} ry={7} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
          <Ellipse cx={90} cy={125} rx={5} ry={7} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
          {/* Feet */}
          <Ellipse cx={39} cy={225} rx={8} ry={5} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
          <Ellipse cx={61} cy={225} rx={8} ry={5} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
        </Svg>

        {/* BACK VIEW */}
        <Svg width={size} height={size * 2.4} viewBox="0 0 100 240">
          {/* Head */}
          <Circle cx={50} cy={18} r={13} fill={bodyColor} stroke={OUTLINE} strokeWidth={1} />
          {/* Neck */}
          <Path d="M44,30 L56,30 L54,42 L46,42 Z" fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />

          {/* Shoulders (back) */}
          <Pressable onPress={() => onMusclePress?.("shoulders")}>
            <Ellipse cx={28} cy={52} rx={12} ry={8} fill={fill("shoulders")} stroke={isActive("shoulders") ? primaryColor : OUTLINE} strokeWidth={isActive("shoulders") ? 1.5 : 0.8} />
            <Ellipse cx={72} cy={52} rx={12} ry={8} fill={fill("shoulders")} stroke={isActive("shoulders") ? primaryColor : OUTLINE} strokeWidth={isActive("shoulders") ? 1.5 : 0.8} />
          </Pressable>

          {/* Back (lats + traps) */}
          <Pressable onPress={() => onMusclePress?.("back")}>
            <Path d="M36,42 Q50,38 64,42 L66,100 Q50,106 34,100 Z" fill={fill("back")} stroke={isActive("back") ? primaryColor : OUTLINE} strokeWidth={isActive("back") ? 1.5 : 0.8} />
            {/* Spine line */}
            <Path d="M50,44 L50,100" stroke={isActive("back") ? primaryColor : OUTLINE} strokeWidth={0.8} strokeDasharray="2,2" />
            {/* Lat lines */}
            <Path d="M40,60 Q50,65 60,60" stroke={isActive("back") ? primaryColor : OUTLINE} strokeWidth={0.8} />
            <Path d="M38,75 Q50,80 62,75" stroke={isActive("back") ? primaryColor : OUTLINE} strokeWidth={0.8} />
          </Pressable>

          {/* Glutes / lower back */}
          <Pressable onPress={() => onMusclePress?.("core")}>
            <Path d="M36,100 L64,100 L62,115 L38,115 Z" fill={fill("core")} stroke={isActive("core") ? primaryColor : OUTLINE} strokeWidth={isActive("core") ? 1.5 : 0.8} />
          </Pressable>

          {/* Arms (back) */}
          <Pressable onPress={() => onMusclePress?.("arms")}>
            <Path d="M16,46 L8,46 Q4,60 8,90 L18,90 Q22,60 16,46 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={isActive("arms") ? 1.5 : 0.8} />
            <Path d="M84,46 L92,46 Q96,60 92,90 L82,90 Q78,60 84,46 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={isActive("arms") ? 1.5 : 0.8} />
            <Path d="M8,90 L10,90 L14,120 L6,120 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={0.8} />
            <Path d="M92,90 L90,90 L86,120 L94,120 Z" fill={fill("arms")} stroke={isActive("arms") ? primaryColor : OUTLINE} strokeWidth={0.8} />
          </Pressable>

          {/* Legs (back - hamstrings/glutes) */}
          <Pressable onPress={() => onMusclePress?.("legs")}>
            <Path d="M37,114 L50,114 L48,175 L34,175 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={isActive("legs") ? 1.5 : 0.8} />
            <Path d="M50,114 L63,114 L66,175 L52,175 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={isActive("legs") ? 1.5 : 0.8} />
            <Path d="M34,175 L48,175 L46,220 L32,220 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={0.8} />
            <Path d="M52,175 L66,175 L68,220 L54,220 Z" fill={fill("legs")} stroke={isActive("legs") ? primaryColor : OUTLINE} strokeWidth={0.8} />
          </Pressable>

          {/* Hands */}
          <Ellipse cx={10} cy={125} rx={5} ry={7} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
          <Ellipse cx={90} cy={125} rx={5} ry={7} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
          {/* Feet */}
          <Ellipse cx={39} cy={225} rx={8} ry={5} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
          <Ellipse cx={61} cy={225} rx={8} ry={5} fill={bodyColor} stroke={OUTLINE} strokeWidth={0.8} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
