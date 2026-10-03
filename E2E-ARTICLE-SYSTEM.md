# Sistema E-E-A-T para Artigos - Documentação Completa

Versão: 1.0.0  
Data: 3 de outubro de 2026  
Status: **OPERACIONAL**

---

## 1. O Sistema E-E-A-T

Este é um pipeline completo para gerar, validar e publicar **30 artigos de alta qualidade** (1500-2500 palavras) com garantia de **E-E-A-T** (Experiência, Especialidade, Autoridade, Confiança).

### Objetivo
- **30 artigos** em 4-5 meses (2-3 por semana)
- **Score 85+ E-E-A-T** em 100% dos artigos
- **Confiança total** do Google (YMYL compliance)
- **Monetização integrada** (Mounjaxi)

---

## 2. Arquivos Criados

### Biblioteca TypeScript
**`src/lib/article-template.ts`**
- Função: `generateArticleTemplate(keyword, searchVolume, competitionData)`
- Tipos: ArticleTemplate, ArticleSource, ImageCredit, etc.
- Validação: `validateEEATStructure(article)` retorna score 0-100
- Cálculo: `calculateReadingTime(wordCount)`

### Componentes Astro
**`src/components/ArticleDisclaimer.astro`**
- Aviso de saúde obrigatório (E-E-A-T: Confiança)
- Variantes: warning, info, important
- Props: message, doctorConsultation, variant
- Styling: dark mode support

**`src/components/ArticleSources.astro`**
- Seção de "Fontes e Referências" (E-E-A-T: Autoridade)
- Créditos de imagem (Pexels, Pixabay, etc)
- Props: sources[], imageCredits[], title, showCredits
- Tipagem completa

### Dados & Configuração
**`data/article-structure.json`**
- 5 templates de estrutura:
  - `default`: Estrutura completa padrão
  - `problema-solucao`: Focado em resolver problema
  - `comparacao`: Compara opções/abordagens
  - `guia-completo`: Cobertura máxima
  - `ano-novo`: Metas e transformação
- Guidelines de E-E-A-T integradas

**`data/article-guidelines.md`**
- 15+ páginas de instruções
- Checklist E-E-A-T linha por linha
- Exemplos: ❌ genérico vs ✅ E-E-A-T
- Ao vivo para Claude seguir

### Scripts de Automação
**`scripts/generate-article.js`**
- Gera prompt para Claude
- Cria template de seções
- Salva prompt em arquivo
- Uso: `node scripts/generate-article.js "palavra-chave"`

**`scripts/validate-e-e-a-t.js`**
- Valida 4 pilares: Experiência, Especialidade, Autoridade, Confiança
- Breakdown detalhado por pilar
- Score final 0-100 (target: 85+)
- Uso: `node scripts/validate-e-e-a-t.js [arquivo.json]`

**`scripts/publish-e2e-article.js`**
- Publica artigo se score >= 85
- Atualiza índice em data/articles.json
- Metadata automática
- Uso: `node scripts/publish-e2e-article.js data/articles/slug.json`

**`scripts/schedule-e2e-publication.js`**
- Agenda 2-3 artigos por semana
- Calendário automático (terça e sexta)
- Gera publication-schedule.json
- Uso: `node scripts/schedule-e2e-publication.js --start-date=2026-10-10`

---

## 3. Fluxo de Trabalho Completo

### Passo 1: Gerar Artigo
```bash
# Gera prompt e template para Claude
node scripts/generate-article.js "colesterol depois dos 40"
```

**Output:**
- `data/articles/colesterol-depois-dos-40.json.prompt.txt`
  - Prompt completo para colar no Claude

### Passo 2: Claude Escreve o Artigo
1. Abra https://claude.ai/new
2. Cole o prompt do Passo 1
3. Claude retorna JSON completo
4. Copie a resposta JSON
5. Salve em: `data/articles/colesterol-depois-dos-40.json`

