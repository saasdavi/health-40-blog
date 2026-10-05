// Long tails com demanda relacionadas a uma palavra-chave: frases já medidas (demanda-validada.json) que contêm todos os termos dela.
// Uso: import { indiceLongTails, longTails } from './lib/longtails.js'
import { norm } from '../demanda-lib.js';
const FUNC = new Set(['para', 'como', 'que', 'com', 'por', 'dos', 'das', 'uma', 'uns', 'umas', 'sem', 'mais', 'nos', 'nas', 'qual', 'quais']);
const stem = (t) => (t.length > 3 ? t.replace(/s$/, '') : t);
export const tokens = (s) => norm(s).split(' ').filter((t) => t.length > 2 && !FUNC.has(t)).map(stem);
export function indiceLongTails(itens) {
  return Object.values(itens).filter((e) => e.frase && e.volume).map((e) => ({ frase: e.frase, volume: e.volume, nf: norm(e.frase), set: new Set(tokens(e.frase)) }));
}
export function longTails(keyword, indice, { min = 100, max = 10, ruido = null } = {}) {
  const kt = tokens(keyword); const nk = norm(keyword);
  if (!kt.length) return [];
  const vistos = new Set();
  return indice.filter((e) => e.nf !== nk && e.volume >= min && kt.every((t) => e.set.has(t)) && !(ruido && ruido.test(e.nf)) && !(e.set.size === kt.length && e.nf.split(' ').length <= nk.split(' ').length))
    .sort((a, b) => b.volume - a.volume)
    .filter((e) => { const k = [...e.set].sort().join(' '); if (vistos.has(k)) return false; vistos.add(k); return true; })
    .slice(0, max);
}
