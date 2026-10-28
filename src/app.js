import { html, Component } from './vendor/preact-htm.js';
import { TYPES } from './lib/constants.js';
import { ListScreen } from './screens/list.js';
import { SettingsScreen } from './screens/settings.js';
import { EditorScreen } from './screens/editor.js';
import { AddSectionDialog, ExportDialog, AlertDialog, Toast } from './screens/dialogs.js';

const { invoke } = window.__TAURI__.core;

// Port of the mockup's root component. State shape and actions follow
// mockup/mockup.html; localStorage is replaced by the Rust storage commands.
export class App extends Component {
  constructor(props) {
    super(props);
    const lib = props.library || {};
    this.state = {
      theme: props.prefs.theme || 'system', sysDark: sysDark(), saveDir: props.prefs.saveDir,
      resumes: lib.resumes || [], folders: lib.folders || [],
      view: 'all', dragRes: null, dropOver: null, moreP: false, moreL: false,
      screen: 'list', cur: null, pane: { page: 'overview' }, dlg: null, menuFor: null, toast: null, drag: null,
      zoom: null, fit: 0.8, pages: 1, now: Date.now(), alert: null, renameVal: '',
      exp: { file: '', folder: '', links: true, open: true, busy: false, prog: 0 }
    };
    this.savedRef = this.state.resumes;
    this.savedF = this.state.folders;
  }

  componentDidMount() {
    this.tick = setInterval(() => this.setState({ now: Date.now() }), 30000);
    this.mq = window.matchMedia('(prefers-color-scheme: dark)');
    this.onMq = () => this.setState({ sysDark: this.mq.matches });
    this.mq.addEventListener('change', this.onMq);
    this.onWinResize = () => this.laterFit();
    window.addEventListener('resize', this.onWinResize);
    // Flush the debounced save before the window goes away.
    window.__TAURI__.window.getCurrentWindow().onCloseRequested(() => this.flush());
  }

  componentWillUnmount() {
    clearInterval(this.tick);
    if (this.ro) this.ro.disconnect();
    this.mq.removeEventListener('change', this.onMq);
    window.removeEventListener('resize', this.onWinResize);
  }

  componentDidUpdate() {
    this.laterFit();
    if (this.savedRef !== this.state.resumes || this.savedF !== this.state.folders) {
      this.savedRef = this.state.resumes; this.savedF = this.state.folders;
      clearTimeout(this.saveT);
      this.saveT = setTimeout(() => this.flush(), 400);
    }
    if (this.focusCid) {
      const el = document.querySelector('input[data-cid="' + this.focusCid + '"]');
      if (el) { el.focus(); this.focusCid = null; }
    }
  }

  // ---- persistence ----
  library() { return { resumes: this.state.resumes, folders: this.state.folders }; }
  flush() {
    clearTimeout(this.saveT);
    return invoke('save_library', { dir: this.state.saveDir, data: this.library() })
      .catch(e => this.toast('Não foi possível salvar: ' + e));
  }
  savePrefs(patch) {
    this.setState(patch, () => {
      invoke('save_prefs', { prefs: { theme: this.state.theme, saveDir: this.state.saveDir } }).catch(() => {});
    });
  }
  // A folder that already holds a library is opened; otherwise the current
  // library is written there.
  async setSaveDir(dir) {
    dir = (dir || '').trim();
    if (!dir || dir === this.state.saveDir) return;
    try {
      const found = await invoke('load_library', { dir });
      if (found) {
        await this.flush();
        // Mark the loaded arrays as saved so switching folders doesn't rewrite them.
        const resumes = found.resumes || [], folders = found.folders || [];
        this.savedRef = resumes; this.savedF = folders;
        this.savePrefs({ saveDir: dir, resumes, folders, view: 'all' });
        this.toast('Currículos carregados de ' + dir);
      } else {
        await invoke('save_library', { dir, data: this.library() });
        this.savePrefs({ saveDir: dir });
      }
    } catch (e) {
      this.toast('Pasta inválida: ' + e);
    }
  }
  async resetApp() {
    try {
      await invoke('reset_app', { dir: this.state.saveDir });
      const prefs = await invoke('load_prefs');
      // Nothing to save: reset just deleted the library file.
      const resumes = [], folders = [];
      this.savedRef = resumes; this.savedF = folders;
      this.setState({ resumes, folders, view: 'all', theme: 'system', saveDir: prefs.saveDir, screen: 'list', cur: null, dlg: null, alert: null, menuFor: null });
      this.toast('Aplicativo redefinido. Todos os dados foram apagados.');
    } catch (e) {
      this.toast('Não foi possível redefinir: ' + e);
    }
  }

