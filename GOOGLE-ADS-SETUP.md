# 🔑 Google Ads Keyword Planner - Setup Completo

## O QUE VOCÊ JÁ TEM (no GitHub Secrets):

```
✅ GOOGLE_ADS_CLIENT_ID
✅ GOOGLE_ADS_CLIENT_SECRET
✅ GOOGLE_ADS_REFRESH_TOKEN
✅ GOOGLE_ADS_CUSTOMER_ID
✅ GOOGLE_ADS_LOGIN_CUSTOMER_ID
(FALTA: GOOGLE_ADS_DEVELOPER_TOKEN)
```

---

## 🔍 VERIFICAR SE SETUP ESTÁ CORRETO

### PASSO 1: Confirmar que você tem:

1. **Google Ads Account** - Criada? Ativa?
   ```
   URL: https://ads.google.com
   ```

2. **Developer Token** - Gerado?
   - Settings → API Center → "Get Developer Token"
   - Status: "Approved" (ou "Pending Review")

3. **OAuth Credentials** - Criadas?
   - Google Cloud Console
   - Service Account ou OAuth 2.0 (Web Application)

---

## 🛠️ SE FALTA DEVELOPER TOKEN:

### SETUP (15 minutos):

1. **Ir para Google Ads**
   ```
   https://ads.google.com
   Login com conta que tem Ads
   ```

2. **Settings → API Center**
   ```
   Menu → Settings → API Center
   ```

3. **Gerar Developer Token**
   ```
   Click: "Get Developer Token"
   - Tipo: Standard Access (suficiente)
   - Descrição: "Health 40+ Blog - Keyword Research"
   - Aplicação: "Web Application"
   - Salvar
   ```

4. **Esperar aprovação**
   ```
   Instant: ~1 minuto (Standard access é rápido)
   Status muda para: "Approved"
   Copiar token
   ```

5. **Adicionar no GitHub Secrets**
   ```
   GOOGLE_ADS_DEVELOPER_TOKEN = <seu token aqui>
   ```

---

## ✅ VALIDAR QUE FUNCIONA

### Teste Local (5 min):

```bash
# 1. Criar .env local com teus secrets
echo "GOOGLE_ADS_DEVELOPER_TOKEN=<seu-token>" >> .env
echo "GOOGLE_ADS_CLIENT_ID=<seu-id>" >> .env
echo "GOOGLE_ADS_CLIENT_SECRET=<seu-secret>" >> .env
echo "GOOGLE_ADS_REFRESH_TOKEN=<seu-refresh-token>" >> .env
echo "GOOGLE_ADS_CUSTOMER_ID=<seu-customer-id>" >> .env

# 2. Rodar script de teste
node scripts/test-google-ads-api.js
```

---

## 🚨 PROBLEMAS COMUNS

| Erro | Causa | Solução |
|------|-------|---------|
| "Invalid developer token" | Token expirado/inválido | Gerar novo em API Center |
| "UNAUTHENTICATED" | OAuth token expirado | Renovar refresh token |
| "PERMISSION_DENIED" | Developer token não aprovado | Esperar aprovação (pode levar horas) |
| "RESOURCE_EXHAUSTED" | Rate limit | Aguardar 1 minuto antes de próxima call |

---

## 📊 QUANDO FUNCIONAR, ESPERAR:

```javascript
{
  "keyword": "colesterol depois dos 40",
  "monthlySearchVolume": 1240,     // ← REAL DATA
  "competitionLevel": "HIGH",       // ← REAL COMPETITION
  "topOfPageBidLow": 0.45,         // ← REAL BID
  "topOfPageBidHigh": 2.30,        // ← REAL BID
  "lowTopOfPageBidMicros": 450000,
  "highTopOfPageBidMicros": 2300000,
  "trend": "STABLE"
}
```

---

## 🔗 RECURSOS:

- Google Ads API Docs: https://developers.google.com/google-ads/api/docs
- Keyword Planner Guide: https://developers.google.com/google-ads/api/docs/keyword_planning/overview
- OAuth Setup: https://developers.google.com/google-ads/api/docs/oauth/overview

---

## 🎯 PRÓXIMO PASSO:

1. **Você tem Developer Token?** → Sim/Não
2. **Se SIM:** Vou implementar a API completa
3. **Se NÃO:** Vou criar guia passo-a-passo para gerar

---

**⚠️ IMPORTANTE:**
Sem Google Ads Keyword Planner API funcionando, você vai continuar com dados FAKE.
Sistema inteiro depende dessa validação real.

