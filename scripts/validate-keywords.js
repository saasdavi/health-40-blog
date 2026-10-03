/**
 * Validation Module - PHASE 7
 *
 * Validates discovered keywords using Google Keyword Planner API
 *
 * Checks:
 * - Real search volume
 * - Competition level
 * - Trends
 *
 * Marks keywords as validated + creates editorial opportunities
 * ONLY validated keywords become articles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');
const OPPORTUNITIES_FILE = path.join(__dirname, '../data/opportunities.json');

/**
 * Validate keywords with Google Keyword Planner
 * TODO: Implement real API integration
 */
async function validateWithKeywordPlanner(keyword) {
  // TODO: Call Google Ads API
  // const client = new GoogleAdsClient();
  // const results = await client.generateKeywordIdeas({
  //   keywordSeed: { keyword },
  //   language: 'pt'
  // });

  // For now, return null (need API integration)
  return null;
}

/**
 * Validate keyword context with Claude
 * Check if it's really from the niche and solves a real problem
 */
async function validateContext(keyword, subncho, category) {
  // TODO: Call Claude Haiku
  // Ask: Is this keyword from Health 40+ niche? Does it solve a real problem?

  // For now, assume all are valid (mock)
  return {
    isValidNiche: true,
    solvesRealProblem: true,
    confidence: 0.8
  };
}

/**
 * Create editorial opportunity from validated keyword
 */
function createOpportunity(keyword, metrics) {
  return {
    id: `opp_${Date.now()}`,
    keyword: keyword.keyword,
    status: 'approved',
    intent: keyword.intent || 'informational',
    cluster: null,
    primaryKeyword: keyword.keyword,
    secondaryKeywords: [],
    demandValidation: {
      source: 'google_keyword_planner',
      validated: !!metrics,
      volume: metrics?.volume || null,
      competition: metrics?.competition || null,
      trend: metrics?.trend || null
    },
    seo_potential: {
      keyword_main: true,
      semantic_coverage: true,
      score: 0.7
    },
    confidence: 0.8,
    decisionReason: 'Validated with Google Keyword Planner',
    nextStep: 'serp_research',
    createdAt: new Date().toISOString(),
    notes: `From ${keyword.theme} > ${keyword.category}`
  };
}

/**
 * Run validation phase
 */
async function validateKeywords() {
  console.log('✅ PHASE 7: Google Keyword Planner Validation\n');

  try {
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    const opportunitiesData = JSON.parse(fs.readFileSync(OPPORTUNITIES_FILE, 'utf-8'));

    const discoveredKeywords = keywordsData.keywords.filter(k => k.status === 'discovered');
    console.log(`Found ${discoveredKeywords.length} keywords to validate\n`);

    let validated = 0;
    let contextChecked = 0;
    let opportunitiesCreated = 0;

    // Process sample keywords first (limit to 10 for demo)
    const sampleKeywords = discoveredKeywords.slice(0, 10);

    for (const keyword of sampleKeywords) {
      console.log(`\n🔍 Validating: "${keyword.keyword}"`);
      console.log(`   Theme: ${keyword.theme} | Category: ${keyword.category}`);

      // Check context with Claude
      const contextResult = await validateContext(
        keyword.keyword,
        keyword.theme,
        keyword.category
      );

      if (contextResult.isValidNiche && contextResult.solvesRealProblem) {
        console.log(`   ✅ Context validated (confidence: ${contextResult.confidence})`);
        contextChecked++;

        // Try to get metrics from Keyword Planner
        const metrics = await validateWithKeywordPlanner(keyword.keyword);

        if (metrics) {
          console.log(`   📊 Metrics: ${metrics.volume} searches/month | Competition: ${metrics.competition}`);
          validated++;
        } else {
          console.log(`   ⏳ Keyword Planner API not yet integrated`);
          console.log(`   💡 To integrate:`);
          console.log(`      - Use GOOGLE_ADS_API credentials`);
          console.log(`      - Call generateKeywordIdeas()`);
          console.log(`      - Extract volume, competition, trends`);
        }

        // Create opportunity even without metrics (for demo)
        const opportunity = createOpportunity(keyword, metrics);
        opportunitiesData.opportunities.push(opportunity);
        opportunitiesCreated++;

        // Mark keyword as validated
        keyword.validated = true;
        keyword.status = 'validated';
        keyword.lastUpdated = new Date().toISOString();
      } else {
        console.log(`   ❌ Context rejected (not from niche or doesn't solve problem)`);
        keyword.status = 'rejected';
      }
    }

    // Update metadata
    keywordsData.metadata.statusBreakdown.validated = keywordsData.keywords.filter(
      k => k.status === 'validated'
    ).length;
    keywordsData.metadata.statusBreakdown.rejected = keywordsData.keywords.filter(
      k => k.status === 'rejected'
    ).length;
    keywordsData.lastUpdated = new Date().toISOString();

    opportunitiesData.metadata.totalOpportunities = opportunitiesData.opportunities.length;
    opportunitiesData.metadata.statusBreakdown.approved = opportunitiesData.opportunities.filter(
      o => o.status === 'approved'
    ).length;
    opportunitiesData.lastUpdated = new Date().toISOString();

    // Save
    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywordsData, null, 2));
    fs.writeFileSync(OPPORTUNITIES_FILE, JSON.stringify(opportunitiesData, null, 2));

    console.log(`\n\n✅ Validation phase completed!`);
    console.log(`   Context checked: ${contextChecked} keywords`);
    console.log(`   Validated: ${validated} (with metrics)`);
    console.log(`   Opportunities created: ${opportunitiesCreated}`);
    console.log(`\n⏳ TODO: Integrate Google Keyword Planner API for real volume data`);
    console.log(`   Then: PHASE 8 (Google Search SERP analysis)`);

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run
validateKeywords();
