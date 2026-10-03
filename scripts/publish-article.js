/**
 * Publication Pipeline - PHASE 12
 *
 * For each approved article:
 * 1. Create markdown file in content/articles/
 * 2. Add frontmatter (metadata, SEO, health warnings)
 * 3. Commit to GitHub
 * 4. Vercel auto-deploys
 * 5. Update editorial calendar
 * 6. Mark as published
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');
const CALENDAR_FILE = path.join(__dirname, '../data/editorial-calendar.json');
const CONTENT_DIR = path.join(__dirname, '../content/articles');

// Ensure content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

/**
 * Generate frontmatter for article
 */
function generateFrontmatter(article) {
  return `---
title: "${article.title}"
description: "${article.description}"
slug: ${article.slug}
author: "Health 40+ System"
publishedAt: ${new Date().toISOString()}
updatedAt: null

# SEO
keywords: ${JSON.stringify(article.seo.keywords)}
canonical: ${article.seo.canonical}

# OG
ogTitle: "${article.seo.ogTitle}"
ogDescription: "${article.seo.ogDescription}"

# Metrics
readTime: ${article.metrics.readTime}
difficulty: "${article.metrics.difficulty}"
wordCount: ${article.metrics.wordCount}

# Scores
qualityScore: ${article.scores.quality}
seoScore: ${article.scores.seo}
healthScore: ${article.scores.health}

# Health & Safety
healthWarning: false
medicalReview: false
disclaimers:
  - "Este artigo é informativo e não substitui orientação médica profissional"
  - "Consulte sempre um médico antes de fazer mudanças na sua saúde"

# Tags
tags: ["saúde", "40+", "bem-estar"]
category: "Saúde e Bem-estar"
---
`;
}

/**
 * Create markdown file with article content
 */
function createArticleFile(article) {
  const filename = `${article.slug}.md`;
  const filepath = path.join(CONTENT_DIR, filename);

  const frontmatter = generateFrontmatter(article);
  const content = frontmatter + '\n' + article.content;

  fs.writeFileSync(filepath, content);

  console.log(`   ✍️  Created: content/articles/${filename}`);

  return {
    filename: filename,
    filepath: filepath,
    size: content.length
  };
}

/**
 * Commit to GitHub
 */
function commitToGitHub(article, fileInfo) {
  try {
    // Stage the new file
    execSync(`git add "${fileInfo.filepath}"`, { cwd: path.dirname(ARTICLES_FILE) });

    // Commit
    const commitMessage = `📝 Publish: "${article.title}"

Keyword: ${article.keywords.primaryKeyword}
Readtime: ${article.metrics.readTime} min
Quality: ${article.scores.quality}/100
SEO: ${article.scores.seo}/100

Generated with Claude - Health 40+ autonomous publishing system`;

    execSync(`git commit -m "${commitMessage}"`, { cwd: path.dirname(ARTICLES_FILE) });

    console.log(`   🔗 Committed to GitHub`);

    return true;
  } catch (error) {
    console.warn(`   ⚠️  Git commit warning: ${error.message}`);
    return false;
  }
}

/**
 * Update editorial calendar
 */
function updateCalendar(article) {
  try {
    const calendarData = JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf-8'));

    // Find or create entry for this keyword
    let entry = calendarData.calendar.find(e => e.keyword === article.keywords.primaryKeyword);

    if (!entry) {
      entry = {
        keyword: article.keywords.primaryKeyword,
        status: 'published',
        plannedAt: new Date().toISOString().split('T')[0],
        publishedAt: new Date().toISOString(),
        articleId: article.id
      };
      calendarData.calendar.push(entry);
    } else {
      entry.status = 'published';
      entry.publishedAt = new Date().toISOString();
      entry.articleId = article.id;
    }

    fs.writeFileSync(CALENDAR_FILE, JSON.stringify(calendarData, null, 2));
    console.log(`   📅 Calendar updated`);
  } catch (error) {
    console.warn(`   ⚠️  Calendar update warning: ${error.message}`);
  }
}

/**
 * Publish article
 */
async function publishArticle(article) {
  console.log(`\n📢 PUBLISHING: "${article.title}"`);
  console.log(`   Keyword: ${article.keywords.primaryKeyword}`);
  console.log(`   Quality: ${article.scores.quality}/100`);

  try {
    // Create markdown file
    const fileInfo = createArticleFile(article);

    // Commit to GitHub
    const committed = commitToGitHub(article, fileInfo);

    // Update calendar
    updateCalendar(article);

    // Mark as published
    return {
      ...article,
      status: 'published',
      publishedAt: new Date().toISOString(),
      url: `https://health-40-blog.vercel.app/${article.slug}`,
      committed: committed
    };
  } catch (error) {
    console.error(`   ❌ Publication failed: ${error.message}`);
    return {
      ...article,
      status: 'publication_failed',
      error: error.message
    };
  }
}

/**
 * Run publication pipeline
 */
async function runPublication() {
  console.log('📢 PHASE 12: Publication Pipeline\n');

  try {
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));

    // Find articles ready for publication
    const readyArticles = articlesData.articles.filter(
      a => a.status === 'ready_for_publication'
    );

    console.log(`Found ${readyArticles.length} articles ready for publication\n`);

    if (readyArticles.length === 0) {
      console.log('✅ No articles ready for publication');
      return;
    }

    // Check daily quota (max 2 articles/day)
    const today = new Date().toISOString().split('T')[0];
    const publishedToday = articlesData.articles.filter(
      a => a.status === 'published' && a.publishedAt?.startsWith(today)
    ).length;

    const availableSlots = 2 - publishedToday;

    if (availableSlots <= 0) {
      console.log(`⏸️  Daily quota reached (${publishedToday}/2)`);
      console.log(`   Articles queued for tomorrow: ${readyArticles.length}`);
      return;
    }

    // Publish up to available slots
    const toPublish = readyArticles.slice(0, availableSlots);
    let published = 0;

    for (const article of toPublish) {
      const published_article = await publishArticle(article);

      // Update article in data
      const idx = articlesData.articles.findIndex(a => a.id === article.id);
      articlesData.articles[idx] = published_article;

      if (published_article.status === 'published') {
        published++;
      }
    }

    // Save updated articles
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articlesData, null, 2));

    // Try to push to GitHub
    try {
      execSync('git push origin main', { cwd: path.dirname(ARTICLES_FILE) });
      console.log(`\n✅ Pushed to GitHub (Vercel deploying...)`);
    } catch (error) {
      console.warn(`\n⚠️  Git push warning: ${error.message}`);
    }

    console.log(`\n✅ Publication pipeline completed!`);
    console.log(`   Published: ${published}/${availableSlots} articles`);
    console.log(`   Queued for later: ${readyArticles.length - published} articles`);
    console.log(`   Next: PHASE 13 (Search Console tracking)`);

  } catch (error) {
    console.error('❌ Publication failed:', error.message);
    process.exit(1);
  }
}

runPublication();
