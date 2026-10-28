import { html } from '../vendor/preact-htm.js';
import { TYPES, ic } from '../lib/constants.js';
import { ResumePage } from '../components/ResumePage.js';
import { SwitchRow } from '../components/ui.js';

const { invoke } = window.__TAURI__.core;
const stop = e => e.stopPropagation();
// Refs fire before a new subtree is attached, so focus once it is in the page.
const focusOnce = el => {
  if (!el || el.dataset.f) return;
  el.dataset.f = '1';
  setTimeout(() => { el.focus(); el.select(); });
};

function Dialog({ app, width, children }) {
  return html`<div class="backdrop" onClick=${app.closeDlg}>
    <div class="dlg" style=${{ width: `min(${width}px,92%)` }} onClick=${stop}>${children}</div>
  </div>`;
}

export function AddSectionDialog({ app }) {
  const data = app.data();
  return html`<${Dialog} app=${app} width=${540}>
    <div class="dlg-hdr" style="justify-content:flex-end">
      <div class="t">Adicionar seção</div>
      <button class="close-btn" onClick=${app.closeDlg}>${ic('close')}</button>
    </div>
    <div class="dlg-body" style="padding:8px 22px 26px">
      <div class="sec-hint">Novas seções entram no final do documento.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">
        ${Object.keys(TYPES).map(k => {
          // Custom sections can repeat; every other type appears once.
          const used = k !== 'custom' && data.sections.some(x => x.type === k);
          return html`<button key=${k} class="add-type" style=${{ cursor: used ? 'default' : 'pointer', opacity: used ? 0.5 : 1 }} onClick=${() => { if (!used) app.addSection(k); }}>
            <div class="tile" style="width:30px;height:30px;background:rgba(var(--fg),.06)">${ic(TYPES[k].icon)}</div>
            <span class="ellipsis" style="flex:1;min-width:0">${TYPES[k].label}</span>
            <span style="font-size:12.5px;color:rgba(var(--fg),.5);display:flex">${used ? 'Adicionada' : ic('plus')}</span>
          </button>`;
        })}
      </div>
    </div>
  <//>`;
}

const join = (dir, file) => dir.replace(/[\\/]+$/, '') + (dir.includes('/') && !dir.includes('\\') ? '/' : '\\') + file;

