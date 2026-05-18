import type { ComponentType, ReactNode } from 'react';

type StyleValue = Record<string, unknown> | false | null | undefined;
type StyleProp = unknown;

export type ColorSchemeName = 'light' | 'dark' | 'unspecified' | null | undefined;

export type TextProps = {
  children?: ReactNode;
  selectable?: boolean;
  style?: StyleProp;
  [key: string]: unknown;
};

export type ViewProps = {
  children?: ReactNode;
  style?: StyleProp;
  [key: string]: unknown;
};

export type PressableStateCallbackType = {
  pressed: boolean;
};

export type NativeScrollEvent = {
  contentOffset: {
    x: number;
    y: number;
  };
};

export type NativeSyntheticEvent<T> = {
  nativeEvent: T;
};

export type PressableProps = ViewProps & {
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp | ((state: PressableStateCallbackType) => StyleProp);
};

export type ScrollViewProps = ViewProps & {
  contentContainerStyle?: StyleProp;
  contentInsetAdjustmentBehavior?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
  decelerationRate?: 'normal' | 'fast' | number;
  horizontal?: boolean;
  pagingEnabled?: boolean;
  ref?: unknown;
  scrollEventThrottle?: number;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  snapToInterval?: number;
  onScroll?: unknown;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export type ActivityIndicatorProps = ViewProps & {
  color?: string;
  size?: 'small' | 'large' | number;
};

export type KeyboardAvoidingViewProps = ViewProps & {
  behavior?: 'height' | 'position' | 'padding';
};

export type TextInputProps = ViewProps & {
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: (value: string) => void;
};

export type ImageProps = ViewProps & {
  source?: unknown;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

export const View: ComponentType<ViewProps>;
export const Text: ComponentType<TextProps>;
export const TextInput: ComponentType<TextInputProps>;
export const Pressable: ComponentType<PressableProps>;
export const ScrollView: ComponentType<ScrollViewProps>;
export const Image: ComponentType<ImageProps>;
export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;
export const KeyboardAvoidingView: ComponentType<KeyboardAvoidingViewProps>;

type AnimatedValue = {
  setValue: (value: number) => void;
  interpolate: (config: {
    inputRange: number[];
    outputRange: (number | string)[];
    extrapolate?: 'clamp' | 'extend' | 'identity';
  }) => unknown;
};

type CompositeAnimation = {
  start: (callback?: () => void) => void;
};

export const Animated: {
  Value: new (value: number) => AnimatedValue;
  timing: (
    value: AnimatedValue,
    config: { toValue: number; duration?: number; useNativeDriver: boolean },
  ) => CompositeAnimation;
  spring: (
    value: AnimatedValue,
    config: { toValue: number; useNativeDriver: boolean; [key: string]: unknown },
  ) => CompositeAnimation;
  parallel: (animations: CompositeAnimation[]) => CompositeAnimation;
  sequence: (animations: CompositeAnimation[]) => CompositeAnimation;
  event: (args: unknown[], config?: { useNativeDriver?: boolean }) => unknown;
  ScrollView: ComponentType<ScrollViewProps>;
  View: ComponentType<ViewProps>;
};

export const StyleSheet: {
  absoluteFillObject: Record<string, unknown>;
  create<T extends Record<string, Record<string, unknown>>>(styles: T): T;
};

export const Platform: {
  OS: 'ios' | 'android' | 'web' | 'macos' | 'windows';
  select<T>(specifics: Partial<Record<'ios' | 'android' | 'web' | 'default', T>>): T;
};

export function useColorScheme(): ColorSchemeName;
export function useWindowDimensions(): { width: number; height: number; scale: number; fontScale: number };
