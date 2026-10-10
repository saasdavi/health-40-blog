// Recalcula a pontuação final (scores) dos artigos em ESTOQUE com os dados atuais (demanda, fontes, links...) e
// atualiza data/conteudo/ABAIXO-DE-90.md. Não mexe em texto nem em artigos publicados.
//   node scripts/recalcular-pontuacao.js [--seco]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ArticleRobot from './article-robot.js';
import { pontuar } from './pontuacao.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECO = process.argv.includes('--seco');
const robot = new ArticleRobot();
const arts = robot.db.articles;
let mudou = 0, subiram90 = 0;
for (const a of arts) {
  if (!(a.estoque && a.status === 'draft')) continue;
  const antes = a.scores?.total;
  a._substitui = a.slug; const aud = robot.auditar(a, null); delete a._substitui;
  const revisado = a.scores?.partes?.seguranca === 100; // quem já tinha segurança 100 foi revisado
  const p = pontuar({ art: a, aud, outros: arts, revisado });
  if (p.total !== antes) { mudou++; if (p.total >= 90 && (antes ?? 0) < 90) subiram90++; }
  a.scores = { ...(a.scores || {}), auditoria: aud.nota, total: p.total, decisao: p.decisao, partes: p.partes, atencao: p.motivos.slice(0, 8) };
}
const est = arts.filter((x) => x.estoque && x.status === 'draft');
const ab = est.filter((x) => x.scores?.total != null && x.scores.total < 90).sort((x, y) => x.scores.total - y.scores.total);
const sem = est.filter((x) => x.scores?.total == null);
const causa = (x) => { const m = x.scores.atencao || []; const c = [];
  if (m.some((t) => t.includes('demanda NÃO medida'))) c.push('demanda não medida'); else if (m.some((t) => t.includes('demanda baixa'))) c.push('demanda baixa');
  if (m.some((t) => t.includes('canibalização'))) c.push('parecido com outro artigo');
  if (m.some((t) => t.includes('tema sensível'))) c.push('tema sensível sem REVISADO');
  if (m.some((t) => t.includes('imagem(ns)'))) c.push('faltam imagens (ideal 3)');
  return c.join(', ') || 'ver scores.atencao'; };
const L = ['# Artigos do estoque ainda abaixo de 90', '', `Atualizado em ${new Date().toISOString().slice(0, 10)} por scripts/recalcular-pontuacao.js.`,
  'A pontuação é a do importador (`scripts/pontuacao.js`): qualidade 35%, demanda 20%, fontes 15%, originalidade 15%, formato 10%, segurança 5%.', '',
  `**${ab.length} artigos** continuam com pontuação final abaixo de 90. Nenhum está publicado.`, '',
  '## Por que continuam abaixo',
  '- **Demanda baixa ou não medida:** vale 20% da nota. Sem volume de busca de 1.000 ou mais por mês, o teto fica abaixo de 90. Estimativas do Google Trends (`volume-trends.js`) aparecem em `data/pesquisa/demanda-validada.json` com `"estimado": true`.',
  '- **Parecido com outro artigo:** risco de canibalização; mudar o ângulo ou juntar.', '- **Tema sensível sem `REVISADO: sim`:** revisão humana, feita pelo dono.', '- **Faltam imagens:** ideal 3 por artigo.', '',
  '## Lista (da menor nota para a maior)', '', '| Nota | Artigo | Motivo principal |', '|---|---|---|',
  ...ab.map((x) => `| ${x.scores.total} | ${x.primaryKeyword} (\`/${x.slug}/\`) | ${causa(x)} |`)];
if (sem.length) L.push('', `## Sem pontuação final (${sem.length})`, 'Artigos mais antigos, do robô, que só têm a nota da auditoria.', '', ...sem.map((x) => `- ${x.primaryKeyword} (\`/${x.slug}/\`), auditoria ${x.scores?.auditoria ?? '?'}`));
console.log(`estoque ${est.length} | notas que mudaram ${mudou} | passaram de 90 agora ${subiram90} | ainda abaixo de 90: ${ab.length}`);
if (!SECO) { robot.gravar(); fs.writeFileSync(path.join(raiz, 'data/conteudo/ABAIXO-DE-90.md'), L.join('\n') + '\n'); console.log('gravado'); }
