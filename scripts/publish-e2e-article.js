#!/usr/bin/env node

/**
 * publish-e2e-article.js
 * Publica artigo validado E-E-A-T para o blog
 *
 * Fluxo: Validacao (85+) -> Publicacao -> Atualizacao de indice
 *
 * Uso: node scripts/publish-e2e-article.js data/articles/slug.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * Validacao E-E-A-T simples
 */
function quickValidateEEAT(article) {
  const checks = {
    hasAuthor: !!article.author,
    hasDisclaimer: !!article.disclaimer,
    hasSources: article.sources && article.sources.length >= 3,
    hasContent: article.content && article.content.length > 3000,
    hasH1: article.title && article.title.length > 0,
    hasMetaDescription: article.description && article.description.length > 0,
    hasStructure: article.sections && article.sections.length >= 4,
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const score = Math.round((passed / total) * 100);

  return {
    score,
    checks,
    canPublish: score >= 85,
  };
}

/**
 * Cria artigo publicado (com metadata)
 */
function createPublishedArticle(article, articlePath) {
  const now = new Date().toISOString();

  return {
    ...article,
    status: 'published',
    publishedAt: now,
    slug: article.slug || articlePath.replace(/\.json$/, '').split('/').pop(),
    metadata: {
      validatedAt: now,
      validationScore: quickValidateEEAT(article).score,
      source: articlePath,
    },
  };
}

/**
 * Atualiza index de artigos publicados
 */
function updateArticlesIndex(publishedArticle) {
  const indexPath = path.join(ROOT, 'data', 'articles.json');

  let index = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    metadata: {
      totalPublished: 0,
      totalDrafts: 0,
    },
    articles: [],
  };

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    index = JSON.parse(content);
  }

  // Remove se ja existe (para atualizar)
  index.articles = index.articles.filter((a) => a.slug !== publishedArticle.slug);

  // Adiciona novo
  index.articles.push({
    id: `art_${Date.now()}`,
    title: publishedArticle.title,
    slug: publishedArticle.slug,
    primaryKeyword: publishedArticle.keywords?.primary || '',
    description: publishedArticle.description,
    status: 'published',
    publishedAt: publishedArticle.publishedAt,
    wordCount: publishedArticle.wordCount || 0,
    readingTime: publishedArticle.readingTime || 0,
    difficulty: publishedArticle.difficulty || 'intermediate',
    validationScore: quickValidateEEAT(publishedArticle).score,
    seoMetrics: {
      h1: publishedArticle.title,
      headings: publishedArticle.sections?.map((s) => s.h2) || [],
      internalLinks: (publishedArticle.content || '').match(/\[.*?\]\(\/blog\/.*?\)/g)?.length || 0,
      externalLinks: (publishedArticle.content || '').match(/https?:\/\/[^\s)]+/g)?.length || 0,
      imageCount: publishedArticle.sections?.reduce((acc, s) => acc + (s.images?.length || 0), 0) || 0,
    },
  });

  // Atualiza counts
  index.metadata.totalPublished = index.articles.filter((a) => a.status === 'published').length;
  index.metadata.totalDrafts = index.articles.filter((a) => a.status === 'draft').length;
  index.lastUpdated = new Date().toISOString();

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');

  return index;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node scripts/publish-e2e-article.js <article.json> [options]

Options:
  --force              Publica mesmo com score < 85
  --no-astro           Nao cria pagina Astro

Examples:
  node scripts/publish-e2e-article.js data/articles/colesterol-40.json
  node scripts/publish-e2e-article.js data/articles/colesterol-40.json --force
    `);
    process.exit(0);
  }

  const articlePath = path.resolve(args[0]);
  let force = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--force') force = true;
  }

  console.log('\n** PUBLICADOR DE ARTIGOS E-E-A-T\n');

  // Verifica arquivo
  if (!fs.existsSync(articlePath)) {
    console.error(`Arquivo nao encontrado: ${articlePath}`);
    process.exit(1);
  }

  try {
    // Carrega artigo
    const articleContent = fs.readFileSync(articlePath, 'utf-8');
    const article = JSON.parse(articleContent);

    console.log(`Artigo: ${article.title}`);
    console.log(`Arquivo: ${articlePath}\n`);

    // Valida E-E-A-T
    const validation = quickValidateEEAT(article);
    console.log(`Validacao E-E-A-T: ${validation.score}/100`);
    console.log(`   - Autor: ${validation.checks.hasAuthor ? 'OK' : 'ERRO'}`);
    console.log(`   - Disclaimer: ${validation.checks.hasDisclaimer ? 'OK' : 'ERRO'}`);
    console.log(`   - Fontes: ${validation.checks.hasSources ? 'OK' : 'ERRO'}`);
    console.log(`   - Conteudo: ${validation.checks.hasContent ? 'OK' : 'ERRO'}`);
    console.log(`   - Estrutura: ${validation.checks.hasStructure ? 'OK' : 'ERRO'}\n`);

    if (!validation.canPublish && !force) {
      console.error(
        `Publicacao recusada: Score ${validation.score}/100 (minimo: 85)`
      );
      console.log('Use --force para publicar mesmo assim (nao recomendado).\n');
      process.exit(1);
    }

    if (!validation.canPublish && force) {
      console.warn(`AVISO: Publicando com score baixo (${validation.score}/100)\n`);
    }

    // Cria artigo publicado
    const slug = article.slug || articlePath.replace(/\.json$/, '').split('/').pop();
    const publishedArticle = createPublishedArticle(article, articlePath);

    // Atualiza indice
    const indexUpdate = updateArticlesIndex(publishedArticle);
    console.log(`Indice atualizado (total: ${indexUpdate.metadata.totalPublished} publicados)`);

    // Salva artigo publicado
    const publishPath = path.join(ROOT, 'data', 'articles', `${slug}.published.json`);
    fs.writeFileSync(publishPath, JSON.stringify(publishedArticle, null, 2), 'utf-8');
    console.log(`Artigo salvo: ${publishPath}`);

    console.log('\nPUBLICACAO CONCLUIDA!\n');

  } catch (error) {
    console.error('Erro durante publicacao:', error.message);
    process.exit(1);
  }
}

main();
