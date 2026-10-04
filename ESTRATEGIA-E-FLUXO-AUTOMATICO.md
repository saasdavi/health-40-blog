# Estratégia e fluxo automático — Saúde 40+

Este é o documento de referência de **como o blog deve funcionar sozinho**. Se algo em outros arquivos (`CLAUDE.md`, `SISTEMA-FINAL.md`, `PLANO_REAL_2024.md`…) contradizer este texto, vale este texto.

Atualizado em 2026-10-04.

## 1. O que é o projeto

Blog de saúde para quem tem 40 anos ou mais (público principal: mulheres), em português do Brasil. Astro no Vercel. Publicação automática pelo GitHub Actions, **3 artigos por dia** (cron 06h, 14h e 18h UTC), sem intervenção humana a partir do próximo horário agendado (o cron já está ativo no `main`).

O nicho é **saúde em geral**, organizada por categorias. "Depois dos 40" **não é palavra-chave**: é o ângulo e o público. Combinações como "dieta depois dos 40" têm só 10 a 200 buscas por mês; o volume real está nos temas (ex.: "dor nas costas" 49,5 mil, "caspa" 22,2 mil). Não escreva afirmação específica de idade se as fontes não disserem.

## 2. Princípio central: demanda primeiro, texto depois

Nenhum artigo é escrito por palpite. A ordem é sempre esta:

1. **Gerar muitas frases** (curtas e longas, variações, públicos, intenções). O ChatGPT gera as listas; a ferramenta `scripts/combinar-palavras.js` também gera combinações (tema × público × intenção).
2. **Medir a demanda real** (volume mensal no Brasil). Nunca inventar volume. Fontes: Keywords Everywhere (API), HYPD (só dentro da sessão do Claude, teste de 14 dias) ou Planejador do Google com conta que gasta (sem gasto o Planejador devolve faixas como "10 mil – 100 mil", inútil).
3. **Agrupar em pautas**: uma pauta = uma intenção = uma URL. A palavra de maior volume é a principal; as variações e perguntas viram H2 do mesmo artigo (`absorve`). O volume do grupo conta o principal mais 65% das variações (as buscas se sobrepõem). Mínimo: 1.000 buscas/mês estimadas.
4. **Validar o Google (SERP)** de cada pauta: o topo não pode ser dominado por autoridades (no máximo 2 entre os 5 primeiros: gov.br, Einstein, Drauzio, MSD etc.), nem por lojas.
5. **Guardar fontes** (várias URLs do topo) e **notas de segurança**.
6. A pauta entra na **fila de ouro** (`data/keywords-validated.json`) e o robô a publica.

Sinal de compra: no Google Ads, competição **HIGH** quase sempre significa produto, marca ou suplemento. Esses termos ficam fora.

## 3. O que NÃO entra (regra editorial e de segurança)

- Suplemento, produto, marca, "onde comprar", preço, remédio e dose. Ex.: colágeno, creatina, magnésio quelato, melatonina, finasterida, FreeStyle Libre.
- Temas de urgência como artigo próprio (infarto, AVC, crise hipertensiva, hipoglicemia). Só como H2 de alerta.
- Termos de intenção ambígua que não são de saúde (sexo, casamento, aposentadoria).
- Conteúdo sem fonte: **o robô só escreve o que está nos trechos das fontes lidas**. Sem diagnóstico, sem promessa de cura ou emagrecimento, sem dose.
- Temas de risco (pressão, próstata, diabetes, tireoide, exames, sintomas…) exigem `notas` de cuidado (o validador reprova se faltar).

## 4. Como o artigo é produzido (SEO no texto e na imagem)

O robô (`scripts/article-robot.js`, Claude Haiku 4.5 como redator e validador):