**Estrutura JSON esperada:**
```json
{
  "title": "...",
  "seoTitle": "...",
  "description": "...",
  "slug": "...",
  "keywords": { "primary": "...", "secondary": [...] },
  "author": "Saúde 40+",
  "content": "...",
  "sources": [...],
  "sections": [...],
  "disclaimer": "...",
  "healthWarning": {...},
  "wordCount": 1800,
  "difficulty": "intermediate"
}
```

### Passo 3: Validar E-E-A-T
```bash
# Valida artigo individual
node scripts/validate-e-e-a-t.js data/articles/colesterol-depois-dos-40.json

# Valida todos
node scripts/validate-e-e-a-t.js
```

**Output esperado:**
```
SCORE TOTAL: 92/100 ✅

BREAKDOWN:
  • Experiência (E): 95/100 ✅
  • Especialidade (E): 88/100 ✅
  • Autoridade (A): 90/100 ✅
  • Confiança (T): 92/100 ✅

PROBLEMAS ENCONTRADOS:
  ✓ (none)

PRONTO PARA PUBLICAR!
```

### Passo 4: Publicar Artigo
```bash
# Publica se score >= 85
node scripts/publish-e2e-article.js data/articles/colesterol-depois-dos-40.json

# Ou forçar mesmo com score baixo (não recomendado)
node scripts/publish-e2e-article.js data/articles/colesterol-depois-dos-40.json --force
```

**Output:**
- Artigo marcado como "published"
- Índice atualizado em data/articles.json
- Metadata de validação adicionada

### Passo 5: Agendar Publicações
```bash
# Agenda todos os artigos (2 por semana, começando 10/10)
node scripts/schedule-e2e-publication.js --start-date=2026-10-10 --frequency=2 --count=30
```

**Output:**
- `data/publication-schedule.json`
- Cronograma de 30 artigos em ~4 meses

---

## 4. Critérios E-E-A-T Detalhados

### EXPERIÊNCIA (Experience) - 25%

Demonstrar que você REALMENTE entende o problema.

**Checklist:**
- [ ] Autor identificado
- [ ] Bio do autor
- [ ] Disclaimer de saúde
- [ ] 3+ fontes citadas
- [ ] Health warning ativo

**Pontos extras:**
- Validar experiência do leitor 40+
- Mostrar humildade ("aprendemos")
- Reconhecer dificuldades reais

### ESPECIALIDADE (Expertise) - 25%

Conhecimento profundo, não superficial.

**Checklist:**
- [ ] 1500+ palavras
- [ ] 4-6 seções H2
- [ ] 3-4 H3 por H2
- [ ] Dados/números específicos
- [ ] Sem cópia de outros

**Exemplos ruins:**
- "Exercício é bom para saúde" ❌
- "150 min/semana reduz pressão 5-8 mmHg (2023)" ✅

### AUTORIDADE (Authority) - 25%

Ser visto como referência confiável.

**Checklist:**
- [ ] Breadcrumbs presentes
- [ ] Schema.org markup correto
- [ ] 3-5 links internos
- [ ] 3-5 links para autoridades (Mayo, Harvard, NIH)
- [ ] Datas de publicação/atualização claras

### CONFIANÇA (Trust) - 25%

Transparência total. Segurança do leitor.

**Checklist:**
- [ ] Alt text descritivo em TODA imagem
- [ ] Crédito de imagem visível
- [ ] Seção de Fontes no final
- [ ] Health Warning ativo
- [ ] Transparência sobre afiliação
- [ ] Linguagem não-absoluta ("pode" não "vai curar")

---

## 5. Templates de Estrutura

### Template Default (6 seções)
1. O que é [TOPIC]?
2. Causas e Fatores de Risco
3. Sinais e Sintomas
4. Estratégias Práticas
5. Tratamentos Profissionais
6. Conclusão e Próximos Passos

