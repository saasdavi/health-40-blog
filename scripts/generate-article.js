#!/usr/bin/env node

/**
 * generate-article.js
 * Gera artigo usando Claude (E-E-A-T template)
 *
 * Uso: node scripts/generate-article.js "palavra-chave" --output=slug.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * Template de instrução para Claude gerar artigo E-E-A-T
 */
function generateClaudePrompt(keyword, structure, guidelines) {
  return `# Tarefa: Gerar Artigo E-E-A-T Completo

Você é um especialista em saúde preventiva para adultos 40+.
Gere um artigo de ALTA QUALIDADE sobre: "${keyword}"

## Contexto
- Público-alvo: Mulheres e homens 40+
- Tom: Profissional, acessível, não condescendente
- Formato: Deve seguir a estrutura E-E-A-T rigorosamente
- Tamanho: 1500-2500 palavras
- Sem cópia: 100% original

## Estrutura Obrigatória
\`\`\`json
${JSON.stringify(structure, null, 2)}
\`\`\`

## Diretrizes E-E-A-T
${guidelines}

## Output Esperado
Retorne um JSON válido com esta estrutura:
\`\`\`json
{
  "title": "...",
  "seoTitle": "...",
  "description": "...",
  "slug": "...",
  "keywords": {
    "primary": "${keyword}",
    "secondary": [...]
  },
  "author": "Saúde 40+",
  "authorBio": "...",
  "content": "<!-- markdown completo do artigo -->",
  "sources": [
    {
      "title": "...",
      "url": "https://...",
      "type": "scientific|medical|news|health|blog"
    }
  ],
  "wordCount": NUMBER,
  "difficulty": "beginner|intermediate|advanced",
  "sections": [
    {
      "h2": "...",
      "h3s": ["...", "..."],
      "content": "...",
      "images": [...]
    }
  ]
}
\`\`\`

## Checklist Crítico
- [ ] Tem author identificado
- [ ] Tem disclaimer de saúde
- [ ] Tem 3+ fontes (scientific ou medical)
- [ ] Tem 1500+ palavras
- [ ] Tem alt text em todas imagens
- [ ] H2 > H3 hierarquia válida
- [ ] Sem linguagem absoluta (usa "pode", não "vai curar")
- [ ] Reconhece realidade dos 40+
- [ ] Tem dados/números específicos

## Comece o artigo agora:`;
}

/**
 * Cria estrutura padrão de seções
 */
function loadArticleStructure() {
  const structPath = path.join(ROOT, 'data', 'article-structure.json');
  const content = fs.readFileSync(structPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Carrega guidelines de E-E-A-T
 */
function loadArticleGuidelines() {
  const guidePath = path.join(ROOT, 'data', 'article-guidelines.md');
  return fs.readFileSync(guidePath, 'utf-8');
}

/**
 * Salva artigo gerado
 */
function saveArticle(article, outputPath) {
  const fullPath = outputPath.startsWith('/')
    ? outputPath
    : path.join(ROOT, 'data', 'articles', outputPath);

  // Garante diretório
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, JSON.stringify(article, null, 2), 'utf-8');
  return fullPath;
}

/**
 * CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node scripts/generate-article.js "keyword" [options]

Options:
  --output=file.json     Output file (default: slug.json)
  --template=type        Template type (default, problema-solucao, etc)
  --no-validate          Skip validation after generation

Examples:
  node scripts/generate-article.js "colesterol depois dos 40"
  node scripts/generate-article.js "exercício aos 40" --output=exercicio-40.json
    `);
    process.exit(0);
  }

  const keyword = args[0];
  let outputFile = `${keyword.toLowerCase().replace(/\s+/g, '-').slice(0, 50)}.json`;
  let templateType = 'default';
  let validate = true;

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--output=')) {
      outputFile = args[i].replace('--output=', '');
    } else if (args[i].startsWith('--template=')) {
      templateType = args[i].replace('--template=', '');
    } else if (args[i] === '--no-validate') {
      validate = false;
    }
  }

  console.log('\n📝 GERADOR DE ARTIGOS E-E-A-T\n');
  console.log(`Palavra-chave: ${keyword}`);
  console.log(`Template: ${templateType}`);
  console.log(`Output: ${outputFile}\n`);

  try {
    // Load resources
    const structure = loadArticleStructure();
    const guidelines = loadArticleGuidelines();

    // Select template
    const selectedTemplate = structure.templates[templateType] || structure.templates.default;

    // Generate prompt
    const prompt = generateClaudePrompt(keyword, selectedTemplate, guidelines);

    console.log('📌 INSTRUÇÃO PARA CLAUDE:');
    console.log('=' * 70);
    console.log(prompt.slice(0, 500) + '...\n');

    console.log(
      '⏳ Para usar este script, configure integração com Claude API:\n' +
      '   1. Abra: https://claude.ai/new\n' +
      '   2. Cole o prompt acima\n' +
      '   3. Copie o JSON gerado\n' +
      '   4. Salve em data/articles/seu-slug.json\n'
    );

    console.log(
      '💡 Alternativa: Implementar Anthropic SDK para automação completa.'
    );

    // Save prompt template
    const promptPath = path.join(ROOT, 'data', 'articles', `${outputFile}.prompt.txt`);
    const promptDir = path.dirname(promptPath);
    if (!fs.existsSync(promptDir)) {
      fs.mkdirSync(promptDir, { recursive: true });
    }
    fs.writeFileSync(promptPath, prompt);
    console.log(`\n✅ Prompt salvo em: ${promptPath}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
