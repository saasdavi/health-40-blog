# Onde estamos e o que falta (1 página)

> Leia isto primeiro numa sessão nova. Detalhes: `ESTRATEGIA-E-FLUXO-AUTOMATICO.md` (seções 16 e 17 = painel de estoque e inventário de dados). Atualize a data e os números abaixo a cada rodada.

**Atualizado:** 2026-10-04

## Painel de produção e estoque (conferido em 2026-10-04 06:33 UTC)

| Produção | Quantidade |
|---|---|
| Artigos publicados e aprovados | **8** (7 em 03/10 + 1 em 04/10) |
| Rascunhos | 0 |
| Publicados em 04/10 (até 15:54 UTC) | 1: hemoglobina glicada (11:51 UTC, aprovado). Total publicado: **8**. As agendas de 06:00 e 14:00 UTC NÃO geraram commit; horários trocados para 06:17, 13:43 e 17:23 UTC em 04/10 |

Publicados: como baixar colesterol, quanto de proteína por dia, como meditar, triglicerídeos altos sintomas, o que é gordura visceral, o que é perimenopausa, o que é resistência à insulina.

| Pautas | Quantidade | Dias (3/dia) |
|---|---|---|
| Fila total (`keywords-validated.json`) | 89 | |
| **Validadas e livres (prontas para o robô)** | **64** | **≈ 21** |
| Já usadas ou fora da regra de "livre" (7 publicadas + 18 a conferir) | 25 | |
| Candidatas com volume aguardando o Google | 97 | até ≈ 32 se todas passarem |
| Palavras medidas no banco | 3.474 (888 grupos) | não são pautas |

| Meta de 12 meses | |
|---|---|
| Meta | 1.095 pautas |
| Livres hoje | 64 (6%) |
| Faltam | ≈ 1.031 |

Livres por categoria: nutrição 6, exames 6, pele e cabelo 5, menopausa 4, colesterol 3, hormônios 3, emagrecimento 3, digestão 3, músculo e força 3; 1 ou 2 em cada uma das outras categorias. Nenhuma categoria vazia, nenhuma forte.

## Objetivo
Blog de saúde, 3 artigos/dia por 365 dias (1.095 pautas), cada pauta validada com demanda real. O repositório é o banco de dados: nada de pesquisa fica só no chat.

## Números de hoje (conferir com `node scripts/prateleira.js`)
- Fila do robô: 89 pautas, **64 livres (≈ 21 dias)**, 7 artigos publicados.
- Candidatas com volume aguardando o Google: 97.
- Banco: **3.474** palavras com volume medido (888 grupos na ordem de validação). "Medido" não é "validado": validado = passou no Google (≤ 2 autoridades no top 5, sem lojas, ≥ 2 fontes).
- Faltam ~1.030 pautas validadas para 12 meses.

## Fluxo (método do usuário)
1. Planejador (grátis): "Ver volume" com muitas frases, ficar só com as que têm volume → "Descobrir novas palavras-chave" com as melhores como sementes (≈ 10 por busca) → baixar CSV.
2. `node scripts/ingerir-hypd.js arquivo --fonte nome` junta ao banco (aceita CSV do Planejador, TSV e JSON do HYPD; faixas do Planejador ficam em `data/pesquisa/planejador-faixas.json`).
3. `node scripts/ordem-validacao.js` agrupa por intenção e ordena: validar de cima para baixo.
4. HYPD `serp_results` (1 frase por vez) checa o Google; passou → entra em `data/keywords-validated.json` com fontes, `absorve`, `notas` e `revisar: true`.
5. `node scripts/distribuir-secundarias.js --aplicar` (palavras de 10+ buscas viram apoio) e `node scripts/pontes.js` (links entre artigos).
6. `node scripts/validar-pautas.js` sem erros → commit → push em `main`.

## Regras decididas pelo usuário
- Sem preconceito de conteúdo: remédio, suplemento, urgência, pornografia (científica) e termos amplos são temas válidos, marcados `sensível`/`amplo`, com `notas` de cuidado e `revisar`. Seguem fora: intenção de compra (comprar, preço, farmácia) e consumo/fora do assunto (vídeo, grátis, assistir). Ver `data/pesquisa/filtros.json`.
- O que está fora do filtro fica fora; competição alta não exclui sozinha (vale 30% na ordem).
- Palavras de 10 a 99 buscas valem como apoio e âncora de link, não como pauta.
- Não baixar a régua para encher a fila.

