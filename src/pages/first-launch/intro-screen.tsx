import { useRouter } from "expo-router";
import type { ComponentRef } from "react";
import { useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { FIRST_LAUNCH_COPY } from "@/constants/first-launch";
import { useFirstLaunch } from "@/contexts/first-launch-context";

import { FirstLaunchScaffold } from "./first-launch-scaffold";

const IMAGES = {
  1: require("../../../assets/images/first-launch/intro-discover.png"),
  2: require("../../../assets/images/first-launch/intro-connect.png"),
  3: require("../../../assets/images/first-launch/intro-move.png"),
} as const;

type IntroStep = 1 | 2 | 3;

const STEPS = [1, 2, 3] as const;

export function IntroScreen({ step }: { step: IntroStep }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const scrollX = useSharedValue((step - 1) * width);
  const { markOnboardingSeen } = useFirstLaunch();
  const [isFinishing, setIsFinishing] = useState(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onPrimary = async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    try {
      await markOnboardingSeen();
      router.replace("/(auth)/login");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      bounces={false}
      decelerationRate="normal"
      disableIntervalMomentum
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: (step - 1) * width, y: 0 }}
      scrollEventThrottle={16}
      onScroll={onScroll}
      className="flex-1 bg-background-primary"
    >
      {STEPS.map((currentStep) => {
        return (
          <IntroSlide
            key={currentStep}
            step={currentStep}
            width={width}
            scrollX={scrollX}
            isFinishing={isFinishing}
            onNext={() => {
              scrollRef.current?.scrollTo({
                x: currentStep * width,
                animated: true,
              });
            }}
            onFinish={onPrimary}
          />
        );
      })}
    </Animated.ScrollView>
  );
}

type IntroSlideProps = {
  step: IntroStep;
  width: number;
  scrollX: SharedValue<number>;
  isFinishing: boolean;
  onNext: () => void;
  onFinish: () => void;
};

function IntroSlide({
  step,
  width,
  scrollX,
  isFinishing,
  onNext,
  onFinish,
}: IntroSlideProps) {
  const copy = FIRST_LAUNCH_COPY[`intro${step}`];
  const isLastStep = step === 3;
  const pageOffset = (step - 1) * width;

  const transitionStyle = useAnimatedStyle(() => {
    const distance = scrollX.value - pageOffset;

    return {
      opacity: interpolate(
        distance,
        [-width, 0, width],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateX: distance },
        {
          scale: interpolate(
            distance,
            [-width, 0, width],
            [0.88, 1, 0.88],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <View style={{ width }}>
      <Animated.View className="flex-1" style={transitionStyle}>
        <FirstLaunchScaffold
          title={copy.title}
          subtitle={copy.subtitle}
          image={IMAGES[step]}
          progressStep={step}
          primaryLabel={copy.next}
          onPrimary={isLastStep ? onFinish : onNext}
          primaryLoading={isLastStep ? isFinishing : undefined}
          primaryHaptic={isLastStep ? "success" : "light"}
        />
      </Animated.View>
    </View>
  );
}