1. Pega a próxima pauta livre, alternando categorias.
2. Lê as fontes guardadas (precisa de **2 legíveis**; muitos sites devolvem 403 ao servidor, por isso guardamos 3 a 8 URLs).
3. Estuda o **concorrente do topo sobre aquele assunto** (não o site inteiro): título, descrição, tamanho, imagens e alt, subtítulos H2/H3. Isso entra no pedido como referência: cobrir o que eles cobrem, ser mais claro e mais seguro, e ter título e descrição diferentes dos deles.
4. Escreve 1.300 a 1.800 palavras (alvo dinâmico pela mediana do topo, máximo 1.800): resposta direta em até 45 palavras com a palavra-chave nas 6 primeiras, H2 a cada ~300 palavras, "Quando procurar um médico" e "Resumindo", 2 links internos, sem H1 no corpo.
5. Metadados: `TITLE` até 46 caracteres com a palavra-chave; `DESCRIPTION` de 125 a 155 com a palavra-chave; capa e 2 fotos com `alt` descritivo (25+ caracteres, sem repetir), legenda e crédito (Pexels/Pixabay).
6. **Auditoria** de 100 pontos (mínimo 80) com bloqueios (H1, menos de 1.000 palavras, canibalização, aviso de saúde, claim proibido) e um segundo passe de validação de fatos contra as fontes.
7. Só publica se aprovado. Schema JSON-LD de Article e BreadcrumbList. Canonical sem barra final.

Melhorias ainda possíveis: FAQPage (o Google restringe o rich result a sites de autoridade, valor baixo), página-mãe por subcategoria, revisão humana das `notas` geradas automaticamente.

## 5. Estrutura de conteúdo: categorias e subcategorias

15 categorias, meta de **até 60 artigos por categoria** (teto; a demanda real decide). Cada tema cadastrado em `data/pesquisa/ingredientes.json` é uma subcategoria (≈5 artigos cada). Categorias: alimentação, emagrecimento, exercício, mulher e menopausa, homem e próstata, coração e pressão, diabetes e exames, sono e mente, cérebro e memória, ossos e articulações, pele e cabelo, visão/audição/boca, digestão, relacionamento e sexualidade, longevidade.

`node scripts/cobertura.js` gera `data/pesquisa/cobertura.md` com publicados, fila e candidatos por categoria e subcategoria. Use-o para escolher onde pesquisar a seguir. Cuidado com canibalização: cada subcategoria tem uma página principal, e os demais artigos a linkam.

## 6. Automação: o que roda e o que cada peça faz

| Peça | Função |
|---|---|
| `.github/workflows/daily-production.yml` | 3x/dia: resumo da fila, validação online das próximas 9 pautas, robô publica |
| `.github/workflows/pesquisa-completa.yml` | Lê `data/pesquisa/entrada.txt` → volume → agrupa → valida Google → promove à fila |
| `.github/workflows/validar-serp.yml` | Valida o Google das candidatas e promove (`--promover`) |
| `.github/workflows/validar-pautas.yml` | Confere regras e fontes online de toda a fila |
| `scripts/combinar-palavras.js` | `gerar`, `analisar` e `importar` (agrupa o CSV do Planejador) |
| `scripts/volume-ke.js` | Volume em lote pela API do Keywords Everywhere |
| `scripts/validar-serp.js` | Veredito do Google (Serper) por candidata |
| `scripts/validar-pautas.js` | Regras e fontes da fila (volume, domínios, urgência, notas, canibalização) |
| `scripts/prateleira.js` | Resumo da fila: pautas livres e dias de estoque |
| `scripts/cobertura.js` | Mapa por categoria e subcategoria |

Segredos do repositório: `ANTHROPIC_API_KEY`, `PEXEL_API_KEY` e/ou `PIXABAY_API_KEY` (imagens), `SERPER_API_KEY`, `KEYWORDS_EVERYWHERE_API_KEY`.

Dados: `data/keywords-validated.json` (fila de ouro), `data/prateleira-candidatas.json` (volume validado, esperando Google), `data/articles.json` (publicados), `data/pesquisa/` (listas, volumes, importações, cobertura).

## 6b. Banco de palavras: o repositório é o banco de dados

Tudo que foi pesquisado e tem volume medido fica guardado no GitHub, em arquivos versionados. Nada se perde quando a sessão do Claude, o HYPD (resultados expiram em 24 h) ou o teste gratuito acabam.

