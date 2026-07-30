import { Circle, Line, Rect, Svg } from "react-native-svg";

import { FIELD_BG, FIELD_LINE } from "../model/field-constants";

export function renderSportField(
  sportType: string,
  width: number,
  height: number,
) {
  switch (sportType) {
    case "football":
      return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="24"
            fill={FIELD_BG}
          />
          <Rect
            x="18"
            y="18"
            width={width - 36}
            height={height - 36}
            rx="18"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Line
            x1={width / 2}
            y1="18"
            x2={width / 2}
            y2={height - 18}
            stroke={FIELD_LINE}
            strokeWidth="2"
          />
          <Circle
            cx={width / 2}
            cy={height / 2}
            r="38"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Rect
            x="18"
            y={height / 2 - 58}
            width="58"
            height="116"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Rect
            x={width - 76}
            y={height / 2 - 58}
            width="58"
            height="116"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
        </Svg>
      );
    case "basketball":
      return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="24"
            fill={FIELD_BG}
          />
          <Rect
            x="16"
            y="16"
            width={width - 32}
            height={height - 32}
            rx="20"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Line
            x1={width / 2}
            y1="16"
            x2={width / 2}
            y2={height - 16}
            stroke={FIELD_LINE}
            strokeWidth="2"
          />
          <Circle
            cx={width / 2}
            cy={height / 2}
            r="30"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Rect
            x="16"
            y={height / 2 - 52}
            width="94"
            height="104"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Rect
            x={width - 110}
            y={height / 2 - 52}
            width="94"
            height="104"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
        </Svg>
      );
    case "tennis":
    case "padel":
      return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="24"
            fill={FIELD_BG}
          />
          <Rect
            x="18"
            y="18"
            width={width - 36}
            height={height - 36}
            rx="18"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Line
            x1={width / 2}
            y1="18"
            x2={width / 2}
            y2={height - 18}
            stroke={FIELD_LINE}
            strokeWidth="2"
          />
          <Line
            x1={width * 0.2}
            y1={height / 2}
            x2={width * 0.8}
            y2={height / 2}
            stroke={FIELD_LINE}
            strokeWidth="2"
          />
          <Line
            x1={width * 0.2}
            y1="18"
            x2={width * 0.2}
            y2={height - 18}
            stroke={FIELD_LINE}
            strokeWidth="2"
            opacity="0.6"
          />
          <Line
            x1={width * 0.8}
            y1="18"
            x2={width * 0.8}
            y2={height - 18}
            stroke={FIELD_LINE}
            strokeWidth="2"
            opacity="0.6"
          />
          <Rect
            x={width / 2 - 2}
            y={height / 2 - 24}
            width="4"
            height="48"
            fill={FIELD_LINE}
          />
        </Svg>
      );
    case "volleyball":
      return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="24"
            fill={FIELD_BG}
          />
          <Rect
            x="20"
            y="20"
            width={width - 40}
            height={height - 40}
            rx="16"
            stroke={FIELD_LINE}
            fill="none"
            strokeWidth="2"
          />
          <Line
            x1={width / 2}
            y1="20"
            x2={width / 2}
            y2={height - 20}
            stroke={FIELD_LINE}
            strokeWidth="3"
          />
          <Line
            x1={width * 0.26}
            y1={height * 0.34}
            x2={width * 0.74}
            y2={height * 0.34}
            stroke={FIELD_LINE}
            strokeWidth="1.5"
            opacity="0.7"
          />
          <Line
            x1={width * 0.26}
            y1={height * 0.66}
            x2={width * 0.74}
            y2={height * 0.66}
            stroke={FIELD_LINE}
            strokeWidth="1.5"
            opacity="0.7"
          />
        </Svg>
      );
    case "table_tennis":
      return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="24"
            fill={FIELD_BG}
          />
          <Rect
            x="70"
            y="70"
            width={width - 140}
            height={height - 140}
            rx="16"
            stroke={FIELD_LINE}
            fill="rgba(21,34,56,0.7)"
            strokeWidth="2"
          />
          <Line
            x1={width / 2}
            y1="70"
            x2={width / 2}
            y2={height - 70}
            stroke={FIELD_LINE}
            strokeWidth="2"
          />
          <Line
            x1="70"
            y1={height / 2}
            x2={width - 70}
            y2={height / 2}
            stroke={FIELD_LINE}
            strokeWidth="3"
          />
          <Rect
            x={width / 2 - 3}
            y={height / 2 - 32}
            width="6"
            height="64"
            fill={FIELD_LINE}
          />
        </Svg>
      );
    default:
      return null;
  }
}
