// Palavras negativas do blog (data/pesquisa/filtros.json).
//   node scripts/filtros.js            -> imprime só as palavras de EXCLUIR (compra, fora do assunto), para colar em "Excluir palavras-chave" do Planejador
//   node scripts/filtros.js "frase"    -> diz se a frase seria filtrada e por qual grupo
import fs from 'fs';

const ARQ = new URL('../data/pesquisa/filtros.json', import.meta.url);
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const { grupos, tratamento: trat = { excluir: [], sensivel: [] } } = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
const regras = Object.entries(grupos).sort(([a], [b]) => (trat.excluir.includes(b) ? 1 : 0) - (trat.excluir.includes(a) ? 1 : 0)).map(([g, ws]) => [g, new RegExp(`(^| )(${[...new Set(ws.map(norm))].join('|')})( |$)`)]);

// grupo que filtra a frase, ou null se ela está limpa
export const classificar = (frase) => { const t = norm(frase); return regras.find(([, r]) => r.test(t))?.[0] || null; };

// 'excluir' (nunca vira pauta), 'sensivel' (pode virar, com cuidado) ou null (limpa)
export const tratamento = (frase) => { const g = classificar(frase); return !g ? null : trat.excluir.includes(g) ? 'excluir' : 'sensivel'; };

if (process.argv[1] && process.argv[1].endsWith('filtros.js')) {
  const q = process.argv[2];
  if (q) console.log(classificar(q) ? `${tratamento(q).toUpperCase()} (${classificar(q)})` : 'limpa');
  else console.log(trat.excluir.flatMap((g) => grupos[g]).join(', '));
}
