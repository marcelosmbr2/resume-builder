import { html, Component } from '../vendor/preact-htm.js';
import { P, K, P2 } from './resume-icons.js';
import { CONTACT } from '../lib/constants.js';

// One A4 sheet at 96 dpi: 794 x 1123 px. Pages are not laid out separately;
// the content flows and dashed lines mark where each page would break.
export const PAGE_W = 794;
export const PAGE_H = 1123;

function ic(n, sz = 12) {
  const k = K[n] || n;
  const d = P[k] || P2[k] || P.website;
  return html`<svg width=${sz} height=${sz} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none"><path d=${d} /></svg>`;
}

function rich(markup, align) {
  return html`<div class="rp-rich" style=${{ textAlign: align || 'left' }} dangerouslySetInnerHTML=${{ __html: markup || '' }} />`;
}

const esc = t => (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Target for a contact value when the PDF is exported with clickable links.
export function contactHref(key, value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (key === 'email') return /\S+@\S+/.test(v) ? 'mailto:' + v : null;
  if (key === 'phone') return 'tel:' + v.replace(/[^\d+]/g, '');
  if (key === 'orcid' && /^\d{4}-/.test(v)) return 'https://orcid.org/' + v;
  if (/^https?:\/\//i.test(v)) return v;
  const linkish = (CONTACT[key] && CONTACT[key][3] === 'links') || key === 'linkedin' || key === 'website' || key === 'github';
  if (linkish && /^(www\.)?[^\s@/]+\.[a-z]{2,}(\/\S*)?$/i.test(v)) return 'https://' + v;
  return null;
}

function entryHref(link) {
  const v = (link || '').trim();
  if (!v) return null;
  return /^[a-z]+:/i.test(v) ? v : 'https://' + v;
}

export class ResumePage extends Component {
  state = { pages: 1 };

  elRef = el => {
    if (this.ro) { this.ro.disconnect(); this.ro = null; }
    this.el = el;
    if (el) { this.ro = new ResizeObserver(() => this.later()); this.ro.observe(el); }
  };

  componentDidMount() { this.later(); if (document.fonts) document.fonts.ready.then(() => this.later()); }
  componentDidUpdate() { this.later(); }
  componentWillUnmount() { if (this.ro) this.ro.disconnect(); clearTimeout(this.raf); }
  later() { clearTimeout(this.raf); this.raf = setTimeout(() => this.measure(), 16); }
  measure() {
    if (!this.el || !this.el.isConnected) return;
    const p = Math.max(1, Math.ceil((this.el.offsetHeight - 2) / PAGE_H));
    if (p !== this.state.pages) this.setState({ pages: p });
    if (this.props.onPages && p !== this.rep) { this.rep = p; this.props.onPages(p); }
  }

  render({ resume: r, interactive, showBreaks, activeId, links, print, onSection, onPersonal }, { pages }) {
    const live = !!interactive;
    const hit = live ? 'rp-hit' : '';
    const hi = 'rgba(53,132,228,.07)';
    const a = (href, body) => (links && href ? html`<a href=${href} class="rp-link">${body}</a>` : body);
    const breaks = showBreaks ? Array.from({ length: pages - 1 }, (_, k) => ({ top: (k + 1) * PAGE_H + 'px', label: 'Página ' + (k + 2) })) : [];
    // The print window lets the page grow freely; Chromium paginates it.
    const minH = print ? 'auto' : pages * PAGE_H + 'px';

    const sections = !r ? [] : r.sections.filter(s => s.visible).map(s => {
      const kind = s.type === 'summary' ? 'summary' : (s.type === 'skills' || s.type === 'languages') ? 'grid' : 'list';
      const ents = (s.entries || []).filter(e => e.visible);
      const empty = kind === 'summary' ? !(s.html || '').replace(/<[^>]*>/g, '').trim() : ents.length === 0;
      return { s, kind, ents, empty };
    }).filter(x => !x.empty);

    const grid = ents => {
      const items = ents.map(e => ({ id: e.id, title: e.title, body: rich(e.html || esc(e.sub)) }));
      const col = list => html`<div style="display:flex;flex-direction:column;gap:10px">${list.map(g => html`<div key=${g.id} class="rp-keep"><div style="font-weight:700">${g.title}</div>${g.body}</div>`)}</div>`;
      return html`<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 34px">${col(items.filter((_, i) => i % 2 === 0))}${col(items.filter((_, i) => i % 2 === 1))}</div>`;
    };

    const list = ents => html`<div style="display:flex;flex-direction:column;gap:11px">
      ${ents.map(e => html`<div key=${e.id} class="rp-keep" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:0 28px">
        <div>
          <div style="font-weight:700;display:flex;align-items:center;gap:6px">${a(entryHref(e.link), e.title)}${e.link ? ic('website', 11) : null}</div>
          ${e.sub ? html`<div style="font-style:italic">${e.sub}</div>` : null}
          ${rich(e.html)}
        </div>
        <div style="text-align:right;white-space:nowrap">
          <div>${e.start && e.end ? e.start + ' – ' + e.end : (e.start || e.end || '')}</div>
          <div>${e.loc || ''}</div>
        </div>
      </div>`)}
    </div>`;

    return html`<div class="rp" style=${{ minHeight: minH }}>
      <div ref=${this.elRef} class="rp-body">
        ${r && html`<div class=${hit} onClick=${() => live && onPersonal && onPersonal()} style=${{ cursor: live ? 'pointer' : 'default', borderRadius: '3px', background: activeId === 'personal' ? hi : 'transparent' }}>
          <div style="display:flex;align-items:baseline;gap:10px;white-space:nowrap">
            <span style="font-size:29px;font-weight:700;line-height:1.1">${r.personal.name}</span>
            <span style="font-size:22px;line-height:1.1">${r.personal.title}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px 20px;margin-top:10px;font-size:13.5px">
            ${r.personal.contacts.filter(c => (c.value || '').trim()).map(c => html`<span key=${c.id} style="display:flex;align-items:center;gap:7px">${ic(c.key)}${a(contactHref(c.key, c.value), c.value)}</span>`)}
          </div>
        </div>`}
        ${sections.map(({ s, kind, ents }) => html`<div key=${s.id} class=${hit} onClick=${() => live && onSection && onSection(s.id)} style=${{ cursor: live ? 'pointer' : 'default', borderRadius: '3px', background: s.id === activeId ? hi : 'transparent' }}>
          <div class="rp-h">${s.title}</div>
          ${kind === 'summary' ? rich(s.html, 'justify') : kind === 'grid' ? grid(ents) : list(ents)}
        </div>`)}
      </div>
      ${breaks.map(b => html`<div key=${b.top} class="rp-break" style=${{ top: b.top }}><span>${b.label}</span></div>`)}
    </div>`;
  }
}
