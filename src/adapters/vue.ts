import { createAddonStand } from '../core/stand.js';
import type {
  StandOptions,
  StandMountContext,
  AddonStandInstance,
} from '../core/types.js';

export interface VueAppInstance {
  mount: (container: Element | string) => unknown;
  unmount: () => void;
  provide?: (key: unknown, value: unknown) => unknown;
  use?: (plugin: unknown, ...options: unknown[]) => unknown;
}

export type VueAppFactory<TState extends Record<string, unknown> = Record<string, unknown>> = (
  context: StandMountContext<TState>
) => VueAppInstance | Promise<VueAppInstance>;

export interface VueStandOptions<TState extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<StandOptions<TState>, 'mount'> {
  createApp: VueAppFactory<TState>;
}

export function defineVueAddonStand<TState extends Record<string, unknown> = Record<string, unknown>>(
  options: VueStandOptions<TState>
): AddonStandInstance<TState> {
  return createAddonStand<TState>({
    ...options,
    mount: async (context) => {
      const app = await options.createApp(context);
      app.mount(context.container);
      return () => {
        app.unmount();
      };
    },
  });
}
