import type {
  StandContext,
  StandTheme,
  ViewportDefinition,
  CustomControl,
  StandScenario,
} from './types.js';
import { renderCustomControl, type ControlHandle } from './controls.js';

export interface StandToolbarOptions<TState extends Record<string, unknown> = Record<string, unknown>> {
  title?: string | undefined;
  viewports: ViewportDefinition[];
  controls?: Array<CustomControl<TState>> | undefined;
  scenarios?: Array<StandScenario<TState>> | undefined;
  context: StandContext<TState>;
}

export class StandToolbar<TState extends Record<string, unknown> = Record<string, unknown>> {
  public readonly element: HTMLElement;
  private readonly context: StandContext<TState>;
  private readonly viewportButtons = new Map<string, HTMLButtonElement>();
  private readonly themeButtons = new Map<StandTheme, HTMLButtonElement>();
  private readonly controlHandles: Array<ControlHandle<TState>> = [];
  private scenarioSelect: HTMLSelectElement | null = null;

  constructor(options: StandToolbarOptions<TState>) {
    this.context = options.context;
    this.element = document.createElement('header');
    this.element.className = 'vfa-stand-toolbar';

    // 1. Brand / Extension Title
    const brand = document.createElement('div');
    brand.className = 'vfa-stand-brand';
    brand.innerHTML = `<span>${options.title ?? 'Addon Stand'}</span><span class="vfa-stand-badge">Dev</span>`;
    this.element.appendChild(brand);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'vfa-stand-controls';

    // 2. Viewport Group
    const viewportGroup = document.createElement('div');
    viewportGroup.className = 'vfa-stand-btn-group';
    const vpLabel = document.createElement('span');
    vpLabel.className = 'vfa-stand-label';
    vpLabel.textContent = 'View:';
    viewportGroup.appendChild(vpLabel);

    for (const vp of options.viewports) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vfa-stand-btn';
      btn.textContent = vp.label;
      btn.addEventListener('click', () => this.context.setViewport(vp.id));
      viewportGroup.appendChild(btn);
      this.viewportButtons.set(vp.id, btn);
    }
    controlsContainer.appendChild(viewportGroup);

    // 3. Theme Group
    const themeGroup = document.createElement('div');
    themeGroup.className = 'vfa-stand-btn-group';
    const thLabel = document.createElement('span');
    thLabel.className = 'vfa-stand-label';
    thLabel.textContent = 'Theme:';
    themeGroup.appendChild(thLabel);

    const themes: StandTheme[] = ['light', 'dark'];
    for (const th of themes) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vfa-stand-btn';
      btn.textContent = th.charAt(0).toUpperCase() + th.slice(1);
      btn.addEventListener('click', () => this.context.setTheme(th));
      themeGroup.appendChild(btn);
      this.themeButtons.set(th, btn);
    }
    controlsContainer.appendChild(themeGroup);

    // 4. Scenario Switcher (if scenarios are provided)
    if (options.scenarios && options.scenarios.length > 0) {
      const scenarioGroup = document.createElement('div');
      scenarioGroup.className = 'vfa-stand-btn-group vfa-stand-scenario-group';

      const scLabel = document.createElement('span');
      scLabel.className = 'vfa-stand-label';
      scLabel.textContent = 'Scenario:';
      scenarioGroup.appendChild(scLabel);

      this.scenarioSelect = document.createElement('select');
      this.scenarioSelect.className = 'vfa-stand-select';

      for (const sc of options.scenarios) {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.label;
        this.scenarioSelect.appendChild(opt);
      }

      this.scenarioSelect.addEventListener('change', () => {
        if (this.scenarioSelect) {
          this.context.activateScenario(this.scenarioSelect.value);
        }
      });

      scenarioGroup.appendChild(this.scenarioSelect);
      controlsContainer.appendChild(scenarioGroup);
    }

    // 5. Custom Controls Group (Project-specific buttons, selects, toggles, badges)
    if (options.controls && options.controls.length > 0) {
      const customGroup = document.createElement('div');
      customGroup.className = 'vfa-stand-btn-group vfa-custom-controls';

      for (const ctrl of options.controls) {
        const handle = renderCustomControl(ctrl, this.context);
        this.controlHandles.push(handle);
        customGroup.appendChild(handle.element);
      }
      controlsContainer.appendChild(customGroup);
    }

    // 6. Utility Group (DevTools, Storage Inspector & Re-mount)
    const utilsGroup = document.createElement('div');
    utilsGroup.className = 'vfa-stand-btn-group';

    if (this.context.toggleDevTools) {
      const devtoolsBtn = document.createElement('button');
      devtoolsBtn.type = 'button';
      devtoolsBtn.className = 'vfa-stand-btn';
      devtoolsBtn.textContent = 'DevTools (Alt+D)';
      devtoolsBtn.title = 'Toggle DevTools DOM Inspector';
      devtoolsBtn.addEventListener('click', () => this.context.toggleDevTools?.());
      utilsGroup.appendChild(devtoolsBtn);
    }

    const storageBtn = document.createElement('button');
    storageBtn.type = 'button';
    storageBtn.className = 'vfa-stand-btn';
    storageBtn.textContent = 'Storage';
    storageBtn.addEventListener('click', () => this.context.toggleStorageInspector());
    utilsGroup.appendChild(storageBtn);

    const reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.className = 'vfa-stand-btn';
    reloadBtn.textContent = '↺ Reload';
    reloadBtn.addEventListener('click', () => this.context.reload());
    utilsGroup.appendChild(reloadBtn);

    controlsContainer.appendChild(utilsGroup);
    this.element.appendChild(controlsContainer);

    this.update();
  }

  public update(): void {
    const { currentViewport, currentTheme, state } = this.context;

    for (const [vpId, btn] of this.viewportButtons.entries()) {
      btn.classList.toggle('active', vpId === currentViewport);
    }
    for (const [th, btn] of this.themeButtons.entries()) {
      btn.classList.toggle('active', th === currentTheme);
    }
    for (const handle of this.controlHandles) {
      handle.update(state);
    }
    if (this.scenarioSelect) {
      const activeSc = this.context.getActiveScenario();
      if (activeSc && this.scenarioSelect.value !== activeSc.id) {
        this.scenarioSelect.value = activeSc.id;
      }
    }
  }
}
