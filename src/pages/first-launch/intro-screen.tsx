import { useRouter } from "expo-router";
import { useState } from "react";

import { FIRST_LAUNCH_COPY } from "@/constants/first-launch";
import { useFirstLaunch } from "@/contexts/first-launch-context";

import { FirstLaunchScaffold } from "./first-launch-scaffold";
import { IntroCommunityVisual } from "./intro-community-visual";
import { IntroEventsVisual } from "./intro-events-visual";
import { IntroPeopleVisual } from "./intro-people-visual";

const VISUALS = {
  1: <IntroPeopleVisual />,
  2: <IntroEventsVisual />,
  3: <IntroCommunityVisual />,
} as const;

type IntroStep = 1 | 2 | 3;

const NEXT_HREF = {
  1: "/(first-launch)/intro-2",
  2: "/(first-launch)/intro-3",
} as const;

export function IntroScreen({ step }: { step: IntroStep }) {
  const router = useRouter();
  const { markOnboardingSeen } = useFirstLaunch();
  const [isFinishing, setIsFinishing] = useState(false);
  const copy = FIRST_LAUNCH_COPY[`intro${step}`];

  const onPrimary = async () => {
    if (step !== 3) {
      router.push(NEXT_HREF[step]);
      return;
    }

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
    <FirstLaunchScaffold
      title={copy.title}
      subtitle={copy.subtitle}
      primaryLabel={copy.next}
      onPrimary={onPrimary}
      primaryLoading={isFinishing}
      visual={VISUALS[step]}
      progressStep={step}
      primaryHaptic={step === 3 ? "success" : "light"}
    />
  );
}
