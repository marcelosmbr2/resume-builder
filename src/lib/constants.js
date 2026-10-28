import { html } from '../vendor/preact-htm.js';

// Section types, contact fields and icon paths, copied from mockup/mockup.html.
// TYPES[k].f lists which entry fields a section type shows (range = start/end,
// single = one date, loc, link, desc = rich-text description).
// CONTACT[k] = [label, icon, placeholder, group, repeatable].

export const TYPES = {
  summary: { label: 'Resumo', icon: 'text' },
  skills: { label: 'Habilidades', icon: 'star', f: { title: 'Habilidade', desc: 'Informações / sub-habilidades' } },
  experience: { label: 'Experiência Profissional', icon: 'work', f: { title: 'Cargo', sub: 'Empresa', range: 1, loc: 1, desc: 'Descrição' } },
  education: { label: 'Educação', icon: 'school', f: { title: 'Curso / grau', sub: 'Instituição', range: 1, loc: 1, desc: 'Descrição' } },
  courses: { label: 'Cursos', icon: 'book', f: { title: 'Curso', sub: 'Instituição', range: 1, link: 1, desc: 'Descrição' } },
  projects: { label: 'Projetos', icon: 'code', f: { title: 'Projeto', sub: 'Função', range: 1, link: 1, desc: 'Descrição' } },
  languages: { label: 'Idiomas', icon: 'globe', f: { title: 'Idioma', sub: 'Nível' } },
  certifications: { label: 'Certificações', icon: 'badge', f: { title: 'Certificação', sub: 'Emissor', single: 1, link: 1 } },
  publications: { label: 'Publicações', icon: 'news', f: { title: 'Título', sub: 'Veículo / editora', single: 1, link: 1, desc: 'Resumo' } },
  awards: { label: 'Prêmios', icon: 'trophy', f: { title: 'Prêmio', sub: 'Concedido por', single: 1, desc: 'Descrição' } },
  custom: { label: 'Seção personalizada', icon: 'custom', f: { title: 'Título', sub: 'Subtítulo', range: 1, loc: 1, link: 1, desc: 'Descrição' } }
};
export const CONTACT = {
  email: ['E-mail', 'email', 'nome@exemplo.com', 'contact', 1], phone: ['Telefone', 'phone', '(00) 00000-0000', 'contact', 1],
  location: ['Localização', 'pin', 'Cidade, UF', 'contact'], linkedin: ['LinkedIn', 'linkedin', 'https://linkedin.com/in/…', 'contact'],
  website: ['Site', 'link', 'https://', 'contact'], github: ['GitHub', 'github', 'https://github.com/…', 'contact'],
  nationality: ['Nacionalidade', 'flag', 'Brasileira', 'personal'], birth: ['Data de nascimento', 'calendar', 'DD/MM/AAAA', 'personal'],
  availability: ['Disponibilidade', 'clock', 'Imediata', 'personal'], cnh: ['CNH', 'idcard', 'Categoria B', 'personal'],
  pronouns: ['Pronomes', 'person', 'ele/dele', 'personal'], document: ['Documento', 'idcard', 'RG ou CPF', 'personal'], visa: ['Visto', 'idcard', 'Tipo de visto', 'personal'],
  lattes: ['Lattes', 'school', 'http://lattes.cnpq.br/…', 'links'], medium: ['Medium', 'medium', 'https://medium.com/@…', 'links'], instagram: ['Instagram', 'instagram', 'https://instagram.com/…', 'links'],
  youtube: ['YouTube', 'youtube', 'https://youtube.com/@…', 'links'], portfolio: ['Portfólio', 'work', 'https://', 'links'],
  x: ['X (Twitter)', 'x', 'https://x.com/…', 'links'], bluesky: ['Bluesky', 'at', 'https://bsky.app/profile/…', 'links'],
  gitlab: ['GitLab', 'code', 'https://gitlab.com/…', 'links'], stackoverflow: ['Stack Overflow', 'code', 'https://stackoverflow.com/users/…', 'links'],
  behance: ['Behance', 'at', 'https://behance.net/…', 'links'], dribbble: ['Dribbble', 'at', 'https://dribbble.com/…', 'links'],
  orcid: ['ORCID', 'at', '0000-0000-0000-0000', 'links'], discord: ['Discord', 'at', 'usuário', 'links']
};
export const P = {
  plus: 'M8 3v10M3 8h10', menu: 'M3 4h10M3 8h10M3 12h10', more: ['M8 3.5h.01M8 8h.01M8 12.5h.01', 2.4],
  back: 'M10 3 5 8l5 5', chev: 'M6 3l5 5-5 5', grip: ['M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01', 2.2],
  eye: 'M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8ZM8 6a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
  eyeOff: 'M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8ZM8 6a2 2 0 1 0 0 4a2 2 0 1 0 0-4M2.5 2.5l11 11',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5', close: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
  min: 'M5 10.5h6', max: 'M5 5h6v6H5z', export: 'M8 2v8M5 7l3 3 3-3M3 11v2.5h10V11', folder: 'M2 4.5h4l1.5 1.5H14v6.5H2z',
  folderAdd: 'M2 4.5h4l1.5 1.5H14v6.5H2zM8 7.5v3.5M6.25 9.25h3.5',
  docs: 'M5 2h5l3 3v8H5zM10 2v3h3M3 4.5V15h7.5', inbox: 'M2 9.5 4 3h8l2 6.5V13H2zM2 9.5h3.5l1 1.5h3l1-1.5H14',
  zoomIn: 'M7 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8M13.5 13.5 10 10M5 7h4M7 5v4', zoomOut: 'M7 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8M13.5 13.5 10 10M5 7h4',
  gear: 'M8 6a2 2 0 1 0 0 4a2 2 0 1 0 0-4M6.8 1.5h2.4l.4 1.8 1.2.7 1.8-.6 1.2 2.1-1.4 1.2v1.4l1.4 1.2-1.2 2.1-1.8-.6-1.2.7-.4 1.8H6.8l-.4-1.8-1.2-.7-1.8.6-1.2-2.1 1.4-1.2V7.3L2.2 6.1l1.2-2.1 1.8.6 1.2-.7z',
  sun: 'M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1',
  moon: 'M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7',
  fit: 'M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3', check: 'M3 8.5 6.5 12 13 4.5',
  bold: ['M5 3h4a2.5 2.5 0 0 1 0 5H5zM5 8h4.5a2.5 2.5 0 0 1 0 5H5z', 1.8], italic: 'M10 3H6.5M9.5 13H6M9 3 7 13',
  under: 'M4.5 3v4.5a3.5 3.5 0 0 0 7 0V3M3.5 14h9', list: 'M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01',
  link: 'M7 9a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.8.8M9 7a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.8-.8',
  person: 'M8 2.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M3 13.5c.5-2.5 2.5-4 5-4s4.5 1.5 5 4', lock: 'M4 7.5h8v6H4zM5.5 7.5V5.5a2.5 2.5 0 0 1 5 0v2',
  sort: 'M5 2.5v11M2.5 5 5 2.5 7.5 5M11 13.5v-11M8.5 11l2.5 2.5 2.5-2.5',
  text: 'M3 4h10M3 7h10M3 10h10M3 13h6', star: 'M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3 4.3 13.3l.8-4.1L2 6.3l4.2-.5z',
  work: 'M2 5.5h12v7.5H2zM5.5 5.5V3.5h5v2M2 9h12', school: 'M8 3 1.5 6 8 9l6.5-3zM4 7.5V11c1 1 2.5 1.5 4 1.5s3-.5 4-1.5V7.5',
  book: 'M3 3h4a1 1 0 0 1 1 1v9.5a1 1 0 0 0-1-1H3zM13 3H9a1 1 0 0 0-1 1v9.5a1 1 0 0 1 1-1h4z', code: 'M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 3l-2 10',
  globe: 'M8 2a6 6 0 1 0 0 12A6 6 0 1 0 8 2M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12', badge: 'M8 1.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9M5.5 9.5 4.5 14.5 8 13l3.5 1.5-1-5',
  news: 'M2.5 3h9v10h-9zM11.5 6h2v6a1 1 0 0 1-2 0M4.5 5.5h5M4.5 8h5M4.5 10.5h3', trophy: 'M5 2.5h6V7a3 3 0 0 1-6 0zM5 4H2.5c0 2 1 3 2.5 3M11 4h2.5c0 2-1 3-2.5 3M8 10v2.5M5.5 13.5h5',
  medium: 'M5 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7M11 5c-1 0-1.6 1.3-1.6 3s.6 3 1.6 3 1.6-1.3 1.6-3S12 5 11 5M14.5 5.5v5',
  instagram: 'M4.5 2h7A2.5 2.5 0 0 1 14 4.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 11.5v-7A2.5 2.5 0 0 1 4.5 2M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M11.5 4.5h.01',
  youtube: 'M3.5 3.5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2M6.5 6v4l3.5-2z',
  x: 'M3 2.5h2.5l7.5 11h-2.5zM13 2.5 9 7M3 13.5 7 9', at: 'M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M10.5 8v1a2 2 0 0 0 4 0V8a6.5 6.5 0 1 0-2.5 5.1',
  flag: 'M3 14V2.5M3 3h8l-1.5 3L11 9H3', calendar: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3',
  clock: 'M8 2a6 6 0 1 0 0 12A6 6 0 1 0 8 2M8 4.5V8l2.5 1.5', idcard: 'M1.5 3.5h13v9h-13zM4 6.5h3M4 9h4M10.5 6a1.2 1.2 0 1 0 0 2.4a1.2 1.2 0 1 0 0-2.4',
  custom: 'M3 3h10v10H3zM8 5.5v5M5.5 8h5', email: 'M2 4h12v8H2zM2 4.5l6 4.5 6-4.5',
  phone: 'M4 2h2.5l1 3-1.5 1a8 8 0 0 0 3.9 3.9l1-1.5 3 1V12a2 2 0 0 1-2 2A11 11 0 0 1 2 4a2 2 0 0 1 2-2',
  pin: 'M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14M8 5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3',
  linkedin: 'M2.5 2.5h11v11h-11zM5.5 7v4M5.5 5h.01M8 11V7M8 8.8c0-1 .8-1.8 1.7-1.8s1.3.7 1.3 1.6V11',
  github: 'M6 14.2v-2c-1.8.4-2.2-.9-2.2-.9M10 14.2v-2.3c0-.6-.2-1-.5-1.3 1.8-.2 3-1 3-3.2 0-.7-.2-1.3-.7-1.8.1-.4.1-1.1-.1-1.7 0 0-.6-.2-1.8.7a6 6 0 0 0-3.4 0C5.3 3.7 4.7 3.9 4.7 3.9c-.2.6-.2 1.3-.1 1.7-.4.5-.7 1.1-.7 1.8 0 2.2 1.2 3 3 3.2-.3.3-.5.7-.5 1.3v2.3'
};

// Icon paths are drawn on a 16x16 grid; an array entry carries its own stroke width.
export function ic(name, size = 16) {
  const p = P[name] || P.link;
  const d = Array.isArray(p) ? p[0] : p;
  const sw = Array.isArray(p) ? p[1] : 1.5;
  return html`<svg width=${size} height=${size} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width=${sw} stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none"><path d=${d} /></svg>`;
}
