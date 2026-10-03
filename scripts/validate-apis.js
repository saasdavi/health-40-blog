#!/usr/bin/env node

/**
 * VALIDATE-APIS.js
 * Testa se TODAS as APIs estão funcionando de verdade
 * Não aceita "secrets configurados" - valida execução real
 */

import Anthropic from "@anthropic-ai/sdk";
import fetch from "node-fetch";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const results = {
  timestamp: new Date().toISOString(),
  apis: {},
};

// ============ TEST 1: Claude API ============
console.log("\n🧪 TEST 1: Claude API...");
try {
  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: "Responda em uma palavra: funciona?",
      },
    ],
  });

  const result = response.content[0].text;
  results.apis.claude = {
    status: "✅ FUNCIONANDO",
    model: "claude-3-5-haiku-20241022",
    response: result,
  };
  console.log(`✅ Claude API: ${result}`);
} catch (error) {
  results.apis.claude = {
    status: "❌ FALHA",
    error: error.message,
  };
  console.error(`❌ Claude API falhou:`, error.message);
}

// ============ TEST 2: Google Search API ============
console.log("\n🧪 TEST 2: Google Search API...");
try {
  const keyword = "colesterol depois dos 40";
  const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(keyword)}&num=3`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const resultCount = data.items ? data.items.length : 0;
  results.apis.googleSearch = {
    status: "✅ FUNCIONANDO",
    keyword,
    resultsFound: resultCount,
    topResults: data.items
      ? data.items.map((item) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet.substring(0, 100) + "...",
        }))
      : [],
  };
  console.log(
    `✅ Google Search API: ${resultCount} resultados encontrados`
  );
  results.apis.googleSearch.topResults.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.title}`);
  });
} catch (error) {
  results.apis.googleSearch = {
    status: "❌ FALHA",
    error: error.message,
  };
  console.error(`❌ Google Search API falhou:`, error.message);
}

// ============ TEST 3: Pexel API ============
console.log("\n🧪 TEST 3: Pexel API...");
try {
  const keyword = "saúde mulher";
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=3`;

  const response = await fetch(url, {
    headers: {
      Authorization: process.env.PEXEL_API_KEY,
    },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const resultCount = data.photos ? data.photos.length : 0;
  results.apis.pexel = {
    status: "✅ FUNCIONANDO",
    keyword,
    imagesFound: resultCount,
    topImages: data.photos
      ? data.photos.map((p) => ({
          photographer: p.photographer,
          url: p.src.medium,
          width: p.width,
          height: p.height,
        }))
      : [],
  };
  console.log(`✅ Pexel API: ${resultCount} imagens encontradas`);
  results.apis.pexel.topImages.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.photographer}`);
  });
} catch (error) {
  results.apis.pexel = {
    status: "❌ FALHA",
    error: error.message,
  };
  console.error(`❌ Pexel API falhou:`, error.message);
}

// ============ TEST 4: Pixabay API ============
console.log("\n🧪 TEST 4: Pixabay API...");
try {
  const keyword = "saúde mulher";
  const url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(keyword)}&per_page=3`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.hits === undefined) {
    throw new Error("Resposta inválida do Pixabay");
  }

  const resultCount = data.hits ? data.hits.length : 0;
  results.apis.pixabay = {
    status: "✅ FUNCIONANDO",
    keyword,
    imagesFound: resultCount,
    topImages: data.hits
      ? data.hits.map((h) => ({
          user: h.user,
          imageURL: h.webformatURL,
          likes: h.likes,
        }))
      : [],
  };
  console.log(`✅ Pixabay API: ${resultCount} imagens encontradas`);
  results.apis.pixabay.topImages.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.user} (${img.likes} likes)`);
  });
} catch (error) {
  results.apis.pixabay = {
    status: "❌ FALHA",
    error: error.message,
  };
  console.error(`❌ Pixabay API falhou:`, error.message);
}

// ============ SUMMARY ============
console.log("\n" + "=".repeat(60));
console.log("📊 RESUMO DE VALIDAÇÃO");
console.log("=".repeat(60));

const working = Object.entries(results.apis)
  .filter(([_, result]) => result.status.includes("FUNCIONANDO"))
  .map(([name, _]) => name);

const failed = Object.entries(results.apis)
  .filter(([_, result]) => result.status.includes("FALHA"))
  .map(([name, _]) => name);

console.log(`\n✅ FUNCIONANDO (${working.length}/4):`);
working.forEach((api) => {
  console.log(`   • ${api}`);
});

if (failed.length > 0) {
  console.log(`\n❌ FALHANDO (${failed.length}/4):`);
  failed.forEach((api) => {
    console.log(`   • ${api}`);
    console.log(`     ${results.apis[api].error}`);
  });
}

console.log("\n" + "=".repeat(60));

// Save results
import fs from "fs";
fs.writeFileSync(
  "data/api-validation-results.json",
  JSON.stringify(results, null, 2)
);
console.log("\n✅ Resultados salvos em: data/api-validation-results.json");
