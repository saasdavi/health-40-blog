// Consulta o banco de palavras (data/pesquisa/banco-de-palavras.json): tudo que já tem volume medido.
//   node scripts/banco.js --resumo                       quantas palavras por categoria/status
//   node scripts/banco.js [--categoria x] [--min 1000] [--limite 30] [--alta]   melhores ainda não usadas
//   node scripts/banco.js --buscar "joelho"              tudo que contém o termo
//   --alta inclui competição HIGH (por padrão fora: costuma ser compra/marca)
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const banco = JSON.parse(fs.readFileSync('data/pesquisa/banco-de-palavras.json', 'utf8')).palavras;
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const COMERCIAL = /\b(comprar|preco|onde comprar|melhor marca|promocao|cupom|kit|capsulas?|comprimidos?|suplemento|creatina|whey|termogenico|quelato|remedio|medicamento)\b/;

if (args.includes('--resumo')) {
  const t = {};
  for (const p of banco) { const c = (t[p.categoria] ||= { total: 0, banco: 0, util: 0 }); c.total++; if (p.status === 'banco') { c.banco++; if (p.volume >= 1000 && p.competicao !== 'HIGH') c.util++; } }
  console.log(`${banco.length} palavras com volume.\ncategoria | total | ainda no banco | úteis (>=1000, sem competição alta)`);
  for (const [c, x] of Object.entries(t).sort((a, b) => b[1].util - a[1].util)) console.log(`${c} | ${x.total} | ${x.banco} | ${x.util}`);
} else if (opt('--buscar')) {
  const q = norm(opt('--buscar'));
  for (const p of banco.filter((x) => norm(x.palavra).includes(q)).slice(0, Number(opt('--limite', 60)))) console.log(`${String(p.volume).padStart(7)} ${p.competicao.padEnd(6)} ${p.status.padEnd(9)} ${p.categoria} · ${p.palavra}`);
} else {
  const min = Number(opt('--min', 1000)), cat = opt('--categoria'), lim = Number(opt('--limite', 30));
  const lista = banco.filter((p) => p.status === 'banco' && p.volume >= min && (!cat || p.categoria === cat) && (args.includes('--alta') || p.competicao !== 'HIGH') && !COMERCIAL.test(norm(p.palavra)));
  for (const p of lista.slice(0, lim)) console.log(`${String(p.volume).padStart(7)} ${p.competicao.padEnd(6)} ${p.categoria} · ${p.palavra}`);
  console.log(`(${lista.length} palavras ainda não usadas com volume >= ${min}${cat ? ' em ' + cat : ''})`);
}