| Arquivo | O que guarda |
|---|---|
| `data/pesquisa/banco-de-palavras.json` | **Todas** as palavras com volume (≈2.000 em 2026-10-04): palavra, volume, competição, lote de origem, categoria, status (`fila`, `candidata`, `absorvida`, `banco`) |
| `data/prateleira-candidatas.json` | Pautas já agrupadas, com volume validado, esperando o Google (SERP) |
| `data/keywords-validated.json` | Fila de ouro (pautas prontas para o robô) |
| `data/pesquisa/ingredientes.json` | Categorias, subcategorias (temas), públicos e intenções usados para gerar frases |
| `data/pesquisa/cobertura.md` | Mapa de cobertura por categoria e subcategoria |

Consultas (sem gastar API):

```
node scripts/banco.js --resumo                         # quantas palavras e quantas ainda úteis por categoria
node scripts/banco.js --categoria ossos-articulacoes   # melhores ainda não usadas (>=1000, sem competição alta)
node scripts/banco.js --buscar "joelho"                # tudo que contém o termo
```

Para guardar uma pesquisa nova: `node scripts/ingerir-hypd.js arquivo [arquivo ...]` (aceita os JSON que o HYPD salva quando a resposta é grande e CSV/TSV do Planejador ou do Keywords Everywhere). Deduplica, mantém o maior volume e recalcula categoria e status de todo o banco. **Rode logo após cada pesquisa: os resultados do HYPD expiram em 24 horas.**

Regra de uso: antes de pesquisar de novo, consulte o banco. Palavras `banco` com volume >= 1.000 e competição não HIGH são pautas em potencial; é só agrupá-las e validar o Google. Atenção: palavras `sem-categoria` vêm das primeiras rodadas (antes da lista de temas) e também valem.

Crescimento: cada 1.000 palavras ocupam ~130 KB. Até algumas dezenas de milhares o JSON no repositório funciona bem. Passando de ~20 mil palavras, dividir por categoria (um arquivo por categoria) ou migrar para um arquivo SQLite no repositório. O limite de arquivo do GitHub é 100 MB.

## 7. Rotina para repor a fila (sem depender de mim)

1. Peça ao ChatGPT, por categoria, frases que alguém digitaria de verdade e que mudem a intenção (causas, sintomas, exames, tratamento, "é normal", "quando procurar médico"). Sem repetir só trocando idade ou número.
2. Cole em `data/pesquisa/entrada.txt` e rode **Actions → Pesquisa completa** com a categoria e as sementes.
3. Confira o resumo; revise as `notas` das pautas com `revisar: true`, principalmente em temas de risco.
4. Mantenha a fila com **no mínimo 5 dias** de pautas (o resumo do robô avisa). Meta atual: **30 dias = 90 pautas**.

## 8. Limitações conhecidas

- O servidor de desenvolvimento da sessão não alcança sites de saúde (gateway nega); validação de fontes só no GitHub Actions.
- O HYPD só roda na sessão do Claude e é teste de 14 dias; devolve volume vazio para alguns termos amplos ("osteoporose", "pressão alta ..."), o que não significa demanda zero.
- Exportar do Planejador: o arquivo útil é "Keyword Stats" (uma linha por palavra). O arquivo "Keyword Forecasts" é previsão de campanha e não serve. Conta sem gasto mostra só faixas.
- A API do Keywords Everywhere foi escrita pela documentação conhecida e ainda **não foi testada com chave real**.
- O robô com a referência de SEO do topo ainda não foi exercitado com a API de redação.

## 9. Estado em 2026-10-04

- Fila de ouro: **60 pautas livres (≈20 dias)**, com fontes validadas online; faltam 30 para 90.
- Candidatas com volume esperando o Google: 100. Banco de palavras: ≈2.000 palavras com volume, 233 ainda não usadas com volume >= 1.000 e competição não HIGH.
- Cobertura: 85 garantidos de 900 possíveis; categorias mais vazias: relacionamento, longevidade, ossos, próstata, digestão, visão, cérebro.
- Pendências antigas: refazer `triglicerideos-altos-sintomas`, checar números dos artigos contra as fontes, bloco Mounjaxi (promessas sem base), endereço e e-mail legais, FAQ, remover `keyword-matrix-funil.json`, acompanhar os primeiros runs agendados.

