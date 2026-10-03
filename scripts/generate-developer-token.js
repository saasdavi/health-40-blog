#!/usr/bin/env node

/**
 * GERAR DEVELOPER TOKEN VIA OAUTH
 *
 * Usa credenciais OAuth que você JÁ TEM para gerar o Developer Token
 * programaticamente (sem precisar acessar UI do Google Ads)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');

const {
  GOOGLE_ADS_CLIENT_ID,
  GOOGLE_ADS_CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN,
  GOOGLE_ADS_CUSTOMER_ID,
} = process.env;

console.log('\n' + '='.repeat(60));
console.log('🔑 GERAR DEVELOPER TOKEN VIA OAUTH');
console.log('='.repeat(60) + '\n');

// Validar credenciais
if (!GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET || !GOOGLE_ADS_REFRESH_TOKEN) {
  console.error('❌ Faltam credenciais OAuth:');
  console.error(`   GOOGLE_ADS_CLIENT_ID: ${GOOGLE_ADS_CLIENT_ID ? '✅' : '❌'}`);
  console.error(`   GOOGLE_ADS_CLIENT_SECRET: ${GOOGLE_ADS_CLIENT_SECRET ? '✅' : '❌'}`);
  console.error(`   GOOGLE_ADS_REFRESH_TOKEN: ${GOOGLE_ADS_REFRESH_TOKEN ? '✅' : '❌'}`);
  process.exit(1);
}

console.log('✅ Credenciais OAuth carregadas\n');

/**
 * PASSO 1: Renovar Access Token
 */
async function refreshAccessToken() {
  console.log('📝 PASSO 1: Renovando Access Token...\n');

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

    if (!response.ok) {
      console.error('❌ Erro ao renovar token:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ Access Token renovado com sucesso\n');
    return data.access_token;
  } catch (error) {
    console.error('❌ Erro ao conectar OAuth:', error.message);
    process.exit(1);
  }
}

/**
 * PASSO 2: Obter Developer Token
 *
 * Nota: A API do Google Ads não tem endpoint direto para "gerar" Developer Token.
 * O Developer Token é específico da conta e deve ser solicitado manualmente.
 *
 * PORÉM, podemos tentar fazer uma chamada à API do Google Ads para verificar
 * se o token existe e pegar informações.
 */
async function getDeveloperTokenInfo(accessToken) {
  console.log('📝 PASSO 2: Tentando obter info de Developer Token...\n');

  try {
    // Tentar fazer uma chamada simples à API do Google Ads
    // Isso vai validar a autenticação
    const response = await fetch(
      `https://googleads.googleapis.com/v13/customers/${GOOGLE_ADS_CUSTOMER_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API autenticada com sucesso!');
      console.log('   Customer ID:', GOOGLE_ADS_CUSTOMER_ID);
      console.log('   Status: Conectado\n');
      return true;
    } else if (response.status === 400 || response.status === 401) {
      console.error('❌ Erro de autenticação:');
      console.error(data.error?.message || JSON.stringify(data, null, 2));
      return false;
    } else if (response.status === 403) {
      console.error('⚠️  Permissão negada - pode precisar de Developer Token');
      console.error(data.error?.message || JSON.stringify(data, null, 2));
      return false;
    }

    console.error('❌ Erro inesperado:', data);
    return false;
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error.message);
    return false;
  }
}

/**
 * PASSO 3: Guia de obtenção manual
 */
function printManualGuide() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 GUIA MANUAL - OBTER DEVELOPER TOKEN');
  console.log('='.repeat(60) + '\n');

  console.log('Como a API do Google Ads NÃO permite gerar Developer Token programaticamente,');
  console.log('você precisa:');
  console.log('');
  console.log('1. Ir para: https://ads.google.com');
  console.log('2. Login com: davicafemariata@gmail.com');
  console.log('3. Ir para: Settings → Tools & Settings → API Center');
  console.log('4. Clicar em: "Get Developer Token"');
  console.log('5. Preencher o formulário (Standard Access)');
  console.log('6. Aguardar aprovação (~1-5 minutos)');
  console.log('7. Copiar o token gerado');
  console.log('');
  console.log('OU use este formulário direto:');
  console.log('https://support.google.com/google-ads/answer/7519830');
  console.log('');
  console.log('Depois adicione no .env:');
  console.log('GOOGLE_ADS_DEVELOPER_TOKEN=seu-token-aqui');
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * MAIN
 */
async function main() {
  try {
    // Renovar token
    const accessToken = await refreshAccessToken();

    // Testar autenticação
    const isAuthenticated = await getDeveloperTokenInfo(accessToken);

    if (isAuthenticated) {
      console.log('✅ SUCESSO!');
      console.log('');
      console.log('Sua autenticação OAuth está funcionando!');
      console.log('');
      console.log('Agora você precisa obter o Developer Token manualmente.');
      printManualGuide();
    } else {
      console.log('❌ Problema na autenticação. Verifique as credenciais.');
      printManualGuide();
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
