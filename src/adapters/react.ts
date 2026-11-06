import { createAddonStand } from '../core/stand.js';
import type {
  StandOptions,
  StandMountContext,
  AddonStandInstance,
} from '../core/types.js';

export interface ReactRootLike {
  render: (children: unknown) => void;
  unmount: () => void;
}

export type ReactRootFactory = (container: Element) => ReactRootLike;

export type ReactNodeFactory<TState extends Record<string, unknown> = Record<string, unknown>> = (
  context: StandMountContext<TState>
) => unknown | Promise<unknown>;

export interface ReactStandOptions<TState extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<StandOptions<TState>, 'mount'> {
  createRoot: ReactRootFactory;
  render: ReactNodeFactory<TState>;
}

export function defineReactAddonStand<TState extends Record<string, unknown> = Record<string, unknown>>(
  options: ReactStandOptions<TState>
): AddonStandInstance<TState> {
  return createAddonStand<TState>({
    ...options,
    mount: async (context) => {
      const root = options.createRoot(context.container);
      const element = await options.render(context);
      root.render(element);
      return () => {
        root.unmount();
      };
    },
  });
}