## 10. Meta de 12 meses e regra para aumentar o ritmo

- Meta: **1.095 pautas validadas (3 por dia durante 1 ano)**, planejadas em `data/plano-editorial.json` (a criar) e com demanda comprovada.
- Só depois de fechar esse ano planejado e validado se decide **aumentar o número de publicações por dia**. Antes disso, o ritmo fica em 3.
- Ao decidir aumentar, conferir: (1) estoque de pautas validadas para o novo ritmo, (2) custo por artigo na API de redação (`data/metrics`), (3) taxa de aprovação do robô e amostragem humana de qualidade, (4) indexação e impressões no Search Console, para não publicar mais do que o Google consegue absorver.

## 11. Domínio próprio e Google Search Console (semana de 2026-10-04)

Hoje o site responde em `https://health-40-blog.vercel.app` e esse endereço está escrito em vários arquivos (canonical, sitemap, robots, schema, scripts). O e-mail de contato já usa `contato@saude40mais.com`, então `saude40mais.com` / `saude40mais.com.br` é o candidato natural. **Escolha o domínio definitivo antes de acumular muitos artigos**: trocar depois exige redirecionamentos e perde sinal.

Passo a passo:
1. **Comprar** o domínio (.com.br pelo Registro.br, com o CNPJ do responsável, ou .com em registrador internacional). Decidir o canônico: com ou sem `www` (recomendado: **sem www**, e redirecionar o outro).
2. **Vercel**: Project → Settings → Domains → adicionar o domínio e o `www`; copiar os registros DNS que o Vercel mostra (normalmente `A 76.76.21.21` para o domínio raiz e `CNAME cname.vercel-dns.com` para `www`) e criar no painel do registrador. Marcar o domínio sem www como principal; o Vercel redireciona os demais, inclusive `health-40-blog.vercel.app`. O HTTPS é emitido sozinho.
3. **No repositório**: `node scripts/trocar-dominio.js https://SEUDOMINIO` mostra o que mudaria (simulação). Com `--aplicar`, troca SITE.url, robots.txt, schema, canonical e scripts, e regenera o sitemap. Depois commit e push (o Vercel faz o deploy).
4. **Search Console**: criar a propriedade do tipo **Domínio** (verificação por registro TXT no DNS; cobre http, https, www e subdomínios). Alternativa: propriedade por prefixo de URL, colando o código em `SITE.googleSiteVerification` (`src/config/site.ts`), que o `SEO.astro` já imprime como meta tag.
5. **Enviar o sitemap** `https://SEUDOMINIO/sitemap.xml` (Search Console → Sitemaps). Em "Inspeção de URL", pedir indexação da home e de 3 a 5 artigos.
6. **Bing Webmaster Tools**: importar a propriedade direto do Search Console.
7. **E-mail do domínio**: criar `contato@SEUDOMINIO` (ou encaminhamento) e atualizar `contactEmail` em `src/config/site.ts`, para bater com o rodapé e as páginas legais.
8. Registrar, mês a mês, indexadas, impressões, cliques e posição por categoria (marcos do plano de 12 meses).

Observações: o Google ignora `Crawl-delay` do robots.txt; não é problema. O endereço no rodapé legal (`legal.endereco`) está vazio e a página de contato pode exigir um; decidir se vai exibir.

## 12. Nenhuma palavra validada se perde (principais e secundárias)

Regra: toda palavra com volume medido tem um destino. As **fortes viram pautas principais** (uma intenção = uma URL) e as **secundárias entram como termos de apoio dentro de outros artigos**, para cobrir a demanda sem criar páginas concorrentes.

- `node scripts/distribuir-secundarias.js` (simulação) / `--aplicar`: para cada palavra do banco que ainda não é pauta, procura a pauta (fila ou candidata) cujos termos estão todos na palavra e a grava em `secundarias` dessa pauta (até 15, por volume). O robô lê `secundarias` no pedido de redação e cobre esses termos de forma natural em seções ou no texto, só quando as fontes sustentam.
- Palavras com volume >= 1.000 que são variação de uma pauta existente **não** viram secundárias: ficam em `data/pesquisa/pautas-proprias-em-potencial.json`, com a pauta mais próxima. Avaliar caso a caso (pode ser outra intenção, com artigo próprio, ou sinônimo, que deve ser absorvido).
- Palavras sem pauta correspondente continuam no banco: são os temas das próximas pautas. Use `node scripts/banco.js`.
- Rode `distribuir-secundarias.js --aplicar` sempre que o banco ou a lista de candidatas crescer.

