import type FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type {
  ComponentProps,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import type {
  PressableProps,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  TextInputProps,
  ViewStyle,
} from "react-native";

export type IconName = ComponentProps<typeof FontAwesome6>["name"];

export type UiTone = "dark" | "light";

// Button
export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  glow?: "default" | "subtle";
  haptic?: "light" | "medium" | "success";
  pressScale?: number;
  isLoading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
};

// Input
export type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: IconName;
  isPassword?: boolean;
  disabled?: boolean;
};

// SegmentedTabs
export type SegmentedTabOption<T extends string> = {
  key: T;
  label: string;
};

export type SegmentedTabsProps<T extends string> = {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (key: T) => void;
  disabled?: boolean;
  indicatorMotion?: "spring" | "timing";
};

// BottomSheet
export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** true ise altta Vazgeç butonu gösterilir (varsayılan: true) */
  showCancel?: boolean;
  /** Açık ekranlarda warm-white sheet yüzeyi kullanır. */
  tone?: UiTone;
}>;

// SelectField / SelectSheet
export type SelectOption<T extends string = string> = {
  key: T;
  label: string;
  description?: string;
  icon?: IconName;
  /** `SelectSheetGroup.key` ile eşleşir; sheet içi grup filtresinde kullanılır. */
  groupKey?: string;
};

/** Sheet içindeki hızlı filtre sekmesi (ör. spor kategorisi). */
export type SelectSheetGroup = {
  key: string;
  label: string;
};

export type SelectSheetVariant = "list" | "grid";

export type SelectSheetProps<T extends string = string> = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (key: T) => void;
  variant?: SelectSheetVariant;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Verilirse arama kutusunun altında "Tümü" + grup çipleri gösterilir. */
  groups?: SelectSheetGroup[];
  /** Grup çipi seçiliyken "Tümü" çipinin etiketi. */
  allGroupLabel?: string;
};

export type SelectFieldProps<T extends string = string> = {
  label: string;
  placeholder?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (key: T) => void;
  sheetTitle?: string;
  sheetSubtitle?: string;
  icon?: IconName;
  disabled?: boolean;
  sheetVariant?: SelectSheetVariant;
  searchable?: boolean;
  searchPlaceholder?: string;
  groups?: SelectSheetGroup[];
  allGroupLabel?: string;
};

// DatePickerSheet / DateField
export type DatePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: Date;
  onChange: (date: Date) => void;
  title?: string;
  minimumDate?: Date;
};

export type DateFieldProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
};

// BrandRefreshControl
export type BrandRefreshControlProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

// LinearRefreshBar
export type LinearRefreshBarProps = {
  visible: boolean;
};

// SportLoader
export type SportLoaderProps = {
  /** Halkanın piksel cinsinden çapı */
  size?: number;
  /** Alt etiket; boş string verilirse gizlenir */
  label?: string;
};

// BrandMark
export type BrandMarkProps = {
  className?: string;
  /** `light` = cream canvas (Home). Default stays dark for auth / first-launch. */
  tone?: UiTone;
};

// ScreenHeader
export type ScreenHeaderProps = {
  /** Ortalanmış mono başlık (örn. ETKİNLİK) */
  title?: string;
  /** true ise SPORTNER brand satırı */
  brand?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  /** `light` adapts brand/back chrome for the cream canvas. Default: dark. */
  tone?: UiTone;
};

// AppScreen
export type AppScreenProps = PropsWithChildren<{
  header?: ReactNode;
  belowHeader?: ReactNode;
  footer?: ReactNode;
  /** Floating tab bar için alt boşluk */
  withTabBar?: boolean;
  /** false ise ScrollView kullanılmaz (varsayılan: true) */
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Hero/media ekranlarında içeriği status bar arkasına uzatır. */
  edgeToEdgeTop?: boolean;
  /** Light ekran için opsiyonel premium zeytin gradient zemini. */
  backdrop?: "default" | "olive";
  /** `light` uses background.primary. Default stays legacy navy. */
  tone?: UiTone;
  /** Scroll listenin sonuna yaklaşılınca (sayfalama) tetiklenir. */
  onEndReached?: () => void;
  /** `onEndReached`'ın kaç piksel önce tetikleneceği (varsayılan 240). */
  onEndReachedThreshold?: number;
  /** Scroll'u dışarıdan sürmek için (ör. sohbette en alta inmek). */
  scrollRef?: RefObject<ScrollView | null>;
  /** İçerik yüksekliği değiştiğinde; layout sonrası scroll için güvenli nokta. */
  onContentSizeChange?: (width: number, height: number) => void;
}>;
