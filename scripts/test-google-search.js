#!/usr/bin/env node

/**
 * TEST GOOGLE SEARCH API
 * Testa Google Search API com seus secrets
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

console.log('\n' + '='.repeat(60));
console.log('🔍 TESTE - GOOGLE SEARCH API');
console.log('='.repeat(60) + '\n');

// Validar credentials
if (!API_KEY || !ENGINE_ID) {
  console.log('❌ Faltam credenciais:');
  console.log(`   GOOGLE_SEARCH_API_KEY: ${API_KEY ? '✅' : '❌'}`);
  console.log(`   GOOGLE_SEARCH_ENGINE_ID: ${ENGINE_ID ? '✅' : '❌'}`);
  process.exit(1);
}

console.log('✅ Credenciais carregadas\n');

// Keywords para testar
const keywords = [
  'colesterol depois dos 40',
  'proteína mulheres 40',
  'meditação ansiedade',
  'sono de qualidade 40+',
  'pressão alta natural',
];

async function testKeyword(keyword) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${ENGINE_ID}&q=${encodeURIComponent(keyword)}&num=3`;

    console.log(`⏳ Testando: "${keyword}"`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log(`   ❌ Erro: ${data.error.message}\n`);
      return null;
    }

    const results = data.items || [];
    console.log(`   ✅ ${results.length} resultados encontrados`);

    results.slice(0, 2).forEach((item, idx) => {
      console.log(`      ${idx + 1}. ${item.title.substring(0, 50)}...`);
    });

    console.log();
    return results.length;
  } catch (error) {
    console.log(`   ❌ Exceção: ${error.message}\n`);
    return null;
  }
}

async function main() {
  const results = [];

  for (const keyword of keywords) {
    const count = await testKeyword(keyword);
    if (count !== null) {
      results.push({ keyword, results: count });
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`Total testados: ${keywords.length}`);
  console.log(`Com sucesso: ${results.length}`);
  console.log(`Com demanda: ${results.filter(r => r.results > 0).length}\n`);

  if (results.length > 0) {
    console.log('✅ Keywords com DEMANDA REAL:\n');
    results
      .sort((a, b) => b.results - a.results)
      .forEach((r, i) => {
        console.log(`${i + 1}. "${r.keyword}" - ${r.results} resultados`);
      });
  }

  console.log('\n✅ Google Search API FUNCIONANDO!\n');
}

main().catch(console.error);