## 13. Torres de conteúdo: pilar + satélites

Modelo: cada subcategoria é uma **torre**. A **pauta-pilar** é o termo amplo da subcategoria (ex.: "o que é colesterol", "hemoglobina glicada"). Os **satélites** são sub-temas e frases de cauda longa com demanda comprovada (ex.: "colesterol alto sintomas", "colesterol hdl", "alimentos que aumentam o colesterol") que apoiam e fortalecem o pilar com links internos.

- `node scripts/torres.js` (simulação) / `--aplicar`: lê a fila e as candidatas, define o pilar de cada subcategoria (a pauta cujo núcleo é o próprio tema) e grava `papel` (`pilar`/`satelite`) e `pilar` em cada pauta, mais o mapa em `data/torres.json`. Torres sem pauta-pilar aparecem como "SEM PILAR" com o tema e o volume sugeridos.
- `node scripts/torres.js --satelites`: gera frases de cauda longa para os pilares que ainda têm menos de 4 satélites (`data/pesquisa/satelites-para-medir.txt`). Medir o volume (HYPD, Keywords Everywhere ou CSV), `ingerir-hypd.js`, `combinar-palavras.js importar` e `torres.js --aplicar` fecham o ciclo.
- Robô: escolhe o **pilar antes dos satélites** e alterna a categoria do último artigo publicado; satélite linka obrigatoriamente o pilar (já publicado) e o pilar linka os satélites publicados; a auditoria tira pontos se faltar o link para o pilar. `pilar` e `papel` ficam gravados no artigo.
- Próximo passo (site): bloco "Veja também / guia completo" no layout do artigo (`src/pages/[slug].astro`), usando `pilar`/`papel`, para a torre também aparecer na navegação. Ainda não feito.

## 14. Peneira em massa (milhares de frases → só ouro)

- `node scripts/gerar-massa.js --etapa 1`: formas simples de cada tema (≈8.900 frases com 173 temas). Blocos prontos de 1.000 frases em `data/pesquisa/lotes/etapa1-lote-NN.txt` (um arquivo por colagem no Planejador ou no Keywords Everywhere) e todos juntos em `etapa1-todas.txt`.
- Medir o volume (workflow **Pesquisa completa** com `gerar_massa=1`, ou colando os lotes à mão). `scripts/volume-ke.js` retoma de onde parou e não paga duas vezes pela mesma frase.
- `node scripts/gerar-massa.js --etapa 2`: **só para os temas que a etapa 1 provou ter demanda** (volume >= 1.000 no banco), combina situação × intenção (≈27 mil frases com os 66 temas atuais). Peneirar em duas etapas evita gastar crédito com temas sem demanda.
- Esperado: a maioria das frases tem volume zero. O ouro é o que sobra com volume >= 1.000 (principais) e as caudas menores que viram secundárias das torres.
- O workflow guarda tudo no banco (`ingerir-hypd.js`), agrupa em pautas, valida o Google, promove à fila e atualiza torres e secundárias.

## 15. Pendência: API oficial do Google (Planejador de Palavras-chave)

**Objetivo:** continuar com acesso ao Planejador (KWP) depois do teste do HYPD (termina por volta de 17/10/2026). Decisão sobre a fonte de volume fica para depois do teste.

**Fatos medidos (04/10/2026):** a conta do Planejador sem gasto devolve só faixas ("100 – 1 mil", "1 mil – 10 mil") em vez de número exato. O HYPD devolve número exato. Faixa vale pelo piso na soma dos grupos.

**Roteiro para a API oficial — NÃO confirmado, conferir na documentação do Google:**
1. Conta gerenciadora (MCC) do Google Ads.
2. Token de desenvolvedor (acesso de teste funciona só com contas de teste; para a conta real é preciso pedir acesso Básico).
3. Projeto no Google Cloud com a Google Ads API habilitada e credenciais OAuth.
4. Autorização OAuth da conta (gera o refresh token).
5. Chamada do `KeywordPlanIdeaService` (`GenerateKeywordIdeas`).

