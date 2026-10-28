import { html } from '../vendor/preact-htm.js';
import { ic } from '../lib/constants.js';
import { ResumePage } from '../components/ResumePage.js';
import { WinControls } from '../components/ui.js';

// Library screen: folders on the left, resume cards on the right.
export function ListScreen({ app }) {
  const s = app.state;
  const inF = s.folders.find(f => f.id === s.view);
  const inView = r => (s.view === 'all' ? true : s.view === 'none' ? !r.folder : r.folder === s.view);
  const shown = s.resumes.filter(inView);
  const folderTitle = s.view === 'all' ? 'Todos os currículos' : s.view === 'none' ? 'Sem pasta' : (inF ? inF.name : '');

  // `target` is the folder a dropped resume moves to; undefined = not a drop target.
  const nav = (id, name, icon, count, target) => {
    const over = s.dropOver === id;
    return html`<div key=${id} class="nav"
      onClick=${() => app.setState({ view: id, menuFor: null })}
      onDragOver=${e => { if (target === undefined || !s.dragRes) return; e.preventDefault(); if (s.dropOver !== id) app.setState({ dropOver: id }); }}
      onDragLeave=${() => { if (app.state.dropOver === id) app.setState({ dropOver: null }); }}
      onDrop=${e => { if (target === undefined) return; e.preventDefault(); app.moveTo(app.state.dragRes, target); }}
      style=${{ '--bg': over ? 'rgba(53,132,228,.16)' : s.view === id ? 'rgba(var(--fg),.1)' : 'transparent', boxShadow: over ? 'inset 0 0 0 2px rgba(53,132,228,.6)' : 'none', fontWeight: s.view === id ? 700 : 400 }}>
      <span style="color:rgba(var(--fg),.6);display:flex">${ic(icon)}</span>
      <span class="ellipsis" style="flex:1;min-width:0">${name}</span>
      <span style="font-size:13px;color:rgba(var(--fg),.5);font-variant-numeric:tabular-nums;font-weight:400">${count}</span>
    </div>`;
  };

  const newFolder = () => app.setState({ dlg: 'alert', alert: { kind: 'newFolder' }, renameVal: '' });

  return html`<div class="split">
    <div class="sidebar">
      <div data-tauri-drag-region style="height:47px;flex:none;display:flex;align-items:center;justify-content:flex-end;padding:0 6px;position:relative">
        <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;pointer-events:none">Currículos</div>
        <button class="ibtn" title="Nova pasta" onClick=${newFolder}>${ic('folderAdd')}</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:6px 8px 16px;display:flex;flex-direction:column;gap:2px">
        ${nav('all', 'Todos os currículos', 'docs', s.resumes.length)}
        ${nav('none', 'Sem pasta', 'inbox', s.resumes.filter(r => !r.folder).length, null)}
        <div style="font-size:12.5px;font-weight:700;color:rgba(var(--fg),.5);margin:16px 10px 6px">Pastas</div>
        ${s.folders.map(f => nav(f.id, f.name, 'folder', s.resumes.filter(r => r.folder === f.id).length, f.id))}
        <button class="nav-new" onClick=${newFolder}>${ic('plus')}Nova pasta</button>
      </div>
    </div>
    <div class="col">
      <div class="hdr" data-tauri-drag-region>
        <button class="btn ic" onClick=${app.newResume}>${ic('plus')}Novo</button>
        <div class="hdr-title">${folderTitle}</div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:4px">
          ${inF && html`<button class="ibtn" title="Opções da pasta" onClick=${() => app.setState({ menuFor: s.menuFor === 'folder' ? null : 'folder' })}>${ic('more')}</button>`}
          ${s.menuFor === 'folder' && inF && html`<div class="menu" style="right:110px;top:42px;width:190px">
            <button class="mi" onClick=${() => app.setState({ menuFor: null, dlg: 'alert', alert: { kind: 'renameFolder', id: inF.id }, renameVal: inF.name })}>Renomear pasta…</button>
            <button class="mi danger" onClick=${() => app.setState({ menuFor: null, dlg: 'alert', alert: { kind: 'deleteFolder', id: inF.id } })}>Excluir pasta…</button>
          </div>`}
          <button class="ibtn" title="Configurações" onClick=${() => app.setState({ screen: 'settings', menuFor: null })}>${ic('gear')}</button>
          <button class="ibtn" title=${app.isDark() ? 'Mudar para tema claro' : 'Mudar para tema escuro'} onClick=${app.toggleTheme}>${ic(app.isDark() ? 'sun' : 'moon')}</button>
          <${WinControls} />
        </div>
      </div>
      <div class="scroll" style="overflow:auto;padding:36px 40px 60px">
        <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,200px);gap:32px 28px">
          <button class="card-new" onClick=${app.newResume}>${ic('plus', 26)}Novo currículo</button>
          ${shown.map(r => html`<${ResumeCard} key=${r.id} app=${app} r=${r} />`)}
        </div>
        ${shown.length === 0 && s.view !== 'all' && html`<div style="max-width:1080px;margin:28px auto 0;font-size:14px;text-wrap:pretty" class="muted">Pasta vazia. Arraste um currículo até a pasta na barra lateral ou use “Mover para” no menu do currículo.</div>`}
      </div>
    </div>
  </div>`;
}

