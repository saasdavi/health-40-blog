# ✅ Google Ads Keyword Planner - Implementação

## STATUS ATUAL

| Item | Status | Ação |
|------|--------|------|
| Developer Token | ❓ VERIFICAR | Você tem? |
| OAuth Credentials | ✅ Tem secrets no GitHub | OK |
| Script implementado | ✅ PRONTO | `scripts/google-ads-keyword-planner-real.js` |
| Testes | 🚧 Ready para testar | Quando tiver token |

---

## ⚡ QUICK START (2 OPÇÕES)

### OPÇÃO A: Você JÁ TEM Developer Token

```bash
# 1. Exportar secrets localmente
export GOOGLE_ADS_DEVELOPER_TOKEN="seu-token-aqui"
export GOOGLE_ADS_CUSTOMER_ID="1234567890"
export GOOGLE_ADS_CLIENT_ID="seu-client-id"
export GOOGLE_ADS_CLIENT_SECRET="seu-client-secret"
export GOOGLE_ADS_REFRESH_TOKEN="seu-refresh-token"

# 2. Testar script
node scripts/google-ads-keyword-planner-real.js

# 3. Se funcionar, vai retornar:
{
  "keyword": "colesterol depois dos 40",
  "monthlySearchVolume": 1240,
  "competitionLevel": "HIGH",
  "topOfPageBidLow": 0.45,
  "topOfPageBidHigh": 2.30
}
```

### OPÇÃO B: Você NÃO TEM Developer Token

```bash
# 1. Ler guia completo
cat GOOGLE-ADS-SETUP.md

# 2. Gerar Developer Token (15 min)
# https://ads.google.com → Settings → API Center → Get Developer Token

# 3. Adicionar no GitHub Secrets
# Settings → Secrets → GOOGLE_ADS_DEVELOPER_TOKEN

# 4. Voltar aqui e rodar OPÇÃO A
```

---

## 🔍 VALIDAÇÃO - PASSO A PASSO

### PASSO 1: Verificar que você TEM Developer Token

```bash
# No seu Google Ads account:
# 1. https://ads.google.com
# 2. Settings (⚙️) → API Center
# 3. Deve ter um token aqui com status "Approved"
# 4. Copiar para guardar
```

### PASSO 2: Testar localmente

```bash
cd /home/user/health-40-blog

# Criar .env com seus secrets
cat > .env << EOF
GOOGLE_ADS_DEVELOPER_TOKEN=seu-token-aqui
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=seu-client-secret
GOOGLE_ADS_REFRESH_TOKEN=seu-refresh-token
EOF

# Rodar teste
node scripts/google-ads-keyword-planner-real.js
```

### PASSO 3: Se funcionar, commit para GitHub

```bash
# Adicionar secrets no GitHub
# Settings → Secrets and variables → Actions → New repository secret

# Secrets necessários:
# - GOOGLE_ADS_DEVELOPER_TOKEN
# - GOOGLE_ADS_CUSTOMER_ID
# - GOOGLE_ADS_CLIENT_ID
# - GOOGLE_ADS_CLIENT_SECRET
# - GOOGLE_ADS_REFRESH_TOKEN

git add .
git commit -m "feat: implementar Google Ads Keyword Planner API real"
git push
```

---

## 📊 O QUE FUNCIONA QUANDO RODADO

Script vai:

1. **Validar credenciais** ✅
   ```
   ✅ Credenciais validadas
   ```

2. **Testar 1 keyword** ✅
   ```
   🔍 colesterol depois dos 40
      ✅ 1240 buscas/mês (HIGH)
   ```

3. **Testar lote de 5 keywords** ✅
   ```
   🔍 colesterol depois dos 40 → 1240 (HIGH)
   🔍 proteína mulheres 40 → 850 (MEDIUM)
   🔍 meditação ansiedade → 2100 (HIGH)
   ...
   ```

4. **Salvar resultados** ✅
   ```
   ✅ Resultados salvos em: data/google-ads-results.json
   ```

---

## 🎯 PRÓXIMOS PASSOS (Quando API funcionar)

### 1. Integrar com Validation Pipeline

```bash
# scripts/validate-all-keywords.js
# Vai rodar:
# 1. Expandir keywords com Google Search API
# 2. Validar volume com Google Ads API
# 3. Salvar em Supabase (ou JSON)
# 4. Criar opportunities.json com dados REAIS
```

### 2. Criar Production Pipeline

```bash
# Para cada keyword validado:
# 1. Google Search API: buscar 2-3 competitors
# 2. Claude: analisar estrutura/gaps
# 3. Claude: escrever artigo original
# 4. Publicar com imagens Pexel
```

### 3. Automação GitHub Actions

```yaml
# .github/workflows/daily-keyword-validation.yml
# Roda 9h UTC todo dia:
# 1. Expandir 50 keywords novos
# 2. Validar com Google Ads API
# 3. Gerar oportunidades
# 4. Produzir 2-3 artigos
```

---

## ⚠️ TROUBLESHOOTING

| Erro | Causa | Solução |
|------|-------|---------|
| `GOOGLE_ADS_DEVELOPER_TOKEN undefined` | Não tem no .env ou secrets | Gerar em https://ads.google.com → API Center |
| `UNAUTHENTICATED` | Refresh token expirado | Renovar em Google Cloud Console |
| `PERMISSION_DENIED` | Developer token não aprovado | Esperar ~5 min, depois tentar de novo |
| `RESOURCE_EXHAUSTED` | Rate limit (10k/day) | Aguardar 1 minuto antes de próxima call |
| `Response code: 400` | Request inválido | Verificar customer_id (sem hífens) |

---

## 📚 RECURSOS

- Setup completo: `GOOGLE-ADS-SETUP.md`
- Script implementado: `scripts/google-ads-keyword-planner-real.js`
- Google Ads API Docs: https://developers.google.com/google-ads/api
- Keyword Planning: https://developers.google.com/google-ads/api/docs/keyword_planning

---

## ✅ CHECKLIST - QUANDO READY

- [ ] Developer Token gerado em Google Ads API Center
- [ ] Token status = "Approved"
- [ ] Script `google-ads-keyword-planner-real.js` testado localmente
- [ ] Secrets adicionados no GitHub
- [ ] Script rodando via GitHub Actions
- [ ] Resultados salvos em `data/google-ads-results.json`
- [ ] Keywords com demanda REAL validados

---

## 🚀 QUANDO FUNCIONAR

Sistema vai ter **DADOS REAIS**, não fake:

✅ Keywords com volume comprovado  
✅ Competition level verdadeiro  
✅ Bid estimates reais  
✅ Oportunidades validadas  
✅ Produção de artigos orientada por DEMANDA  

**Em vez de:**
❌ Numbers aleatórios (Math.random())  
❌ Dados hardcoded  
❌ Template genérico "Ponto 1, 2, 3"  

---

**Você tem Developer Token?** → Diga sim/não e continuo!