### Template Problema > Solução
1. O Problema
2. Raízes e Causas
3. Soluções Imediatas (Curto Prazo)
4. Transformação Completa (Longo Prazo)
5. Evitando Armadilhas Comuns
6. Seu Plano de Ação

Mais 3 templates em `data/article-structure.json`

---

## 6. Componentes Astro Integrados

### ArticleDisclaimer
```astro
<ArticleDisclaimer 
  message="Aviso padrão de saúde..."
  doctorConsultation={true}
  variant="warning"
/>
```

**Variantes:** warning (laranja), info (azul), important (vermelho)

### ArticleSources
```astro
<ArticleSources 
  sources={[
    {
      title: "Mayo Clinic",
      url: "https://...",
      type: "medical",
      author: "Dr. X",
      publicationDate: "2026-10-03"
    }
  ]}
  imageCredits={[...]}
  showCredits={true}
/>
```

**Tipos aceitos:** scientific, medical, news, health, blog

---

## 7. Exemplo de Artigo Completo E-E-A-T

Veja `data/article-guidelines.md` seção "Exemplo Completo" para:
- Versão ❌ genérica (Score: 30/100)
- Versão ✅ E-E-A-T (Score: 92/100)

---

## 8. Métricas e Monitoramento

### Score Final
- **0-50**: Rejeitado (não publicar)
- **50-85**: Revisar (faltas importantes)
- **85-95**: Aprovado (publicar normalmente)
- **95-100**: Excelente (modelo para outros)

### Breakdown por Pilar
Cada pilar tem 0-100. Total é média ponderada.

### Relatório Detalhado
```bash
node scripts/validate-e-e-a-t.js >> validation-report.txt
```

---

## 9. Próximos Passos

### Imediato
1. [ ] Claude gera Artigo #1 (palavra-chave principal)
2. [ ] Valida com validate-e-e-a-t.js
3. [ ] Publica com publish-e2e-article.js
4. [ ] Testa rendering em Astro

### Curto Prazo (Semanas 1-2)
1. [ ] Gerar 5-10 artigos piloto
2. [ ] Validar score 85+
3. [ ] Publicar e monitorar
4. [ ] Ajustar prompts conforme feedback

### Médio Prazo (Meses 1-2)
1. [ ] Escalar para 30 artigos
2. [ ] Agendar 2-3 por semana
3. [ ] Monitorar SEO/tráfego
4. [ ] Refinar templates

### Longo Prazo (Meses 2-4)
1. [ ] 30 artigos publicados
2. [ ] Autoridade estabelecida
3. [ ] Monetização via Mounjaxi ativa
4. [ ] Plano de renovação de conteúdo

---

## 10. Troubleshooting

### Problema: Score < 85
**Solução:**
1. Leia os "PROBLEMAS ENCONTRADOS" na validação
2. Revise artigo conforme checklist de E-E-A-T
3. Valide novamente

### Problema: Alt text muito curto
**Solução:** Alt text deve ser 100-150 caracteres descritivos
```
❌ "imagem de exercício"
✅ "Mulher de 45 anos em tapete de yoga fazendo alongamento matinal"
```

### Problema: Sem fontes suficientes
**Solução:** Cite 3+ de: Mayo Clinic, Harvard Health, NIH, CDC, WebMD
```json
"sources": [
  {
    "title": "Mayo Clinic - Cardiac Health",
    "url": "https://...",
    "type": "medical"
  }
]
```

### Problema: Publicação falhada
**Use --force:**
```bash
node scripts/publish-e2e-article.js article.json --force
```

---

## 11. Contato & Suporte

Para perguntas sobre E-E-A-T:
- Leia `data/article-guidelines.md` (guia completo)
- Revise exemplos ✅ vs ❌
- Execute validação e siga recomendações

---

**Sistema criado:** 3 de outubro de 2026  
**Versão:** 1.0.0  
**Status:** Pronto para usar  
**Alvo:** 30 artigos em 4-5 meses com 85+ E-E-A-T