## Pendências (em ordem)
1. **Ligar `data/pontes.json` ao robô** (`scripts/article-robot.js`, junto de `linksTorre`); testar com a API.
2. Validar no Google as próximas da ordem: paralisia do sono, bruxismo, PSA, glicemia de jejum, como dormir rápido, exercícios para ombro; e os pilares de disfunção erétil (ereção fraca, ansiedade de desempenho, ejaculação retardada, kegel para homens).
3. Pornografia (científica): checar o Google do grupo "vício e como parar" (~8.470), masturbação (~2.820) e NoFap (~4.400).
4. Medir em lote a lista de 421 frases de disfunção erétil (`data/pesquisa/lotes/disfuncao-eretil-lista-chatgpt-2026-10-04.txt`) e as 44 ideias do Google (`data/pesquisa/ideias-do-google.json`).
5. Teste do HYPD acaba por volta de **17/10/2026**: gastar a janela com a checagem do Google das melhores.
6. Revisão humana das pautas `revisar: true` (4 livres, todas sensíveis ou de saúde masculina).
7. Calendário de 12 meses (`data/plano-editorial.json`, ainda não existe).
8. Domínio + Search Console (`scripts/trocar-dominio.js`); decidir fonte de volume depois do HYPD e a API oficial do Google (seção 15 do documento).
9. Secrets `SERPER_API_KEY` e `KEYWORDS_EVERYWHERE_API_KEY` ainda não criados (workflows automáticos dependem deles).

## Validação automática no GitHub (sem permissões, sem HYPD)
O HYPD é um conector que pede aprovação a cada chamada (só o usuário muda isso, em https://claude.ai/customize/connectors > permissões da ferramenta). Para trabalhar sem ninguém no computador: **Serper dentro do GitHub**.
1. Criar a chave grátis em serper.dev (≈ 2.500 consultas) e salvar como secret do repositório `SERPER_API_KEY` (Settings > Secrets and variables > Actions).
2. Aba Actions > "Validar Google (SERP) das candidatas" > Run workflow (limite 60, promover = true). Ele checa o Google das candidatas por volume (hoje 177, +80 vindas da ordem de validação), promove as aprovadas à fila com `revisar: true` (e `sensivel: true` se o tema for sensível), roda `validar-pautas.js` e grava no `main`.
3. Tema sensível, comp. alta e termos amplos ficam FORA dessa rodada automática (validar à mão quando houver alguém no computador).

## Comparação com o topo do Google (como chegar ao top 10)
`node scripts/comparar-topo.js` (e o workflow **Comparar nossos artigos com o topo do Google**, manual + toda segunda 09:17 UTC) lê as páginas do topo de cada pauta (`topoUrls` em `data/pesquisa/serp-resultados.json` + `fontes` da pauta), mede palavras, H2, imagens/alt, FAQ, título e descrição, e grava em `data/pesquisa/comparacao-topo.md/.json` a mediana do topo, as **lacunas** do nosso artigo (o que melhorar) e as vantagens; para pauta ainda não publicada, a **meta** para publicar. Precisa rodar no GitHub (o contêiner da sessão bloqueia sites de saúde). Teste local sem rede: `--mock scripts/fixtures/comparar-topo-mock.json` (não commitar a saída do mock). Falta: ligar as lacunas ao robô (reescrita automática) e, depois do Search Console, comparar com a posição real.

## Trava de segurança do robô (04/10/2026)
O robô publica sozinho qualquer pauta com SERP fácil e fontes; **`revisar: true` sozinho não o impede**. Por isso pautas de tema sensível levam `sensivel: true` além de `revisar: true`, e o `escolherPauta` do `scripts/article-robot.js` **pula** as que têm os dois. Para liberar: revisar a pauta/artigo e apagar `sensivel` e `revisar` em `data/keywords-validated.json`. Hoje bloqueada: ereção matinal. Toda pauta nova de remédio, urgência, sexualidade ou pornografia deve entrar com `sensivel: true`.

- Medir no Planejador as listas sem volume: `data/pesquisa/sem-dado.json` (63), `data/pesquisa/lotes/pressao-alta-sintomas-lista-*.txt` (37) e a lista de 421 de disfunção erétil.

## Cuidados
- Nunca colocar chaves no chat nem em arquivo versionado: só como secret do repositório.
- Resultados do HYPD expiram em 24 h: ingerir no mesmo dia.
- Cada checagem do Google gasta bastante contexto: lotes pequenos, uma frase por chamada.
