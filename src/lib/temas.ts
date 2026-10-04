// Temas (categorias) do blog. Os artigos trazem um "cluster" livre; aqui ele vira um tema de menu.
// Cluster desconhecido cai em "Saúde geral". Para criar um tema novo, acrescente uma linha abaixo.
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface Tema { slug: string; nome: string; descricao: string; clusters: string[] }

export const TEMAS: Tema[] = [
  { slug: 'coracao-e-colesterol', nome: 'Coração e colesterol', descricao: 'Colesterol, circulação e saúde do coração depois dos 40.', clusters: ['colesterol', 'circulacao', 'pressao', 'coracao'] },
  { slug: 'diabetes-e-exames', nome: 'Diabetes e exames', descricao: 'Glicemia, exames de sangue e como interpretar os resultados.', clusters: ['diabetes', 'exames'] },
  { slug: 'hormonios-e-tireoide', nome: 'Hormônios e tireoide', descricao: 'Tireoide, hormônios e as mudanças do corpo.', clusters: ['tireoide', 'hormonios'] },
  { slug: 'mulher-e-menopausa', nome: 'Mulher e menopausa', descricao: 'Perimenopausa, menopausa e saúde da mulher.', clusters: ['menopausa', 'mulher'] },
  { slug: 'homem-e-prostata', nome: 'Homem e próstata', descricao: 'Próstata, saúde urinária e saúde do homem.', clusters: ['prostata', 'urinario', 'homem'] },
  { slug: 'sono-e-mente', nome: 'Sono e mente', descricao: 'Sono, ansiedade, memória e clareza mental.', clusters: ['sono', 'saude-mental', 'memoria'] },
  { slug: 'musculos-e-movimento', nome: 'Músculos e movimento', descricao: 'Força, coluna, articulações e atividade física.', clusters: ['musculo-e-forca', 'coluna', 'exercicio', 'ossos'] },
  { slug: 'digestao-e-figado', nome: 'Digestão e fígado', descricao: 'Intestino, digestão, fígado e metabolismo.', clusters: ['digestivo', 'digestao', 'figado-metabolismo'] },
  { slug: 'alimentacao-e-peso', nome: 'Alimentação e peso', descricao: 'Alimentação saudável, nutrição e emagrecimento.', clusters: ['alimentacao', 'nutricao', 'emagrecimento'] },
  { slug: 'pele-e-cabelo', nome: 'Pele e cabelo', descricao: 'Cuidados com a pele, o cabelo e as unhas.', clusters: ['pele-cabelo'] },
  { slug: 'visao-e-audicao', nome: 'Visão e audição', descricao: 'Olhos, ouvidos e equilíbrio.', clusters: ['visao', 'olhos', 'ouvido-equilibrio'] },
];

export const TEMA_GERAL: Tema = { slug: 'saude-geral', nome: 'Saúde geral', descricao: 'Outros temas de saúde depois dos 40.', clusters: [] };

export function temaDe(cluster?: string): Tema {
  return TEMAS.find((t) => t.clusters.includes(cluster || '')) || TEMA_GERAL;
}

export interface ArtigoLista {
  slug: string; title: string; description: string; featuredImage: string; imageAlt?: string;
  wordCount?: number; publishedAt?: string; tema: Tema;
}

// Artigos publicados, do mais novo para o mais antigo.
export function artigosPublicados(): ArtigoLista[] {
  try {
    const dados = JSON.parse(readFileSync(resolve('data/articles.json'), 'utf-8'));
    return dados.articles
      .filter((a: any) => a.status === 'published' && a.slug && a.featuredImage)
      .sort((a: any, b: any) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime())
      .map((a: any) => ({ slug: a.slug, title: a.title, description: a.description, featuredImage: a.featuredImage, imageAlt: a.imageAlt, wordCount: a.wordCount, publishedAt: a.publishedAt, tema: temaDe(a.cluster) }));
  } catch { return []; }
}

// Temas que já têm pelo menos um artigo (com contagem), para o menu e para as páginas de tema.
export function temasComArtigos(artigos: ArtigoLista[]): (Tema & { total: number })[] {
  const todos = [...TEMAS, TEMA_GERAL];
  return todos.map((t) => ({ ...t, total: artigos.filter((a) => a.tema.slug === t.slug).length })).filter((t) => t.total > 0);
}
