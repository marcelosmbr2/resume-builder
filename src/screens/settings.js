import { html } from '../vendor/preact-htm.js';
import { ic } from '../lib/constants.js';
import { WinControls } from '../components/ui.js';

export function SettingsScreen({ app }) {
  const s = app.state;
  const kb = Math.max(1, Math.round(JSON.stringify(s.resumes).length / 1024));
  const storageInfo = s.resumes.length + (s.resumes.length === 1 ? ' currículo' : ' currículos') + ' · ' + kb + ' KB';
  const pick = async () => {
    const dir = await window.__TAURI__.dialog.open({ directory: true, defaultPath: s.saveDir, title: 'Pasta dos documentos' });
    if (dir) app.setSaveDir(dir);
  };

  return html`<div style="display:flex;flex-direction:column;height:100%;min-height:0">
    <div class="hdr" data-tauri-drag-region>
      <button class="ibtn" title="Voltar para Currículos" style="z-index:1" onClick=${() => app.setState({ screen: 'list' })}>${ic('back')}</button>
      <div class="hdr-title">Configurações</div>
      <div style="margin-left:auto"><${WinControls} /></div>
    </div>
    <div class="scroll" style="padding:36px 24px 60px">
      <div style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:32px">
        <div>
          <div class="sec-title tight">Armazenamento</div>
          <div class="sec-hint">Pasta onde os currículos e os PDFs exportados são salvos.</div>
          <div class="group">
            <div class="row" style="min-height:60px;padding:8px 10px 8px 14px">
              <div class="muted" style="display:flex">${ic('folder', 18)}</div>
              <label style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;cursor:text">
                <span class="flabel">Pasta dos documentos</span>
                <input class="finput" value=${s.saveDir} style="font-variant-ligatures:none"
                  onChange=${e => app.setSaveDir(e.target.value)}
                  onKeyDown=${e => { if (e.key === 'Enter') e.target.blur(); }} />
              </label>
              <button class="btn sm" onClick=${pick}>Escolher…</button>
            </div>
            <div class="row">
              <div style="flex:1">Espaço usado</div>
              <div class="muted" style="font-size:14px">${storageInfo}</div>
            </div>
          </div>
        </div>
        <div>
          <div class="sec-title" style="margin-bottom:10px">Redefinir</div>
          <div class="group">
            <div class="row" style="padding:12px 14px;gap:16px">
              <div style="flex:1;min-width:0">
                <div>Redefinir aplicativo</div>
                <div class="muted" style="font-size:13px;margin-top:2px;text-wrap:pretty">Apaga todos os currículos, pastas e preferências. Não é possível desfazer.</div>
              </div>
              <button class="btn danger" onClick=${() => app.setState({ dlg: 'alert', alert: { kind: 'reset' } })}>Redefinir…</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