  // ---- model helpers ----
  uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  blank() {
    const S = type => ({ id: this.uid() + type, type, title: TYPES[type].label, visible: true, entries: [], html: '' });
    return {
      personal: { name: 'Seu nome', title: 'Título profissional', contacts: ['email', 'phone', 'location', 'linkedin'].map(key => ({ id: this.uid() + key, key, value: '' })) },
      sections: ['summary', 'skills', 'experience', 'education'].map(S)
    };
  }
  curRes() { return this.state.resumes.find(r => r.id === this.state.cur); }
  data() { const r = this.curRes(); return r && r.data; }
  upd(fn) {
    this.setState(s => ({ resumes: s.resumes.map(r => { if (r.id !== s.cur) return r; const data = structuredClone(r.data); fn(data, s); return { ...r, data, edited: Date.now() }; }) }));
  }
  restore(data) { this.setState(s => ({ resumes: s.resumes.map(r => r.id === s.cur ? { ...r, data, edited: Date.now() } : r) })); }
  toast(msg, actLabel, act) {
    const k = Date.now(); this.setState({ toast: { msg, actLabel, act, k } });
    clearTimeout(this.tt); this.tt = setTimeout(() => { if (this.state.toast && this.state.toast.k === k) this.setState({ toast: null }); }, 4500);
  }
  rel(t) {
    const m = Math.floor((this.state.now - t) / 60000);
    if (m < 1) return 'agora'; if (m < 60) return 'há ' + m + ' min';
    const h = Math.floor(m / 60); if (h < 24) return 'há ' + h + ' h';
    return new Date(t).toLocaleDateString('pt-BR');
  }
  strip(h) { return (h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
  isDark() { const s = this.state; return s.theme === 'dark' || (s.theme === 'system' && s.sysDark); }
  toggleTheme = () => this.savePrefs({ theme: this.isDark() ? 'light' : 'dark' });

  // ---- navigation ----
  open(id) { this.setState({ screen: 'editor', cur: id, pane: { page: 'overview' }, menuFor: null, zoom: null }); }
  go(pane) { this.setState({ pane }); }
  back = () => {
    const p = this.state.pane;
    if (p.page === 'entry') this.go({ page: 'section', sid: p.sid });
    else if (p.page === 'section' || p.page === 'personal') this.go({ page: 'overview' });
    else this.setState({ screen: 'list', cur: null });
  };
  openSection = sid => this.go({ page: 'section', sid });
  openPersonal = () => this.go({ page: 'personal' });
  onPages = n => { if (n !== this.state.pages) this.setState({ pages: n }); };
  closeDlg = () => { if (!this.state.exp.busy) this.setState({ dlg: null }); };

  // ---- resumes and folders ----
  newResume = () => {
    const s = this.state; const id = this.uid();
    const folder = s.folders.some(f => f.id === s.view) ? s.view : null;
    this.setState(st => ({ resumes: [...st.resumes, { id, name: 'Currículo sem título', edited: Date.now(), folder, data: this.blank() }] }), () => this.open(id));
  };
  moveTo(rid, fid) {
    const s = this.state;
    const r = s.resumes.find(x => x.id === rid); if (!r || (r.folder || null) === fid) return;
    const f = s.folders.find(x => x.id === fid);
    this.setState(st => ({ resumes: st.resumes.map(x => x.id === rid ? { ...x, folder: fid } : x), menuFor: null, dragRes: null, dropOver: null }));
    this.toast('“' + r.name + '” movido para ' + (f ? f.name : 'Sem pasta'));
  }
  duplicate(r) {
    this.setState(st => {
      const i = st.resumes.findIndex(x => x.id === r.id);
      const c = { ...structuredClone(r), id: this.uid(), name: r.name + ' (cópia)', edited: Date.now() };
      const arr = [...st.resumes]; arr.splice(i + 1, 0, c);
      return { resumes: arr, menuFor: null };
    });
  }

  // ---- sections ----
  addSection(type) {
    const id = this.uid();
    this.upd(d => d.sections.push({ id, type, title: TYPES[type].label, visible: true, entries: [], html: '' }));
    this.setState({ dlg: null });
    this.toast('Seção “' + TYPES[type].label + '” adicionada ao final', 'Editar', () => this.setState({ dlg: null, toast: null, pane: { page: 'section', sid: id } }));
  }
  removeSection(id) {
    const prev = structuredClone(this.data()); const sec = prev.sections.find(s => s.id === id);
    this.upd(d => { d.sections = d.sections.filter(s => s.id !== id); });
    if (this.state.pane.sid === id) this.go({ page: 'overview' });
    this.toast('Seção “' + sec.title + '” removida', 'Desfazer', () => { this.restore(prev); this.setState({ toast: null }); });
  }

  // ---- rich text (contentEditable; the element is keyed per pane) ----
  rteHtml() {
    const d = this.data(); const p = this.state.pane; const sec = d && d.sections.find(x => x.id === p.sid);
    if (!sec) return '';
    if (p.page === 'entry') { const e = sec.entries.find(x => x.id === p.eid); return (e && e.html) || ''; }
    return sec.html || '';
  }
  rteRef = el => { if (el && !el.dataset.init) { el.dataset.init = '1'; el.innerHTML = this.rteHtml(); } };
  onRte = e => {
    const markup = e.currentTarget.innerHTML; const p = this.state.pane;
    this.upd(d => {
      const sec = d.sections.find(x => x.id === p.sid); if (!sec) return;
      if (p.page === 'entry') { const en = sec.entries.find(x => x.id === p.eid); if (en) en.html = markup; } else sec.html = markup;
    });
  };
  fmt = cmd => e => { e.preventDefault(); document.execCommand(cmd); };

  // ---- preview fit-to-width ----
  previewRef = el => {
    if (this.ro) { this.ro.disconnect(); this.ro = null; }
    this.prevEl = el;
    if (el) { this.ro = new ResizeObserver(() => this.laterFit()); this.ro.observe(el); }
  };
  laterFit() { clearTimeout(this.fitT); this.fitT = setTimeout(() => this.measureFit(), 16); }
  measureFit() {
    const el = this.prevEl; if (!el || !el.isConnected) return;
    const w = el.clientWidth - 64 - 40;
    if (w <= 0) return;
    const fit = Math.max(0.35, Math.min(1.25, w / 794));
    if (Math.abs(fit - this.state.fit) > 0.005) this.setState({ fit });
  }

  // ---- pointer-driven reordering for contacts, sections and entries ----
  startDrag(list, from, n, e) {
    e.preventDefault(); e.stopPropagation();
    const row = e.currentTarget.closest('[data-row]'); if (!row) return;
    const rowH = row.getBoundingClientRect().height + 1;
    this.setState({ drag: { list, from, cur: from, dy: 0, rowH, n, startY: e.clientY } });
    const mv = ev => {
      const d = this.state.drag; if (!d) return;
      const dy = Math.max(-d.from * d.rowH, Math.min((d.n - 1 - d.from) * d.rowH, ev.clientY - d.startY));
      const cur = Math.max(0, Math.min(d.n - 1, d.from + Math.round(dy / d.rowH)));
      this.setState({ drag: { ...d, dy, cur } });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      const d = this.state.drag; this.setState({ drag: null });
      if (d && d.cur !== d.from) this.commitMove(d.list, d.from, d.cur);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  commitMove(list, from, to) {
    const sid = this.state.pane.sid;
    this.upd(d => {
      const arr = list === 'sections' ? d.sections : list === 'contacts' ? d.personal.contacts : d.sections.find(x => x.id === sid).entries;
      const [it] = arr.splice(from, 1); arr.splice(to, 0, it);
    });
  }
  // Inline style for row i while a drag is in progress in `list`.
  dragStyle(list, i, n) {
    const d = this.state.drag;
    const rad = n === 1 ? '12px' : i === 0 ? '12px 12px 0 0' : i === n - 1 ? '0 0 12px 12px' : '0';
    const base = { transform: 'none', transition: 'transform .18s ease', zIndex: 'auto', boxShadow: 'none', borderRadius: rad };
    if (!d || d.list !== list) return base;
    if (i === d.from) return { transform: 'translateY(' + d.dy + 'px)', transition: 'none', zIndex: 5, boxShadow: '0 0 0 1px rgba(var(--fg),.06),0 8px 20px rgba(var(--sh),.25)', borderRadius: '10px' };
    let o = 0;
    if (d.from < d.cur && i > d.from && i <= d.cur) o = -d.rowH;
    else if (d.from > d.cur && i >= d.cur && i < d.from) o = d.rowH;
    return { ...base, transform: 'translateY(' + o + 'px)' };
  }

  render(_, s) {
    const data = this.data();
    return html`<div class="app" data-theme=${this.isDark() ? 'dark' : 'light'}>
      ${s.screen === 'list' && html`<${ListScreen} app=${this} />`}
      ${s.screen === 'settings' && html`<${SettingsScreen} app=${this} />`}
      ${s.screen === 'editor' && data && html`<${EditorScreen} app=${this} />`}
      ${s.menuFor && html`<div class="scrim" onClick=${() => this.setState({ menuFor: null })} />`}
      ${s.dlg === 'addSection' && data && html`<${AddSectionDialog} app=${this} />`}
      ${s.dlg === 'export' && data && html`<${ExportDialog} app=${this} />`}
      ${s.dlg === 'alert' && html`<${AlertDialog} app=${this} />`}
      ${s.toast && html`<${Toast} app=${this} />`}
    </div>`;
  }
}

function sysDark() { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
