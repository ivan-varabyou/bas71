import type { CustomControl, StandContext } from './types.js';

export interface ControlHandle<TState extends Record<string, unknown> = Record<string, unknown>> {
  element: HTMLElement;
  update: (state: TState) => void;
}

export function renderCustomControl<TState extends Record<string, unknown>>(
  control: CustomControl<TState>,
  context: StandContext<TState>
): ControlHandle<TState> {
  switch (control.type) {
    case 'button': {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vfa-stand-btn';
      btn.textContent = control.label;
      btn.addEventListener('click', () => control.onClick(context));

      return {
        element: btn,
        update: (state) => {
          const isActive =
            typeof control.active === 'function' ? control.active(state) : Boolean(control.active);
          btn.classList.toggle('active', isActive);
        },
      };
    }

    case 'toggle': {
      const wrapper = document.createElement('label');
      wrapper.className = 'vfa-stand-toggle-wrapper';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'vfa-stand-toggle-input';
      checkbox.checked = control.value(context.state);

      const labelText = document.createElement('span');
      labelText.className = 'vfa-stand-toggle-label';
      labelText.textContent = control.label;

      checkbox.addEventListener('change', () => {
        control.onChange(checkbox.checked, context);
      });

      wrapper.appendChild(checkbox);
      wrapper.appendChild(labelText);

      return {
        element: wrapper,
        update: (state) => {
          checkbox.checked = control.value(state);
        },
      };
    }

    case 'select': {
      const wrapper = document.createElement('div');
      wrapper.className = 'vfa-stand-select-wrapper';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'vfa-stand-label';
      labelSpan.textContent = control.label;

      const select = document.createElement('select');
      select.className = 'vfa-stand-select';

      for (const opt of control.options) {
        const optionEl = document.createElement('option');
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        select.appendChild(optionEl);
      }
      select.value = control.value(context.state);

      select.addEventListener('change', () => {
        control.onChange(select.value, context);
      });

      wrapper.appendChild(labelSpan);
      wrapper.appendChild(select);

      return {
        element: wrapper,
        update: (state) => {
          select.value = control.value(state);
        },
      };
    }

    case 'badge': {
      const badge = document.createElement('div');
      const variantClass = control.variant ? ` vfa-badge-${control.variant}` : '';
      badge.className = `vfa-stand-badge-widget${variantClass}`;
      badge.innerHTML = `<span class="vfa-badge-title">${control.label}:</span> <span class="vfa-badge-val">${control.value(context.state)}</span>`;

      return {
        element: badge,
        update: (state) => {
          const valEl = badge.querySelector('.vfa-badge-val');
          if (valEl) {
            valEl.textContent = String(control.value(state));
          }
        },
      };
    }
  }
}