export function ExportDialog({ app }) {
  const s = app.state; const res = app.curRes(); const data = res.data; const e = s.exp;
  const visible = data.sections.filter(x => x.visible).length;
  const docInfo = 'A4 · ' + s.pages + (s.pages === 1 ? ' página' : ' páginas');
  const setExp = patch => app.setState(st => ({ exp: { ...st.exp, ...patch } }));

  const changeFolder = async () => {
    const dir = await window.__TAURI__.dialog.open({ directory: true, defaultPath: e.folder, title: 'Pasta de destino' });
    if (dir) setExp({ folder: dir });
  };

  const doExport = async () => {
    if (e.busy) return;
    let file = (e.file || '').trim().replace(/[<>:"/\\|?*]/g, '_') || 'curriculo';
    if (!/\.pdf$/i.test(file)) file += '.pdf';
    const path = join(e.folder, file);
    setExp({ busy: true, prog: 0 });
    // The real job gives no progress; ease toward 90% until it finishes.
    const iv = setInterval(() => setExp({ prog: Math.min(0.9, app.state.exp.prog + 0.06) }), 80);
    try {
      await invoke('export_pdf', { path, resume: data, links: e.links });
      clearInterval(iv);
      setExp({ prog: 1 });
      app.setState(st => ({ dlg: null, exp: { ...st.exp, busy: false, file } }));
      if (e.open) invoke('open_file', { path }).catch(() => {});
      app.toast('PDF salvo em ' + path, 'Abrir pasta', () => { invoke('reveal_file', { path }).catch(() => {}); app.setState({ toast: null }); });
    } catch (err) {
      clearInterval(iv);
      setExp({ busy: false, prog: 0 });
      app.toast('Falha ao exportar: ' + err);
    }
  };

  return html`<${Dialog} app=${app} width=${480}>
    <div class="dlg-hdr" style="justify-content:space-between">
      <button class="btn" onClick=${app.closeDlg}>Cancelar</button>
      <div class="t">Exportar PDF</div>
      <button class="btn accent" style=${{ opacity: e.busy ? 0.5 : 1 }} onClick=${doExport}>Exportar</button>
    </div>
    <div class="dlg-body" style="padding:12px 22px 26px;gap:22px">
      <div style="display:flex;gap:16px;align-items:center">
        <div style="width:84px;height:119px;border-radius:4px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(var(--fg),.08),0 2px 6px rgba(var(--sh),.12);flex:none">
          <div style="zoom:0.1058;width:794px;pointer-events:none"><${ResumePage} resume=${data} /></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
          <div class="ellipsis" style="font-weight:700;font-size:17px">${res.name}</div>
          <div class="muted" style="font-size:13.5px">${docInfo}</div>
          <div class="muted" style="font-size:13.5px">${visible + ' de ' + data.sections.length + ' seções visíveis'}</div>
        </div>
      </div>
      <div class="group">
        <label class="field">
          <span>Nome do arquivo</span>
          <input value=${e.file} onInput=${ev => setExp({ file: ev.target.value })} />
        </label>
        <div class="row" style="min-height:56px;padding:8px 10px 8px 14px">
          <div class="muted">${ic('folder', 18)}</div>
          <div style="flex:1;min-width:0">
            <div class="flabel">Pasta</div>
            <div class="ellipsis" title=${e.folder}>${e.folder}</div>
          </div>
          <button class="btn sm" onClick=${changeFolder}>Alterar…</button>
        </div>
        <div class="row">
          <div style="flex:1">Papel</div>
          <div class="muted" style="font-size:14px">A4 · 210 × 297 mm</div>
        </div>
      </div>
      <div class="group">
        <${SwitchRow} label="Links clicáveis" sub="E-mail, LinkedIn, site e GitHub" on=${e.links} onClick=${() => setExp({ links: !e.links })} />
        <${SwitchRow} label="Abrir após exportar" on=${e.open} onClick=${() => setExp({ open: !e.open })} />
      </div>
      ${e.busy && html`<div style="display:flex;flex-direction:column;gap:8px">
        <div style="font-size:13.5px;color:rgba(var(--fg),.6)">Gerando PDF…</div>
        <div style="height:6px;border-radius:999px;background:rgba(var(--fg),.1);overflow:hidden">
          <div style=${{ height: '100%', width: Math.round(e.prog * 100) + '%', background: '#3584e4', borderRadius: '999px', transition: 'width .1s linear' }} />
        </div>
      </div>`}
    </div>
  <//>`;
}

export function AlertDialog({ app }) {
  const s = app.state; const al = s.alert || {};
  const done = { dlg: null, alert: null };
  let v;
  if (al.kind === 'reset') {
    v = {
      title: 'Redefinir aplicativo?', body: 'Todos os ' + s.resumes.length + ' currículo(s), pastas e preferências serão apagados permanentemente.',
      input: false, okLabel: 'Redefinir', bg: '#e01b24', ok: () => app.resetApp()
    };
  } else if (/Folder$/.test(al.kind)) {
    const k = al.kind; const f = s.folders.find(x => x.id === al.id);
    const n = f ? s.resumes.filter(r => r.folder === f.id).length : 0;
    const del = k === 'deleteFolder';
    v = {
      title: k === 'newFolder' ? 'Nova pasta' : del ? 'Excluir pasta?' : 'Renomear pasta',
      body: k === 'newFolder' ? 'Agrupe currículos por idioma, vaga ou área.' : del ? (n ? 'Os ' + n + ' currículo(s) de “' + f.name + '” vão para Sem pasta. Nenhum currículo é excluído.' : 'A pasta “' + (f ? f.name : '') + '” está vazia.') : 'Novo nome da pasta.',
      input: !del, okLabel: k === 'newFolder' ? 'Criar' : del ? 'Excluir' : 'Renomear', bg: del ? '#e01b24' : '#3584e4',
      ok: (val = app.state.renameVal) => {
        const name = val.trim();
        if (k === 'newFolder') { if (!name) return; const id = app.uid(); app.setState(st => ({ folders: [...st.folders, { id, name }], view: id, ...done })); }
        else if (del) app.setState(st => ({ folders: st.folders.filter(x => x.id !== al.id), resumes: st.resumes.map(r => r.folder === al.id ? { ...r, folder: null } : r), view: 'all', ...done }));
        else app.setState(st => ({ folders: st.folders.map(x => x.id === al.id ? { ...x, name: name || x.name } : x), ...done }));
      }
    };
  } else {
    const r = s.resumes.find(x => x.id === al.id);
    const del = al.kind === 'delete';
    v = {
      title: del ? 'Excluir currículo?' : 'Renomear currículo',
      body: del ? '“' + (r ? r.name : '') + '” será excluído permanentemente.' : 'O nome aparece só na lista de currículos.',
      input: !del, okLabel: del ? 'Excluir' : 'Renomear', bg: del ? '#e01b24' : '#3584e4',
      ok: (val = app.state.renameVal) => {
        if (del) app.setState(st => ({ resumes: st.resumes.filter(x => x.id !== al.id), ...done }));
        else app.setState(st => ({ resumes: st.resumes.map(x => x.id === al.id ? { ...x, name: val.trim() || x.name } : x), ...done }));
      }
    };
  }
  return html`<div class="backdrop" onClick=${app.closeDlg}>
    <div class="dlg" style="width:min(372px,92%);padding:28px 24px 24px;gap:12px;text-align:center" onClick=${stop}>
      <div style="font-weight:700;font-size:20px">${v.title}</div>
      <div style="font-size:15px;color:rgba(var(--fg),.7);text-wrap:pretty">${v.body}</div>
      ${v.input && html`<input value=${s.renameVal} ref=${focusOnce}
        onInput=${e => app.setState({ renameVal: e.target.value })}
        onKeyDown=${e => { if (e.key === 'Enter') v.ok(e.target.value); if (e.key === 'Escape') app.closeDlg(); }}
        style="height:38px;border:none;border-radius:8px;background:rgba(var(--fg),.06);padding:0 12px;font-size:15px;outline:2px solid rgba(53,132,228,.5);margin-top:4px" />`}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
        <button class="alert-btn btn" style="height:40px;border-radius:999px;justify-content:center;font-size:15px" onClick=${app.closeDlg}>Cancelar</button>
        <button class="alert-btn" style=${{ background: v.bg, color: '#fff' }} onClick=${() => v.ok()}>${v.okLabel}</button>
      </div>
    </div>
  </div>`;
}

export function Toast({ app }) {
  const t = app.state.toast;
  return html`<div class="toast" key=${t.k}>
    <span>${t.msg}</span>
    ${t.act && html`<button class="act" onClick=${() => t.act()}>${t.actLabel}</button>`}
    <button class="x" onClick=${() => app.setState({ toast: null })}>${ic('close')}</button>
  </div>`;
}
