#!/usr/bin/env node

/**
 * GOOGLE ADS KEYWORD PLANNER - IMPLEMENTAÇÃO REAL
 *
 * Usa Google Ads API para obter:
 * - Search volume real (monthly average)
 * - Competition level (HIGH/MEDIUM/LOW)
 * - Bid estimates
 * - Trends
 *
 * Requer:
 * - npm install google-ads-api
 * - GOOGLE_ADS_DEVELOPER_TOKEN
 * - GOOGLE_ADS_CUSTOMER_ID
 * - OAuth setup (client_id, client_secret, refresh_token)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ CONFIG ============
const {
  GOOGLE_ADS_DEVELOPER_TOKEN,
  GOOGLE_ADS_CUSTOMER_ID,
  GOOGLE_ADS_CLIENT_ID,
  GOOGLE_ADS_CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN,
} = process.env;

// Keywords para testar
const KEYWORDS_TO_RESEARCH = [
  'colesterol depois dos 40',
  'proteína mulheres 40',
  'meditação ansiedade',
  'sono de qualidade 40+',
  'pressão alta natural',
  'emagrecer depois dos 40',
  'exercício mulher 40',
  'metabolismo lento',
  'energia cansaço',
  'pele rugas 40',
];

// ============ VALIDATION ============
function validateCredentials() {
  const missing = [];

  if (!GOOGLE_ADS_DEVELOPER_TOKEN) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!GOOGLE_ADS_CUSTOMER_ID) missing.push('GOOGLE_ADS_CUSTOMER_ID');
  if (!GOOGLE_ADS_CLIENT_ID) missing.push('GOOGLE_ADS_CLIENT_ID');
  if (!GOOGLE_ADS_CLIENT_SECRET) missing.push('GOOGLE_ADS_CLIENT_SECRET');
  if (!GOOGLE_ADS_REFRESH_TOKEN) missing.push('GOOGLE_ADS_REFRESH_TOKEN');

  if (missing.length > 0) {
    console.error('❌ Faltam credenciais:');
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error('\nSetup: veja GOOGLE-ADS-SETUP.md');
    return false;
  }

  return true;
}

// ============ GOOGLE ADS CLIENT ============
class GoogleAdsKeywordPlanner {
  constructor() {
    this.credentials = {
      developerToken: GOOGLE_ADS_DEVELOPER_TOKEN,
      customerId: GOOGLE_ADS_CUSTOMER_ID,
      clientId: GOOGLE_ADS_CLIENT_ID,
      clientSecret: GOOGLE_ADS_CLIENT_SECRET,
      refreshToken: GOOGLE_ADS_REFRESH_TOKEN,
    };
  }

  /**
   * Obter Access Token via OAuth
   * Requer implementação real da Google Ads API library
   */
  async getAccessToken() {
    try {
      // TODO: Implementar OAuth token refresh
      // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({
      //     client_id: this.credentials.clientId,
      //     client_secret: this.credentials.clientSecret,
      //     refresh_token: this.credentials.refreshToken,
      //     grant_type: 'refresh_token',
      //   }),
      // });
      //
      // const data = await tokenResponse.json();
      // return data.access_token;

      console.log('   ⚠️  Usando credenciais diretas (refresh token)');
      return this.credentials.refreshToken;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error.message);
      return null;
    }
  }

  /**
   * Chamar Google Ads API - Keyword Ideas
   *
   * Endpoint: POST /v13/customers/{customer_id}/keywordPlanKeywordIdeas:generate
   */
  async generateKeywordIdeas(keyword) {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.log('   ❌ Token não disponível');
        return null;
      }

      const customerId = this.credentials.customerId.replace(/-/g, '');

      const requestBody = {
        keywordSeed: {
          keywords: [keyword],
        },
        geoTargetConstants: ['2076'], // Brazil
        languageConstantResourceName: 'googleAdsResources/language_constants/1000', // Portuguese
      };

      const response = await fetch(
        `https://googleads.googleapis.com/v13/customers/${customerId}/keywordPlanKeywordIdeas:generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'developer-token': this.credentials.developerToken,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log(`   ❌ API Error: ${error.error.message}`);
        return null;
      }

      const data = await response.json();
      return this.parseResults(data, keyword);
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse response e extrair métricaas
   */
  parseResults(response, originalKeyword) {
    if (!response.results || response.results.length === 0) {
      return null;
    }

    const results = [];

    for (const result of response.results) {
      if (result.text === originalKeyword) {
        // Encontrou o keyword exato
        const metrics = result.keywordIdeaMetrics;

        results.push({
          keyword: result.text,
          monthlySearchVolume: metrics.avgMonthlySearches || 0,
          competitionLevel: metrics.competition || 'UNKNOWN',
          competitionIndex: metrics.competitionIndex || 0,
          topOfPageBidLow: metrics.lowTopOfPageBidMicros
            ? metrics.lowTopOfPageBidMicros / 1000000
            : null,
          topOfPageBidHigh: metrics.highTopOfPageBidMicros
            ? metrics.highTopOfPageBidMicros / 1000000
            : null,
          trend: 'STABLE', // TODO: Extract from monthlySearchVolumes
        });
      }
    }

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Validar lote de keywords
   */
  async validateBatch(keywords) {
    const results = [];

    for (const keyword of keywords) {
      console.log(`   🔍 ${keyword}`);
      const result = await this.generateKeywordIdeas(keyword);

      if (result) {
        console.log(
          `      ✅ ${result.monthlySearchVolume} buscas/mês (${result.competitionLevel})`
        );
        results.push(result);
      } else {
        console.log(`      ⚠️  Sem dados`);
      }

      // Rate limiting (Google Ads API = 10k requests/day per customer)
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
    }

    return results;
  }
}

// ============ MAIN ============
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔑 GOOGLE ADS KEYWORD PLANNER - IMPLEMENTAÇÃO REAL');
  console.log('='.repeat(60) + '\n');

  // Validar credenciais
  if (!validateCredentials()) {
    process.exit(1);
  }

  console.log('✅ Credenciais validadas\n');

  // Instanciar cliente
  const planner = new GoogleAdsKeywordPlanner();

  // Testar 1 keyword primeiro
  console.log('📊 TESTE 1: Um keyword\n');
  const testKeyword = 'colesterol depois dos 40';
  console.log(`Testando: "${testKeyword}"\n`);

  const singleResult = await planner.generateKeywordIdeas(testKeyword);

  if (singleResult) {
    console.log('\n✅ SUCESSO! Dados obtidos:\n');
    console.log(JSON.stringify(singleResult, null, 2));
  } else {
    console.log('\n❌ Falha ao obter dados');
    console.log('Possíveis causas:');
    console.log('  1. Credenciais inválidas');
    console.log('  2. Developer token não aprovado');
    console.log('  3. Access token expirado');
    console.log('\nVeja GOOGLE-ADS-SETUP.md para troubleshooting');
    process.exit(1);
  }

  // Se sucesso, testar lote
  console.log('\n' + '='.repeat(60));
  console.log('📊 TESTE 2: Lote de keywords\n');

  const batchResults = await planner.validateBatch(KEYWORDS_TO_RESEARCH.slice(0, 5));

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`Total de keywords: ${KEYWORDS_TO_RESEARCH.length}`);
  console.log(`Testados: 5`);
  console.log(`Com dados: ${batchResults.length}\n`);

  if (batchResults.length > 0) {
    console.log('🎯 Keywords com maior demanda:\n');
    batchResults
      .sort((a, b) => b.monthlySearchVolume - a.monthlySearchVolume)
      .forEach((r, i) => {
        console.log(
          `${i + 1}. "${r.keyword}"`
        );
        console.log(
          `   ${r.monthlySearchVolume} buscas/mês | ${r.competitionLevel} competition`
        );
        if (r.topOfPageBidHigh) {
          console.log(
            `   Bid: $${r.topOfPageBidLow?.toFixed(2)} - $${r.topOfPageBidHigh.toFixed(2)}`
          );
        }
        console.log();
      });

    // Salvar resultados
    const outputFile = path.join(__dirname, '../data/google-ads-results.json');
    fs.writeFileSync(outputFile, JSON.stringify(batchResults, null, 2));
    console.log(`✅ Resultados salvos em: ${outputFile}\n`);
  }
}

main().catch(console.error);
