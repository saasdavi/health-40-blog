/**
 * Google Search SERP Analysis - PHASE 8
 *
 * For each validated keyword:
 * 1. Search on Google
 * 2. Get top 2-3 results
 * 3. Extract competitor data
 * 4. Store for Claude analysis
 *
 * Competitors = What works? Patterns? Gaps?
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');
const COMPETITORS_FILE = path.join(__dirname, '../data/competitors.json');

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

/**
 * Search Google for a keyword
 */
async function googleSearch(keyword, resultCount = 10) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.warn('⚠️  Google Search API not configured');
      resolve([]);
      return;
    }

    const params = new URLSearchParams({
      key: GOOGLE_SEARCH_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: keyword,
      num: resultCount,
      lr: 'lang_pt' // Portuguese
    });

    const url = `https://www.googleapis.com/customsearch/v1?${params}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const items = result.items || [];
          resolve(items.map(item => ({
            position: items.indexOf(item) + 1,
            title: item.title,
            url: item.link,
            snippet: item.snippet,
            domain: new URL(item.link).hostname
          })));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

/**
 * Select 2-3 best competitors based on relevance
 */
function selectBestCompetitors(results, keyword) {
  if (results.length === 0) return [];

  // Filter out ads, non-content pages
  const candidates = results.filter(r => {
    const url = r.url.toLowerCase();
    return !url.includes('ads') &&
           !url.includes('facebook') &&
           !url.includes('linkedin') &&
           r.snippet.length > 50; // Has meaningful content
  });

  // Take best 3 (or less if not enough)
  return candidates.slice(0, 3).map((comp, idx) => ({
    ...comp,
    selected: true,
    relevanceScore: 1 - (idx * 0.1)
  }));
}

/**
 * Analyze competitor for patterns
 */
function analyzeCompetitor(competitor) {
  return {
    title: competitor.title,
    url: competitor.url,
    snippet: competitor.snippet,
    domain: competitor.domain,
    position: competitor.position,

    // Signals to extract
    signals: {
      hasNumberInTitle: /\d+/.test(competitor.title),
      hasQuestion: /\?|como|o que|quando|por que/.test(competitor.snippet.toLowerCase()),
      hasHow: /como|forma|maneira|passo|guia/.test(competitor.snippet.toLowerCase()),
      length: competitor.snippet.length,
      hasStatistics: /\d+%|\d+\s*(pessoas|anos|dias)/.test(competitor.snippet),
      language: 'portuguese'
    }
  };
}

/**
 * Run SERP analysis
 */
async function analyzeSERP() {
  console.log('🔎 PHASE 8: Google Search SERP Analysis\n');

  try {
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    const competitors = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      research: []
    };

    const validatedKeywords = keywordsData.keywords.filter(k => k.status === 'validated');
    console.log(`Found ${validatedKeywords.length} validated keywords\n`);

    // Sample first 5 keywords for demo
    const sample = validatedKeywords.slice(0, 5);

    for (const keyword of sample) {
      console.log(`\n🔍 Searching: "${keyword.keyword}"`);

      // Search Google
      const results = await googleSearch(keyword.keyword);
      console.log(`   Found ${results.length} results`);

      // Select best competitors
      const competitors_selected = selectBestCompetitors(results, keyword.keyword);
      console.log(`   Selected ${competitors_selected.length} competitors`);

      // Analyze each
      const analysis = competitors_selected.map(comp => {
        const analyzed = analyzeCompetitor(comp);
        console.log(`     • ${comp.domain} (#${comp.position})`);
        return analyzed;
      });

      // Store research
      competitors.research.push({
        id: keyword.id,
        keyword: keyword.keyword,
        theme: keyword.theme,
        subncho: keyword.subncho,
        category: keyword.category,
        totalResults: results.length,
        competitors: analysis,
        researchedAt: new Date().toISOString(),
        readyForClaude: analysis.length > 0
      });
    }

    // Save
    fs.writeFileSync(COMPETITORS_FILE, JSON.stringify(competitors, null, 2));

    console.log(`\n\n✅ SERP Analysis completed!`);
    console.log(`   Keywords researched: ${sample.length}`);
    console.log(`   Total competitor data: ${competitors.research.reduce((sum, r) => sum + r.competitors.length, 0)}`);
    console.log(`\n📊 Competitors data stored for Claude analysis`);
    console.log(`   PHASE 9: Claude Competitive Analysis`);

  } catch (error) {
    console.error('❌ SERP analysis failed:', error.message);
    process.exit(1);
  }
}

// Run
analyzeSERP();
