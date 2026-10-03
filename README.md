# Health 40+ Blog

Autonomous demand discovery + content production system for **Saúde após os 40** (Health 40+) niche.

## 🎯 Objective

Build a system that continuously:
1. Discovers demand via keyword research
2. Validates opportunities with real data
3. Plans editorial content
4. Produces original, useful articles
5. Publishes automatically
6. Measures performance and feeds back into discovery

**Maximum 2 articles per day** | **100% automated after setup**

## 📊 Architecture

```
Demand Discovery
  ↓
Keyword Expansion (Google Keyword Planner + Autocomplete)
  ↓
Validation (Haiku/Claude - editorial + SEO)
  ↓
SERP Research (Google Custom Search)
  ↓
Competitive Analysis (Haiku/Claude)
  ↓
Content Production (Haiku/Claude)
  ↓
Editorial Review (Haiku/Claude)
  ↓
Publication (GitHub + Astro + Vercel)
  ↓
Performance Tracking (Search Console)
  ↓
Auto-feeding back to Discovery
```

## 📁 Project Structure

```
health-40-blog/
├── src/
│   ├── pages/          # Astro pages
│   ├── layouts/        # Astro layouts
│   └── components/     # Astro components
├── content/
│   └── articles/       # Markdown articles
├── data/               # JSON database
│   ├── seeds.json
│   ├── keywords.json
│   ├── clusters.json
│   ├── opportunities.json
│   ├── editorial-calendar.json
│   ├── articles.json
│   └── performance.json
├── scripts/            # Node.js automation
│   ├── discovery.js
│   ├── validation.js
│   └── production.js
└── .github/workflows/  # GitHub Actions automation
    ├── discovery.yml
    ├── validation.yml
    ├── planning.yml
    └── production.yml
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
cp .env.example .env
# Add your API keys to .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Discovery (First Time)

```bash
npm run discovery
```

### 4. Validate Keywords

```bash
npm run validation
```

### 5. Build & Preview

```bash
npm run build
npm run preview
```

### 6. Deploy to Vercel

```bash
# Connect GitHub to Vercel
# Vercel will auto-deploy on each push
```

## 📋 Data Schema

### Keywords (`data/keywords.json`)

Each keyword contains:
- Volume & competition metrics
- Intent classification
- Status tracking
- Validation history

### Clusters (`data/clusters.json`)

Grouped keywords by semantic intent to avoid cannibalization.

### Opportunities (`data/opportunities.json`)

Validated editorial opportunities ready for production.

### Editorial Calendar (`data/editorial-calendar.json`)

Master publishing schedule (max 2/day).

### Articles (`data/articles.json`)

Published content with SEO metrics and health safety flags.

### Performance (`data/performance.json`)

Search Console data feeding back into discovery.

## 🔑 Key Principles

1. **Never invent data** - All metrics from real APIs
2. **Separate collection from intelligence** - APIs collect, Claude validates
3. **Quality > Quantity** - 2 articles/day max
4. **No copying** - Analyze patterns, create better
5. **Health-first** - Verify sources, no medical claims

## 🛠 Automation with GitHub Actions

Workflows run on schedule:

- `discovery.yml` - Expand keywords (daily)
- `validation.yml` - Validate with APIs (daily)
- `planning.yml` - Create calendar entries (daily)
- `production.yml` - Write & publish articles (twice daily)

## 📊 Implementation Status

**FASES COMPLETAS:**
- ✅ FASE 1-5: Arquitetura base + 444 keywords
- ✅ FASE 6: Expansão hierárquica de keywords
- ✅ FASE 7: Validação com Google Keyword Planner (estrutura)
- ✅ FASE 8: SERP Research com Google Custom Search (estrutura)
- ✅ FASE 9: Análise competitiva com Claude (estrutura)
- ✅ FASE 10: Content Production com integração Claude
- ✅ FASE 11: Editorial Review + Quality Check
- ✅ FASE 12: Publication Pipeline

**PRÓXIMAS:**
- [ ] FASE 13: Search Console integration
- [ ] FASE 14: GitHub Actions automation
- [ ] FASE 15-18: Scheduling, feedback loop, optimization

## 📝 Contributing

This is an autonomous system. Make changes to:
- Data schemas in `/data`
- Automation scripts in `/scripts`
- Workflows in `.github/workflows`

Never manually create keywords or articles - let the system discover and produce them.

## 📄 License

MIT