function ResumeCard({ app, r }) {
  const s = app.state;
  const folder = r.folder && s.folders.find(f => f.id === r.folder);
  const meta = (s.view === 'all' && folder ? folder.name + ' · ' : '') + 'Editado ' + app.rel(r.edited);
  const moves = [{ id: null, name: 'Sem pasta', icon: 'inbox' }, ...s.folders.map(f => ({ id: f.id, name: f.name, icon: 'folder' }))];
  const close = { menuFor: null };
  return html`<div style="display:flex;flex-direction:column;gap:10px;position:relative">
    <button class="thumb" draggable="true" style=${{ opacity: s.dragRes === r.id ? 0.4 : 1 }}
      onClick=${() => app.open(r.id)}
      onDragStart=${e => { e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; app.setState({ dragRes: r.id, menuFor: null }); }}
      onDragEnd=${() => app.setState({ dragRes: null, dropOver: null })}>
      <div style="zoom:0.2519;width:794px;pointer-events:none"><${ResumePage} resume=${r.data} /></div>
    </button>
    <div style="display:flex;align-items:flex-start;gap:6px">
      <div style="flex:1;min-width:0">
        <div class="ellipsis" style="font-weight:700">${r.name}</div>
        <div class="ellipsis muted" style="font-size:13px;margin-top:2px">${meta}</div>
      </div>
      <button class="more-btn" onClick=${() => app.setState({ menuFor: s.menuFor === r.id ? null : r.id })}>${ic('more')}</button>
    </div>
    ${s.menuFor === r.id && html`<div class="menu" style="right:0;bottom:44px;width:200px;max-height:calc(100vh - 140px);overflow-y:auto">
      <button class="mi" onClick=${() => app.open(r.id)}>Abrir</button>
      <button class="mi" onClick=${() => app.setState({ ...close, dlg: 'alert', alert: { kind: 'rename', id: r.id }, renameVal: r.name })}>Renomear…</button>
      <button class="mi" onClick=${() => app.duplicate(r)}>Duplicar</button>
      <div class="menu-sep" />
      <div class="menu-label">Mover para</div>
      ${moves.map(t => {
        const cur = (r.folder || null) === t.id;
        return html`<button key=${t.id || 'none'} class="mi" style=${{ opacity: cur ? 0.5 : 1 }} onClick=${() => app.moveTo(r.id, t.id)}>
          <span style="color:rgba(var(--fg),.55);display:flex">${ic(t.icon, 14)}</span>
          <span class="ellipsis" style="flex:1">${t.name}</span>${cur ? ic('check', 14) : null}
        </button>`;
      })}
      <div class="menu-sep" />
      <button class="mi danger" onClick=${() => app.setState({ ...close, dlg: 'alert', alert: { kind: 'delete', id: r.id } })}>Excluir…</button>
    </div>`}
  </div>`;
}
