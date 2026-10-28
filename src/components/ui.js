import { html } from '../vendor/preact-htm.js';
import { ic } from '../lib/constants.js';

const tauriWindow = () => window.__TAURI__.window.getCurrentWindow();

// The window has no native frame, so every screen header draws these.
export function WinControls() {
  return html`<div class="wctl">
    <button title="Minimizar" onClick=${() => tauriWindow().minimize()}>${ic('min', 12)}</button>
    <button title="Maximizar" onClick=${() => tauriWindow().toggleMaximize()}>${ic('max', 12)}</button>
    <button title="Fechar" onClick=${() => tauriWindow().close()}>${ic('close', 12)}</button>
  </div>`;
}

export function Switch({ on, onClick, title }) {
  return html`<button class="sw" title=${title} onClick=${onClick} style=${{ background: on ? '#3584e4' : 'rgba(var(--fg),.2)' }}>
    <span style=${{ left: on ? '21px' : '3px' }} />
  </button>`;
}

export function Field({ label, value, onInput, placeholder, ...rest }) {
  return html`<label class="field">
    <span>${label}</span>
    <input value=${value} placeholder=${placeholder} onInput=${onInput} ...${rest} />
  </label>`;
}

export function SwitchRow({ label, sub, on, onClick }) {
  return html`<div class="row">
    <div style="flex:1">${sub ? html`<div>${label}</div><div style="font-size:13px" class="muted">${sub}</div>` : label}</div>
    <${Switch} on=${on} onClick=${onClick} />
  </div>`;
}
