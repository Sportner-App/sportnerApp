import { useRouter } from "expo-router";
import type { ComponentRef } from "react";
import { useRef, useState } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";

import { useFirstLaunchCopy } from "@/constants/first-launch";
import { useFirstLaunch } from "@/contexts/first-launch-context";

import { FirstLaunchScaffold } from "./first-launch-scaffold";
import { IntroCommunityVisual } from "./intro-community-visual";
import { IntroChatVisual } from "./intro-chat-visual";
import { IntroEventsVisual } from "./intro-events-visual";
import { IntroPeopleVisual } from "./intro-people-visual";

type IntroStep = 1 | 2 | 3 | 4;

const STEPS = [1, 2, 3, 4] as const;
const IS_IOS = Platform.OS === "ios";

export function IntroScreen({ step }: { step: IntroStep }) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const width = IS_IOS ? windowWidth : Math.round(windowWidth);
  const scrollRef = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const { markOnboardingSeen } = useFirstLaunch();
  const [isFinishing, setIsFinishing] = useState(false);

  const onPrimary = async () => {
    if (isFinishing) {
      return;
    }

    setIsFinishing(true);
    try {
      await markOnboardingSeen();
      router.replace("/(tabs)");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      bounces={false}
      disableIntervalMomentum
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: (step - 1) * width, y: 0 }}
      directionalLockEnabled
      className="flex-1 bg-background-primary"
      {...(IS_IOS
        ? {
            pagingEnabled: true,
            decelerationRate: "normal" as const,
          }
        : {
            pagingEnabled: false,
            snapToInterval: width,
            snapToAlignment: "start" as const,
            decelerationRate: "fast" as const,
            overScrollMode: "never" as const,
            nestedScrollEnabled: false,
          })}
    >
      {STEPS.map((currentStep) => {
        return (
          <IntroSlide
            key={currentStep}
            step={currentStep}
            width={width}
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
  isFinishing: boolean;
  onNext: () => void;
  onFinish: () => void;
};

function IntroSlide({
  step,
  width,
  isFinishing,
  onNext,
  onFinish,
}: IntroSlideProps) {
  const FIRST_LAUNCH_COPY = useFirstLaunchCopy();
  const copy = FIRST_LAUNCH_COPY[`intro${step}`];
  const skipLabel = FIRST_LAUNCH_COPY.skip;
  const isLastStep = step === 4;
  const visual =
    step === 1 ? (
      <IntroEventsVisual />
    ) : step === 2 ? (
      <IntroPeopleVisual />
    ) : step === 3 ? (
      <IntroChatVisual />
    ) : (
      <IntroCommunityVisual />
    );

  return (
    <View
      collapsable={false}
      style={{
        width,
        height: "100%",
        overflow: IS_IOS ? "visible" : "hidden",
      }}
    >
      <View style={{ flex: 1 }}>
        <FirstLaunchScaffold
          title={copy.title}
          subtitle={copy.subtitle}
          visual={visual}
          progressStep={step}
          primaryLabel={copy.next}
          onPrimary={isLastStep ? onFinish : onNext}
          primaryLoading={isLastStep ? isFinishing : undefined}
          secondaryLabel={skipLabel}
          onSecondary={onFinish}
          secondaryLoading={isFinishing}
          primaryHaptic={isLastStep ? "success" : "light"}
          embedded
        />
      </View>
    </View>
  );
}
