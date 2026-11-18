import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, BottomSheet } from "@/components";
import { themeColors } from "@/constants/theme";
import { OrganizationImage } from "@/features/organizations/components/organization-image";
import { organizationRoleLabel } from "@/features/organizations/types";

type MenuAction = "edit" | "leave" | "transfer" | "delete";

function MenuRow({
  icon,
  title,
  subtitle,
  destructive = false,
  showDivider,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  destructive?: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <>
      {showDivider ? (
        <View className="ml-[62px] h-px bg-border-default" />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        className="flex-row items-center gap-3 px-3.5 py-3 active:opacity-70"
      >
        <View
          className={`h-9 w-9 items-center justify-center rounded-xl ${
            destructive ? "bg-destructive/15" : "bg-brand-primary/15"
          }`}
        >
          <FontAwesome6
            name={icon as never}
            size={15}
            color={
              destructive ? themeColors.destructive : themeColors.brand.primary
            }
          />
        </View>
        <View className="flex-1">
          <Text
            className={`font-body-bold text-body ${
              destructive ? "text-destructive" : "text-text-primary"
            }`}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="font-body text-caption text-text-tertiary"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        <FontAwesome6
          name="chevron-right"
          size={11}
          color={themeColors.text.tertiary}
        />
      </Pressable>
    </>
  );
}

export function OrganizationMenuSheet({
  visible,
  onClose,
  organizationName,
  imageUrl,
  myRole,
  canEdit,
  canLeave,
  canTransferFounder,
  canDelete,
  onEdit,
  onLeave,
  onTransferFounder,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  organizationName: string;
  imageUrl?: string | null;
  myRole?: number | null;
  canEdit: boolean;
  canLeave: boolean;
  canTransferFounder: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onLeave: () => void;
  onTransferFounder: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("organizations");
  // iOS, bir modal kapanırken açılan ikinci diyaloğu göstermiyor; ayrıl
  // onayı sheet tamamen kapandıktan sonra tetiklenir.
  const afterClose = useRef<MenuAction | null>(null);

  const choose = (action: MenuAction) => () => {
    if (afterClose.current) return;
    afterClose.current = action;
    onClose();
  };
  const rows = (
    items: {
      key: MenuAction;
      show: boolean;
      icon: string;
      title: string;
      subtitle: string;
      destructive?: boolean;
    }[],
  ) =>
    items
      .filter((item) => item.show)
      .map((item, index) => (
        <MenuRow
          key={item.key}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          destructive={item.destructive}
          showDivider={index > 0}
          onPress={choose(item.key)}
        />
      ));
  const mainRows = rows([
    {
      key: "edit",
      show: canEdit,
      icon: "pen",
      title: t("detail.menuEdit"),
      subtitle: t("detail.menuEditSubtitle"),
    },
    {
      key: "transfer",
      show: canTransferFounder,
      icon: "crown",
      title: t("detail.menuTransferFounder"),
      subtitle: t("detail.menuTransferFounderSubtitle"),
    },
  ]);
  const dangerRows = rows([
    {
      key: "leave",
      show: canLeave,
      icon: "arrow-right-from-bracket",
      title: t("detail.leaveOrganization"),
      subtitle: t("detail.menuLeaveSubtitle"),
      destructive: true,
    },
    {
      key: "delete",
      show: canDelete,
      icon: "trash",
      title: t("detail.deleteOrganization"),
      subtitle: t("detail.menuDeleteSubtitle"),
      destructive: true,
    },
  ]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onClosed={() => {
        const next = afterClose.current;
        afterClose.current = null;
        if (next === "leave") onLeave();
        else if (next === "edit") onEdit();
        else if (next === "transfer") onTransferFounder();
        else if (next === "delete") onDelete();
      }}
      title=""
      showCancel={false}
    >
      <View>
        <View className="mb-4 flex-row items-center gap-3">
          <OrganizationImage
            uri={imageUrl}
            name={organizationName}
            size={40}
            radius={12}
          />
          <View className="flex-1">
            <Text
              className="font-display text-heading-sm text-text-primary"
              numberOfLines={1}
            >
              {organizationName}
            </Text>
            {myRole != null ? (
              <Text
                className="text-caption text-text-tertiary"
                numberOfLines={1}
              >
                {organizationRoleLabel(myRole)}
              </Text>
            ) : null}
          </View>
        </View>
        {mainRows.length > 0 ? (
          <View className="overflow-hidden rounded-2xl bg-surface-secondary">
            {mainRows}
          </View>
        ) : null}
        {dangerRows.length > 0 ? (
          <View className="mt-3 overflow-hidden rounded-2xl bg-surface-secondary">
            {dangerRows}
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}
