import type { MockChromeRuntime } from '../runtime/mock-chrome.js';

export type StandardViewportPreset = 'popup' | 'sidepanel' | 'overlay' | 'devtools' | 'fullscreen';
export type StandViewport = StandardViewportPreset;

export interface ViewportDefinition {
  id: string;
  label: string;
  width?: string | number | undefined;
  height?: string | number | undefined;
  maxWidth?: string | number | undefined;
  maxHeight?: string | number | undefined;
  borderRadius?: string | undefined;
  boxShadow?: string | undefined;
  dock?: 'center' | 'right' | 'bottom' | 'fill' | undefined;
}

export type StandTheme = 'light' | 'dark' | 'system';

export type CustomControl<TState extends Record<string, unknown> = Record<string, unknown>> =
  | {
      type: 'button';
      id: string;
      label: string;
      active?: boolean | ((state: TState) => boolean) | undefined;
      onClick: (context: StandContext<TState>) => void;
    }
  | {
      type: 'toggle';
      id: string;
      label: string;
      value: (state: TState) => boolean;
      onChange: (checked: boolean, context: StandContext<TState>) => void;
    }
  | {
      type: 'select';
      id: string;
      label: string;
      options: Array<{ label: string; value: string }>;
      value: (state: TState) => string;
      onChange: (value: string, context: StandContext<TState>) => void;
    }
  | {
      type: 'badge';
      id: string;
      label: string;
      value: (state: TState) => string | number;
      variant?: 'default' | 'success' | 'warning' | 'danger' | undefined;
    };

export interface StandMountContext<TState extends Record<string, unknown> = Record<string, unknown>> {
  container: HTMLElement;
  viewport: string;
  theme: StandTheme;
  runtime: MockChromeRuntime;
  state: TState;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  onStateChange: (listener: (state: TState) => void) => () => void;
  onThemeChange: (listener: (theme: StandTheme) => void) => () => void;
  onViewportChange: (listener: (viewport: string) => void) => () => void;
}

export type StandMountFunction<TState extends Record<string, unknown> = Record<string, unknown>> = (
  context: StandMountContext<TState>
) => void | (() => void) | Promise<void | (() => void)>;

export interface StandOptions<TState extends Record<string, unknown> = Record<string, unknown>> {
  target?: string | HTMLElement | undefined;
  title?: string | undefined;
  defaultViewport?: string | undefined;
  viewports?: ViewportDefinition[] | undefined;
  defaultTheme?: StandTheme | undefined;
  manifest?: Record<string, unknown> | undefined;
  initialStorage?: {
    local?: Record<string, unknown> | undefined;
    session?: Record<string, unknown> | undefined;
    sync?: Record<string, unknown> | undefined;
  } | undefined;
  initialState?: TState | undefined;
  controls?: Array<CustomControl<TState>> | undefined;
  devtools?: boolean | Record<string, unknown> | undefined;
  mount: StandMountFunction<TState>;
}

export interface StandContext<TState extends Record<string, unknown> = Record<string, unknown>> {
  state: TState;
  currentViewport: string;
  currentTheme: StandTheme;
  runtime: MockChromeRuntime;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  setViewport: (viewport: string) => void;
  setTheme: (theme: StandTheme) => void;
  reload: () => void;
  toggleStorageInspector: () => void;
  toggleDevTools?: () => void;
}

export interface AddonStandInstance<TState extends Record<string, unknown> = Record<string, unknown>> {
  destroy: () => void;
  reload: () => void;
  setViewport: (viewport: string) => void;
  setTheme: (theme: StandTheme) => void;
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  getState: () => TState;
  getContext: () => StandContext<TState>;
}
