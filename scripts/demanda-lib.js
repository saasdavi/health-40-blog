// Consulta a demanda JÁ VALIDADA (data/pesquisa/demanda-validada.json, gerado por scripts/consolidar-demanda.js).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(para|de|do|da|dos|das|o|a|os|as|no|na|em|e)\b/g, ' ').replace(/\s+/g, ' ').trim();
const chave = (s) => norm(s).split(' ').sort().join(' ');
let cache = null;
const carregar = () => (cache ||= JSON.parse(fs.readFileSync(path.join(raiz, 'data/pesquisa/demanda-validada.json'), 'utf8')));
export const classe = (v) => (v == null ? 'não medida' : v >= 10000 ? 'alta' : v >= 1000 ? 'boa' : 'baixa');
// Retorna { volume, exato, tendencia, concorrencia, tema, fonte, classe, porSimilar } ou null
export function demandaDe(keyword) {
  const d = carregar().itens;
  const k = chave(keyword);
  if (d[k]) return { ...d[k], classe: classe(d[k].volume), porSimilar: false };
  // sem acento / ordem igual já tratado; tenta contido: a frase da pauta inclui uma frase medida (ou vice-versa) com 2+ palavras
  const nk = norm(keyword); let melhor = null;
  for (const e of Object.values(d)) {
    const ne = norm(e.frase);
    if (ne.split(' ').length < 2) continue;
    if (nk.includes(ne) || ne.includes(nk)) { if (!melhor || (e.volume || 0) > (melhor.volume || 0)) melhor = e; }
  }
  return melhor ? { ...melhor, classe: classe(melhor.volume), porSimilar: true } : null;
}
