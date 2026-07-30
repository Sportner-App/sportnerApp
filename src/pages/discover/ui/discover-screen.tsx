import { StyleSheet } from "react-native";

import { appTheme } from "@/shared/config/theme";
import { useAppTheme } from "@/shared/lib/get-theme";
import { Screen } from "@/shared/ui/screen";
import { SectionCard } from "@/shared/ui/section-card";
import { Text, View } from "@/shared/ui/themed";
import {
  BodyText,
  LabelText,
  MetricText,
  MonoLabel,
  PageTitle,
  SectionTitle,
} from "@/shared/ui/typography";

const metrics = [
  { label: "Haftalik sure", value: "4.8 sa" },
  { label: "Ortalama pace", value: "5:22/km" },
  { label: "Toparlanma", value: "%82" },
];

const goals = [
  { title: "10 km hazirligi", progress: "Yuzde 70 tamamlandi" },
  { title: "Uyku duzeni", progress: "Son 5 gecedir hedefte" },
  { title: "Su tuketimi", progress: "Gunluk 2.4 litre ortalama" },
];

export function DiscoverScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <PageTitle>Ilerleme ozeti</PageTitle>
        <BodyText>
          Performans, toparlanma ve hedeflerine ne kadar yaklastigini tek
          ekranda gor.
        </BodyText>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricItem}>
            <SectionCard style={{ backgroundColor: theme.surfaceRaised }}>
              <MetricText>{metric.value}</MetricText>
              <MonoLabel style={styles.metricLabel}>{metric.label}</MonoLabel>
            </SectionCard>
          </View>
        ))}
      </View>

      <SectionCard
        accentColor={theme.cardAccent}
        style={{ backgroundColor: theme.cardHighlight }}
      >
        <LabelText>En guclu alan</LabelText>
        <Text style={styles.highlightTitle}>
          Dayaniklilik ivmesi yukseliyor
        </Text>
        <BodyText style={styles.highlightText}>
          Son 2 haftada toplam kosu hacmin yuzde 18 artti. Nabiz kontrolun ise
          stabil kaldigi icin artisi surdurebilirsin.
        </BodyText>
      </SectionCard>

      <View style={styles.sectionHeader}>
        <SectionTitle>Hedefler</SectionTitle>
        <MonoLabel>Bu ay</MonoLabel>
      </View>

      {goals.map((goal) => (
        <SectionCard key={goal.title}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <BodyText>{goal.progress}</BodyText>
        </SectionCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  metricItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  metricLabel: {
    marginTop: 6,
  },
  highlightTitle: {
    fontFamily: appTheme.fonts.displayMedium,
    fontSize: 28,
    lineHeight: 32,
    marginTop: 8,
  },
  highlightText: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  goalTitle: {
    fontFamily: appTheme.fonts.bodyStrong,
    fontSize: 16,
    marginBottom: 6,
  },
});
