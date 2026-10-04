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
