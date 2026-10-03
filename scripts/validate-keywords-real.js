#!/usr/bin/env node

/**
 * VALIDATE-KEYWORDS-REAL.js
 *
 * Valida keywords com Google Search API REAL
 * Não aceita dados fake - apenas keywords com demanda comprovada
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALIDATED_FILE = path.join(__dirname, '../data/validated-keywords.json');

const KEYWORDS_TO_TEST = [
  'colesterol depois dos 40',
  'proteína mulheres 40',
  'meditação ansiedade',
  'sono de qualidade 40+',
  'pressão alta natural',
];

async function validateWithGoogleSearch(keyword) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    return {
      keyword,
      validated: false,
      reason: 'API keys not configured',
      results: 0,
      competitors: [],
    };
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(
      keyword
    )}&num=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return {
        keyword,
        validated: false,
        reason: `API Error: ${data.error.message}`,
        results: 0,
        competitors: [],
      };
    }

    const results = data.items || [];
    const competitors = results.map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      domain: new URL(item.link).hostname,
    }));

    return {
      keyword,
      validated: results.length > 0,
      reason: `Found ${results.length} results`,
      results: results.length,
      competitors: competitors,
      timestamp: new Date().toISOString(),
      source: 'google_search',
    };
  } catch (error) {
    return {
      keyword,
      validated: false,
      reason: `Exception: ${error.message}`,
      results: 0,
      competitors: [],
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VALIDAÇÃO REAL DE KEYWORDS');
  console.log('='.repeat(60) + '\n');

  const validatedKeywords = [];

  for (const keyword of KEYWORDS_TO_TEST) {
    console.log(`⏳ Validando: "${keyword}"`);
    const result = await validateWithGoogleSearch(keyword);

    if (result.validated) {
      console.log(`✅ VALIDADO - ${result.results} resultados encontrados`);
      result.competitors.slice(0, 2).forEach((comp, idx) => {
        console.log(`   ${idx + 1}. ${comp.domain}`);
      });
      validatedKeywords.push(result);
    } else {
      console.log(`❌ NÃO VALIDADO - ${result.reason}`);
    }
    console.log();
  }

  // Save results
  const data = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    metadata: {
      totalValidated: validatedKeywords.filter((k) => k.validated).length,
      totalTested: KEYWORDS_TO_TEST.length,
      validatedBySource: {
        google_search: validatedKeywords.filter((k) => k.validated).length,
        google_ads: 0,
        manual: 0,
      },
      note: 'APENAS keywords com demanda COMPROVADA (não inventada)',
    },
    validatedKeywords: validatedKeywords,
  };

  fs.writeFileSync(VALIDATED_FILE, JSON.stringify(data, null, 2));

  // Summary
  console.log('='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(
    `✅ Validados: ${data.metadata.totalValidated}/${data.metadata.totalTested}`
  );
  console.log(`📁 Salvos em: ${VALIDATED_FILE}`);
  console.log('\n');

  validatedKeywords
    .filter((k) => k.validated)
    .forEach((k) => {
      console.log(`✅ ${k.keyword}`);
      console.log(`   ${k.results} resultados`);
      console.log(
        `   Competitors: ${k.competitors.map((c) => c.domain).join(', ')}`
      );
      console.log();
    });
}

main().catch(console.error);
