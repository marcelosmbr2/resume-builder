import { html } from '../vendor/preact-htm.js';
import { TYPES, CONTACT, ic } from '../lib/constants.js';
import { ResumePage } from '../components/ResumePage.js';
import { WinControls, Switch, Field } from '../components/ui.js';

// Editor: a form pane (overview -> personal | section -> entry) beside the live A4 preview.
export function EditorScreen({ app }) {
  const s = app.state;
  const res = app.curRes();
  const data = res.data;
  const p = s.pane;
  const sec = p.sid ? data.sections.find(x => x.id === p.sid) : null;
  const ent = sec && p.page === 'entry' ? sec.entries.find(x => x.id === p.eid) : null;

  let paneTitle = res.name, backLabel = 'Voltar para Currículos', body = null;
  if (p.page === 'personal') { paneTitle = 'Dados pessoais'; backLabel = 'Voltar'; body = html`<${PersonalPane} app=${app} />`; }
  else if (p.page === 'section' && sec) { paneTitle = sec.title; backLabel = 'Voltar'; body = html`<${SectionPane} app=${app} sec=${sec} />`; }
  else if (ent) { paneTitle = ent.title || 'Nova entrada'; backLabel = 'Voltar para ' + sec.title; body = html`<${EntryPane} app=${app} sec=${sec} ent=${ent} />`; }
  else body = html`<${OverviewPane} app=${app} />`;

  const z = s.zoom == null ? s.fit : s.zoom;
  const docInfo = 'A4 · ' + s.pages + (s.pages === 1 ? ' página' : ' páginas');

  return html`<div class="split">
    <div style="width:clamp(320px,34%,400px);flex:none;display:flex;flex-direction:column;background:var(--win);border-right:1px solid rgba(var(--fg),.1);min-height:0;position:relative">
      <div data-tauri-drag-region style="height:47px;flex:none;display:flex;align-items:center;padding:0 6px;position:relative;border-bottom:1px solid rgba(var(--fg),.07)">
        <button class="ibtn" title=${backLabel} style="z-index:1" onClick=${app.back}>${ic('back')}</button>
        <div class="ellipsis" style="position:absolute;left:48px;right:48px;text-align:center;font-weight:700;pointer-events:none">${paneTitle}</div>
      </div>
      <div style="flex:1;overflow-y:auto;overflow-x:hidden;padding:22px 18px 40px;min-height:0">${body}</div>
      ${ent && html`<div style="position:absolute;left:0;right:0;bottom:0;padding:12px 18px 16px;background:linear-gradient(transparent,var(--win) 40%);display:flex;justify-content:center">
        <button class="done-btn" onClick=${app.back}>${ic('check')}Concluído</button>
      </div>`}
    </div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;background:var(--canvas)">
      <div class="hdr" data-tauri-drag-region style="padding:0 6px 0 12px">
        <div style="flex:1;min-width:90px;display:flex;flex-direction:column;line-height:1.2;pointer-events:none">
          <div class="ellipsis" style="font-weight:700">${res.name}</div>
          <div class="muted" style="font-size:12.5px;white-space:nowrap">${docInfo}</div>
        </div>
        <button class="btn ic" title="Adicionar seção" onClick=${() => app.setState({ dlg: 'addSection' })}>${ic('plus')}Seção</button>
        <button class="btn ic accent" onClick=${() => openExport(app)}>${ic('export')}Exportar PDF</button>
        <button class="ibtn" title=${app.isDark() ? 'Mudar para tema claro' : 'Mudar para tema escuro'} onClick=${app.toggleTheme}>${ic(app.isDark() ? 'sun' : 'moon')}</button>
        <${WinControls} />
      </div>
      <div style="flex:1;min-height:0;position:relative">
        <div ref=${app.previewRef} style="position:absolute;inset:0;overflow:auto;padding:32px">
          <div style=${{ width: 'fit-content', margin: '0 auto', zoom: z, boxShadow: '0 0 0 1px rgba(0,0,0,.05),0 2px 10px rgba(0,0,0,.14)' }}>
            <${ResumePage} resume=${data} showBreaks=${true} interactive=${true}
              activeId=${p.page === 'personal' ? 'personal' : (p.sid || '')}
              onPages=${app.onPages} onSection=${app.openSection} onPersonal=${app.openPersonal} />
          </div>
        </div>
        <div class="zoombar">
          <button title="Diminuir zoom" onClick=${() => app.setState({ zoom: Math.max(0.3, Math.round((z - 0.1) * 10) / 10) })}>${ic('zoomOut')}</button>
          <div style="min-width:46px;text-align:center;font-size:13px;font-variant-numeric:tabular-nums">${Math.round(z * 100)}%</div>
          <button title="Aumentar zoom" onClick=${() => app.setState({ zoom: Math.min(2, Math.round((z + 0.1) * 10) / 10) })}>${ic('zoomIn')}</button>
          <button title="Ajustar à largura" onClick=${() => app.setState({ zoom: null })}>${ic('fit')}</button>
        </div>
      </div>
    </div>
  </div>`;
}

