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

export type PressableProps = ViewProps & {
  onPress?: () => void;
  style?: StyleProp | ((state: PressableStateCallbackType) => StyleProp);
};

export type ScrollViewProps = ViewProps & {
  contentContainerStyle?: StyleProp;
  contentInsetAdjustmentBehavior?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
  showsVerticalScrollIndicator?: boolean;
};

export const View: ComponentType<ViewProps>;
export const Text: ComponentType<TextProps>;
export const Pressable: ComponentType<PressableProps>;
export const ScrollView: ComponentType<ScrollViewProps>;

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
