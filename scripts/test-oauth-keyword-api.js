#!/usr/bin/env node

/**
 * TESTAR GOOGLE ADS API COM OAUTH 2.0 DIRETO
 *
 * Sem Developer Token - apenas com OAuth 2.0 Refresh Token
 */

import dotenv from 'dotenv';
dotenv.config();

const {
  GOOGLE_ADS_CLIENT_ID,
  GOOGLE_ADS_CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN,
  GOOGLE_ADS_CUSTOMER_ID,
} = process.env;

console.log('\n' + '='.repeat(60));
console.log('🧪 TESTE - GOOGLE ADS API COM OAUTH 2.0 PURO');
console.log('='.repeat(60) + '\n');

// Validar
if (!GOOGLE_ADS_REFRESH_TOKEN || !GOOGLE_ADS_CUSTOMER_ID) {
  console.error('❌ Faltam credenciais');
  process.exit(1);
}

/**
 * PASSO 1: Obter Access Token
 */
async function getAccessToken() {
  console.log('📝 PASSO 1: Obtendo Access Token via OAuth...\n');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_ADS_CLIENT_ID,
        client_secret: GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      console.error('❌ Erro:', data.error_description || data);
      process.exit(1);
    }

    console.log('✅ Access Token obtido!\n');
    return data.access_token;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

/**
 * PASSO 2: Tentar chamar Google Ads API SEM Developer Token
 */
async function testKeywordAPI(accessToken) {
  console.log('📝 PASSO 2: Tentando chamar Google Ads API (SEM Developer Token)...\n');

  const customerId = GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');

  try {
    const response = await fetch(
      `https://googleads.googleapis.com/v13/customers/${customerId}/keywordPlanKeywordIdeas:generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywordSeed: {
            keywords: ['colesterol depois dos 40'],
          },
          geoTargetConstants: ['2076'],
          languageConstantResourceName: 'googleAdsResources/language_constants/1000',
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCESSO! API respondeu!');
      console.log('Resultado:', JSON.stringify(data, null, 2));
      return true;
    }

    // Analisar erro
    console.log(`❌ Erro HTTP ${response.status}:`);
    console.log(JSON.stringify(data, null, 2));

    // Verificar se é erro de Developer Token
    const errorMsg = JSON.stringify(data).toLowerCase();
    if (errorMsg.includes('developer') || errorMsg.includes('token')) {
      console.log('\n💡 Conclusão: PRECISA DE DEVELOPER TOKEN');
      return false;
    }

    if (errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
      console.log('\n💡 Conclusão: Problema de permissão/autenticação');
      return false;
    }

    console.log('\n💡 Conclusão: Erro diferente de Developer Token');
    return false;

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * MAIN
 */
async function main() {
  try {
    const accessToken = await getAccessToken();
    const success = await testKeywordAPI(accessToken);

    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 FUNCIONOU! A API responde com OAuth 2.0 puro!');
    } else {
      console.log('⚠️  A API pediu Developer Token ou teve outro erro');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
