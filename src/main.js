import { html, render } from './vendor/preact-htm.js';
import { App } from './app.js';
import { ResumePage } from './components/ResumePage.js';

const { invoke } = window.__TAURI__.core;
const root = document.getElementById('app');

// The hidden "print" window (see src-tauri/src/pdf.rs) renders only the sheet
// and reports back once fonts and layout are settled.
async function startPrint() {
  const job = await invoke('print_job');
  if (!job) return;
  document.body.style.background = '#fff';
  render(html`<${ResumePage} resume=${job.resume} links=${job.links} print=${true} />`, root);
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => invoke('print_ready')));
}

async function startApp() {
  const prefs = await invoke('load_prefs');
  let library = null;
  try { library = await invoke('load_library', { dir: prefs.saveDir }); } catch (e) { console.error(e); }
  render(html`<${App} prefs=${prefs} library=${library} />`, root);
}

if (window.__TAURI__.window.getCurrentWindow().label === 'print') startPrint();
else startApp();