function openExport(app) {
  const s = app.state; const res = app.curRes(); const pn = res.data.personal;
  const file = (pn.name || 'curriculo').trim().replace(/\s+/g, '_') + '_' + res.name.replace(/\s+/g, '_') + '.pdf';
  app.setState({ dlg: 'export', exp: { ...s.exp, busy: false, prog: 0, file, folder: s.exp.folder || s.saveDir } });
}

function sectionMeta(app, x) {
  const base = x.type === 'summary' ? (app.strip(x.html) ? 'Texto' : 'Vazio') : (x.entries.length === 1 ? '1 entrada' : x.entries.length + ' entradas');
  return (x.visible ? '' : 'Oculta · ') + base;
}

function iconTint(on) {
  return on ? { background: 'rgba(53,132,228,.12)', color: 'var(--accentfg)' } : { background: 'rgba(var(--fg),.06)', color: 'rgba(var(--fg),.45)' };
}

function OverviewPane({ app }) {
  const data = app.data(); const pn = data.personal;
  const initials = (pn.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const addSection = () => app.setState({ dlg: 'addSection' });
  const n = data.sections.length;
  return html`<div class="stack">
    <div>
      <div class="sec-title">Cabeçalho</div>
      <div class="group">
        <div class="row link" style="padding:12px 14px" onClick=${app.openPersonal}>
          <div style="width:42px;height:42px;border-radius:50%;background:#99c1f1;color:#1a5fb4;display:grid;place-items:center;font-weight:700;font-size:16px;flex:none">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700">${pn.name}</div>
            <div class="muted" style="font-size:13px">${pn.title}</div>
          </div>
          ${ic('chev', 14)}
        </div>
      </div>
    </div>
    <div>
      <div class="sec-title tight">Seções</div>
      <div class="sec-hint">Arraste pela alça para reordenar. O cabeçalho fica sempre no topo.</div>
      <div class="group open">
        ${data.sections.map((x, i) => html`<div key=${x.id} data-row="1" class="drag-row row link"
          style=${{ minHeight: '56px', padding: '6px 10px 6px 4px', gap: '8px', ...app.dragStyle('sections', i, n) }}
          onClick=${() => app.openSection(x.id)}>
          <div class="grip" onPointerDown=${e => app.startDrag('sections', i, n, e)} onClick=${e => e.stopPropagation()}>${ic('grip')}</div>
          <div class="tile" style=${iconTint(x.visible)}>${ic(TYPES[x.type].icon)}</div>
          <div style=${{ flex: 1, minWidth: 0, opacity: x.visible ? 1 : 0.55 }}>
            <div class="ellipsis" style="font-weight:700">${x.title}</div>
            <div class="ellipsis muted" style="font-size:13px">${sectionMeta(app, x)}</div>
          </div>
          <${Switch} title="Mostrar no currículo" on=${x.visible}
            onClick=${e => { e.stopPropagation(); app.upd(d => { const t = d.sections.find(y => y.id === x.id); t.visible = !t.visible; }); }} />
          <button class="round del" title="Remover seção" style="margin-right:-4px" onClick=${e => { e.stopPropagation(); app.removeSection(x.id); }}>${ic('trash')}</button>
        </div>`)}
      </div>
      <div class="pill-row"><button class="pill" onClick=${addSection}>${ic('plus')}Adicionar seção</button></div>
    </div>
  </div>`;
}

function PersonalPane({ app }) {
  const s = app.state; const pn = app.data().personal;
  const n = pn.contacts.length;
  // Repeatable fields (e-mail, phone) stay offered; the rest disappear once added.
  const chips = (grp, limit, more) => {
    const all = Object.keys(CONTACT).filter(k => CONTACT[k][3] === grp && (CONTACT[k][4] || !pn.contacts.some(x => x.key === k)));
    const list = limit && !more ? all.slice(0, limit) : all;
    return { list, hasMore: !!limit && !more && all.length > limit, any: all.length > 0 };
  };
  const add = k => { const id = app.uid(); app.focusCid = id; app.upd(d => d.personal.contacts.push({ id, key: k, value: '' })); };
  const chipRow = (c, showMore) => html`<div class="chips">
    ${c.list.map(k => html`<button key=${k} class="chip" onClick=${() => add(k)}>${ic('plus', 14)}${CONTACT[k][0]}</button>`)}
    ${c.hasMore && html`<button class="chip more" onClick=${showMore}>Mostrar mais</button>`}
  </div>`;
  const a = chips('contact'), b = chips('personal', 4, s.moreP), l = chips('links', 6, s.moreL);

  return html`<div class="stack">
    <div>
      <div class="sec-title">Identificação</div>
      <div class="group">
        <${Field} label="Nome completo" value=${pn.name} onInput=${e => { const v = e.target.value; app.upd(d => { d.personal.name = v; }); }} />
        <${Field} label="Título profissional" value=${pn.title} onInput=${e => { const v = e.target.value; app.upd(d => { d.personal.title = v; }); }} />
      </div>
    </div>
    <div>
      <div class="sec-title tight">Contato</div>
      <div class="sec-hint">Arraste pela alça para definir a ordem no cabeçalho. Campos vazios não aparecem no currículo.</div>
      <div class="group open">
        ${pn.contacts.map((c, i) => {
          const M = CONTACT[c.key] || ['Link', 'link', 'https://'];
          const same = pn.contacts.filter(x => x.key === c.key);
          const label = M[0] + (same.length > 1 ? ' ' + (same.indexOf(c) + 1) : '');
          return html`<div key=${c.id} data-row="1" class="drag-row" style=${{ background: 'var(--card)', padding: '6px 14px 6px 4px', display: 'flex', alignItems: 'center', gap: '8px', ...app.dragStyle('contacts', i, n) }}>
            <div class="grip" style="height:40px" onPointerDown=${e => app.startDrag('contacts', i, n, e)}>${ic('grip')}</div>
            <div class="muted" style="flex:none">${ic(M[1])}</div>
            <label style="flex:1;display:flex;flex-direction:column;gap:2px;cursor:text;min-width:0">
              <span class="flabel">${label}</span>
              <input class="finput" data-cid=${c.id} value=${c.value} placeholder=${M[2]}
                onInput=${e => { const v = e.target.value; app.upd(d => { const t = d.personal.contacts.find(x => x.id === c.id); if (t) t.value = v; }); }} />
            </label>
            <button class="round del" title="Remover" style="width:32px;height:32px;color:rgba(var(--fg),.45);margin-right:-6px"
              onClick=${() => app.upd(d => { d.personal.contacts = d.personal.contacts.filter(x => x.id !== c.id); })}>${ic('trash')}</button>
          </div>`;
        })}
        ${n === 0 && html`<div class="row-empty">Nenhum dado de contato.</div>`}
      </div>
    </div>
    <div>
      <div class="sec-title tight">Adicionar dados</div>
      <div class="sec-hint" style="margin-bottom:14px">Novos itens entram no fim da lista de contato.</div>
      <div style="display:flex;flex-direction:column;gap:16px">
        ${a.any && html`<div><div class="chip-group">Contato</div>${chipRow(a)}</div>`}
        <div><div class="chip-group">Dados pessoais</div>${chipRow(b, () => app.setState({ moreP: true }))}</div>
        <div><div class="chip-group">Links e redes sociais</div>${chipRow(l, () => app.setState({ moreL: true }))}</div>
      </div>
    </div>
  </div>`;
}

function RichText({ app, label, placeholder, minHeight }) {
  const p = app.state.pane;
  return html`<div>
    <div class="sec-title">${label}</div>
    <div class="rte-box">
      <div class="rte-tools">
        <button title="Negrito" onMouseDown=${app.fmt('bold')}>${ic('bold')}</button>
        <button title="Itálico" onMouseDown=${app.fmt('italic')}>${ic('italic')}</button>
        <button title="Sublinhado" onMouseDown=${app.fmt('underline')}>${ic('under')}</button>
        <i />
        <button title="Lista" onMouseDown=${app.fmt('insertUnorderedList')}>${ic('list')}</button>
      </div>
      <div key=${p.page + ':' + p.sid + ':' + p.eid} ref=${app.rteRef} contentEditable="true" class="rte"
        data-ph=${placeholder} style=${{ minHeight }} onInput=${app.onRte} />
    </div>
  </div>`;
}

function SectionPane({ app, sec }) {
  const isSum = sec.type === 'summary';
  const n = sec.entries.length;
  const toggleSec = () => app.upd(d => { const t = d.sections.find(x => x.id === sec.id); t.visible = !t.visible; });
  const addEntry = () => {
    const eid = app.uid();
    app.upd(d => d.sections.find(x => x.id === sec.id).entries.push({ id: eid, title: '', sub: '', start: '', end: '', loc: '', link: '', html: '', visible: true }));
    app.go({ page: 'entry', sid: sec.id, eid });
  };
  return html`<div class="stack">
    <div class="group">
      <${Field} label="Título da seção" value=${sec.title} onInput=${e => { const v = e.target.value; app.upd(d => { d.sections.find(x => x.id === sec.id).title = v; }); }} />
      <div class="row"><div style="flex:1">Mostrar no currículo</div><${Switch} on=${sec.visible} onClick=${toggleSec} /></div>
    </div>
    ${isSum && html`<${RichText} app=${app} label="Texto" placeholder="Escreva um resumo profissional…" minHeight="160px" />`}
    ${!isSum && html`<div>
      <div class="sec-title tight">Entradas</div>
      <div class="sec-hint">Arraste pela alça para reordenar.</div>
      <div class="group open">
        ${sec.entries.map((en, i) => {
          const sub = [en.sub, en.start && en.end ? en.start + ' – ' + en.end : en.start].filter(Boolean).join(' · ') || app.strip(en.html).slice(0, 90) || 'Sem detalhes';
          return html`<div key=${en.id} data-row="1" class="drag-row row link" style=${{ height: '60px', padding: '0 8px 0 4px', gap: '8px', ...app.dragStyle('entries', i, n) }}
            onClick=${() => app.go({ page: 'entry', sid: sec.id, eid: en.id })}>
            <div class="grip" onPointerDown=${e => app.startDrag('entries', i, n, e)} onClick=${e => e.stopPropagation()}>${ic('grip')}</div>
            <div style=${{ flex: 1, minWidth: 0, opacity: en.visible ? 1 : 0.5 }}>
              <div class="ellipsis" style="font-weight:700">${en.title || 'Sem título'}</div>
              <div class="ellipsis muted" style="font-size:13px">${sub}</div>
            </div>
            <button class="round" title=${en.visible ? 'Ocultar no currículo' : 'Mostrar no currículo'}
              onClick=${e => { e.stopPropagation(); app.upd(d => { const t = d.sections.find(x => x.id === sec.id).entries.find(y => y.id === en.id); t.visible = !t.visible; }); }}>${ic(en.visible ? 'eye' : 'eyeOff')}</button>
            <div style="color:rgba(var(--fg),.4);flex:none">${ic('chev', 14)}</div>
          </div>`;
        })}
        ${n === 0 && html`<div class="row-empty" style="padding:22px 14px">Nenhuma entrada ainda.</div>`}
      </div>
      <div class="pill-row"><button class="pill" onClick=${addEntry}>${ic('plus')}Adicionar entrada</button></div>
    </div>`}
  </div>`;
}

function EntryPane({ app, sec, ent }) {
  const f = TYPES[sec.type].f || {};
  const setF = k => e => { const v = e.target.value; app.upd(d => { d.sections.find(x => x.id === sec.id).entries.find(y => y.id === ent.id)[k] = v; }); };
  const toggle = () => app.upd(d => { const t = d.sections.find(x => x.id === sec.id).entries.find(y => y.id === ent.id); t.visible = !t.visible; });
  const del = () => {
    const prev = structuredClone(app.data());
    app.upd(d => { const t = d.sections.find(x => x.id === sec.id); t.entries = t.entries.filter(y => y.id !== ent.id); });
    app.go({ page: 'section', sid: sec.id });
    app.toast('Entrada excluída', 'Desfazer', () => { app.restore(prev); app.setState({ toast: null }); });
  };
  return html`<div style="display:flex;flex-direction:column;gap:22px;padding-bottom:70px">
    <div class="group">
      <${Field} label=${f.title || 'Título'} value=${ent.title} onInput=${setF('title')} />
      ${f.sub && html`<${Field} label=${f.sub} value=${ent.sub} onInput=${setF('sub')} />`}
      ${f.link && html`<label class="field" style="flex-direction:row;align-items:center;gap:10px">
        <span style="flex:1;display:flex;flex-direction:column;gap:2px;min-width:0">
          <span class="flabel">Link</span>
          <input class="finput" value=${ent.link} placeholder="https://" onInput=${setF('link')} />
        </span>
        <span style="color:rgba(var(--fg),.45)">${ic('link')}</span>
      </label>`}
    </div>
    ${(f.range || f.single || f.loc) && html`<div class="group">
      ${f.range && html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:1px">
        <${Field} label="Início" value=${ent.start} placeholder="MM/AAAA" onInput=${setF('start')} />
        <${Field} label="Fim" value=${ent.end} placeholder="presente" onInput=${setF('end')} />
      </div>`}
      ${f.single && html`<${Field} label="Data" value=${ent.start} placeholder="MM/AAAA" onInput=${setF('start')} />`}
      ${f.loc && html`<${Field} label="Local" value=${ent.loc} placeholder="Cidade, UF ou Remoto" onInput=${setF('loc')} />`}
    </div>`}
    ${f.desc && html`<${RichText} app=${app} label=${f.desc} placeholder="Descreva atividades, resultados e tecnologias…" minHeight="150px" />`}
    <div class="group">
      <div class="row"><div style="flex:1">Mostrar no currículo</div><${Switch} on=${ent.visible} onClick=${toggle} /></div>
      <button class="row danger" onClick=${del}>${ic('trash')}Excluir entrada</button>
    </div>
  </div>`;
}
