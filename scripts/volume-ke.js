// Mede o volume de uma lista inteira de frases pela API do Keywords Everywhere (em lote, por código).
//   node scripts/volume-ke.js [entrada.txt] [saida.tsv] [--mock arquivo.json]
// entrada: uma frase por linha (padrão data/pesquisa/entrada.txt)
// saída:   TSV "Keyword / Avg. monthly searches / Competition" (o mesmo formato que o analisador lê)
// Chave: KEYWORDS_EVERYWHERE_API_KEY (keywordseverywhere.com/api). Cada palavra gasta 1 crédito.
import fs from 'fs';

const pos = process.argv.slice(2).filter((a, i, v) => !a.startsWith('--') && v[i - 1] !== '--mock');
const ENTRADA = pos[0] || 'data/pesquisa/entrada.txt';
const SAIDA = pos[1] || 'data/pesquisa/volumes.tsv';
const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const KEY = process.env.KEYWORDS_EVERYWHERE_API_KEY;
const LOTE = 100;

const limpar = (t) => t.replace(/\s+/g, ' ').trim().toLowerCase();
const frases = [...new Set(fs.readFileSync(ENTRADA, 'utf8').split(/\r?\n|,\s*(?=[^\s])/).map(limpar).filter((f) => f && !f.startsWith('#') && f.length <= 80))];

async function lote(kws) {
  if (MOCK) { const m = JSON.parse(fs.readFileSync(MOCK, 'utf8')); return kws.map((k) => ({ keyword: k, vol: m[k] ?? 0, competition: 0.1 })); }
  const body = new URLSearchParams({ country: 'br', currency: 'BRL', dataSource: 'gkp' });
  kws.forEach((k) => body.append('kw[]', k));
  const r = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${KEY}` },
    body,
  });
  if (r.status === 401) throw new Error('chave inválida (401)');
  if (r.status === 402) throw new Error('sem créditos (402): compre créditos no Keywords Everywhere');
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.data || [];
}

async function main() {
  if (!MOCK && !KEY) { console.error('Defina KEYWORDS_EVERYWHERE_API_KEY (secret do repositório).'); process.exit(1); }
  console.log(`${frases.length} frases únicas em ${Math.ceil(frases.length / LOTE)} lote(s).`);
  const linhas = ['Keyword\tAvg. monthly searches\tCompetition'];
  let comVolume = 0;
  for (let i = 0; i < frases.length; i += LOTE) {
    const dados = await lote(frases.slice(i, i + LOTE));
    for (const d of dados) {
      const vol = Number(d.vol) || 0;
      if (vol > 0) comVolume++;
      const c = Number(d.competition);
      linhas.push(`${d.keyword}\t${vol}\t${c >= 0.67 ? 'HIGH' : c >= 0.34 ? 'MEDIUM' : 'LOW'}`);
    }
  }
  fs.mkdirSync('data/pesquisa', { recursive: true });
  fs.writeFileSync(SAIDA, linhas.join('\n') + '\n');
  console.log(`Volumes gravados em ${SAIDA}: ${comVolume} frases com volume de ${frases.length}.`);
}
main().catch((e) => { console.error('Erro:', e.message); process.exit(1); });
