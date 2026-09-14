import { useCallback, useRef } from "react";
import { View, type ScrollView } from "react-native";

/**
 * Scrolls a specific section into view inside an AppScreen's ScrollView. Built for notification
 * deep links landing on a long detail screen (e.g. "a question was asked on your event") that
 * would otherwise open at the top, leaving the user to scroll down and hunt for what the
 * notification was actually about.
 */
export function useScrollToSection(scrollRef: React.RefObject<ScrollView | null>) {
  const sectionRefs = useRef<Partial<Record<string, View | null>>>({});

  const registerSection = useCallback(
    (key: string) => (node: View | null) => {
      sectionRefs.current[key] = node;
    },
    [],
  );

  const scrollToSection = useCallback(
    (key: string, topOffset = 16) => {
      const node = sectionRefs.current[key];
      const scrollView = scrollRef.current;
      const scrollableNode = scrollView?.getNativeScrollRef?.();
      if (!node || !scrollView || !scrollableNode) {
        return;
      }

      node.measureLayout(
        scrollableNode as unknown as View,
        (_x: number, y: number) => {
          scrollView.scrollTo({ y: Math.max(y - topOffset, 0), animated: true });
        },
        () => undefined,
      );
    },
    [scrollRef],
  );

  return { registerSection, scrollToSection };
}
