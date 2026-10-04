# Onde estamos e o que falta (1 página)

> Leia isto primeiro numa sessão nova. Detalhes: `ESTRATEGIA-E-FLUXO-AUTOMATICO.md` (seções 16 e 17 = painel de estoque e inventário de dados). Atualize a data e os números abaixo a cada rodada.

**Atualizado:** 2026-10-04

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

## Cuidados
- Nunca colocar chaves no chat nem em arquivo versionado: só como secret do repositório.
- Resultados do HYPD expiram em 24 h: ingerir no mesmo dia.
- Cada checagem do Google gasta bastante contexto: lotes pequenos, uma frase por chamada.