**A confirmar:** regras e limites do acesso Básico; quanto gasto (se algum) libera número exato; se conta parada perde acesso; se a API sem gasto também devolve faixas (provável, testar). A documentação (support.google.com, developers.google.com) estava bloqueada no ambiente da sessão.

**Quando chegar nessa etapa:** escrever um script que chame o `KeywordPlanIdeaService` e grave no formato do HYPD (`palavra, volume, competição`) para `scripts/ingerir-hypd.js`. Chaves e tokens só como secret do repositório, nunca no chat ou em arquivo versionado.

**Ferramentas avaliadas (somente leitura, nada instalado):**
- `data-skunks/kpu-mcp` (KeywordsPeopleUse): perguntas "as pessoas também perguntam", Autocomplete, Reddit/Quora, palavras semânticas. Não dá volume. Exige plano pago (o Free não tem API/MCP). Só valeria pelo Autocomplete; não adotado.
- `googleads/google-ads-mcp` (oficial do Google): três ferramentas somente leitura (`search`, `get_resource_metadata`, `list_accessible_customers`) para consultar a própria conta. Não chama o Planejador, então não dá volume. Passa a ser útil quando houver campanha rodando (termos de busca reais).


## 16. Painel de estoque (atualizar a cada rodada de validação)

**Data:** 2026-10-04  |  ritmo de publicação: 3 artigos/dia  |  meta: 1.095 pautas validadas (12 meses)

| Indicador | Valor |
|---|---|
| Pautas validadas e livres (fila do robô) | **64** (≈ 21 dias) |
| Artigos já publicados | 7 |
| Candidatas com volume, aguardando o Google | 97 |
| Palavras no banco com volume medido | 2314 (fila 35, candidata 82, absorvida 11, filtrada 100, banco 2086) |
| Pautas livres com `revisar: true` (revisão humana pendente) | 4 |
| Faltam para a meta de 12 meses | 1031 |

**Atenção sobre estimativas:** as candidatas só viram dias de artigo depois de passar na checagem do Google (≤ 2 autoridades no top 5, fontes guardadas). "Quase 50 dias" foi uma projeção supondo que metade passe; o dado real é a linha "Pautas validadas e livres". A regra de "livre" é a de `scripts/prateleira.js`: SERP fácil, ≥ 2 fontes, não substituída e ainda não publicada.

**Pautas livres por cluster:** nutricao 6, exames 6, pele-cabelo 5, menopausa 4, musculo-e-forca 3, colesterol 3, hormonios 3, emagrecimento 3, digestao 3, diabetes 2, circulacao 2, visao 2, prostata 2, coluna 2, memoria 2, sono 2, sintomas 2, alimentacao 2, figado-metabolismo 1, tireoide 1, digestivo 1, saude-mental 1, olhos 1, ouvido-equilibrio 1, urinario 1, coracao 1, exercicio 1, longevidade 1.

**Validadas no Google (HYPD) em 04/10/2026:** alimentos ricos em fibras, alimentos ricos em ferro, ritmo circadiano, ereção matinal.

**Próximas a checar:** paralisia do sono, como dormir rápido, glicemia de jejum, exercícios para ombro, bruxismo. Fora do escopo: suplementos ("ômega 3 para que serve", "magnésio para que serve").

**Como atualizar:** `node scripts/prateleira.js` mostra a fila e as candidatas; `node scripts/validar-pautas.js` confere as fontes; o banco vem de `node scripts/ingerir-hypd.js`.

**Ordem de validação:** `node scripts/ordem-validacao.js` usa todas as palavras úteis do banco, agrupa as variações sob a frase-mãe, soma o volume e ordena do melhor ao pior (`data/pesquisa/ordem-de-validacao.md`). Palavras filtradas, competição ALTA e cabeças ambíguas ('sexo', 'casamento', 'aposentadoria'...) ficam de fora (`data/pesquisa/filtros.json`). Validar no Google de cima para baixo.
