import {
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from "react-native-reanimated";

/** Adımlar arası yatay kayma; `direction` ileri için 1, geri için -1. */
const STEP_SHIFT = 20;
const ENTER_MS = 210;
const EXIT_MS = 160;

export function stepEntering(direction: { value: number }) {
  return (values: EntryAnimationsValues) => {
    "worklet";
    const shift = direction.value * STEP_SHIFT;
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateX: shift }],
        originX: values.targetOriginX,
        originY: values.targetOriginY,
      },
      animations: {
        opacity: withTiming(1, { duration: ENTER_MS }),
        transform: [{ translateX: withTiming(0, { duration: ENTER_MS }) }],
      },
    };
  };
}

export function stepExiting(direction: { value: number }) {
  return (values: ExitAnimationsValues) => {
    "worklet";
    const shift = -direction.value * STEP_SHIFT;
    return {
      initialValues: {
        opacity: 1,
        transform: [{ translateX: 0 }],
        originX: values.currentOriginX,
        originY: values.currentOriginY,
        width: values.currentWidth,
        height: values.currentHeight,
      },
      animations: {
        opacity: withTiming(0, { duration: EXIT_MS }),
        transform: [{ translateX: withTiming(shift, { duration: EXIT_MS }) }],
      },
    };
  };
}
