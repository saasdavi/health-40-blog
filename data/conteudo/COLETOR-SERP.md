# Coletor de concorrentes (roda no SEU computador, sem API)

Lê a planilha mestre, abre o Google no seu Chrome, vê quem ranqueia em 1º, mede as páginas do topo (só métricas, nunca o texto) e atualiza a planilha. Depois, qualquer IA escreve o artigo só com os dados da planilha.

## Uma vez só
1. Instale o Node 18+ (nodejs.org) e baixe o repositório (`git clone`).
2. Na pasta do projeto: `npm install` e depois `npm i --no-save playwright` (não baixa navegador; usa o seu Chrome).

## Cada rodada
```
node scripts/coletor-serp.js --so-sim --limite 10 --topo 3 --push
```
- `--so-sim`: só as palavras sugeridas para produzir. `--limite 10`: 10 palavras por vez (não passe de 30 por sessão).
- `--topo 3`: abre as 3 primeiras páginas de cada busca. `--tema Cabelo`: filtra por tema. `--push`: envia ao GitHub no fim.
- Se o Google pedir verificação ("não sou um robô"), resolva na janela aberta e aperte Enter no terminal.
- Teste sem internet: `node scripts/coletor-serp.js --mock`.

## Depois, para escrever o artigo
```
node scripts/montar-prompt.js "psoríase no couro cabeludo"
```
Imprime o prompt completo, já com demanda, concorrentes, H2 comuns, perguntas do Google, lacunas e links internos permitidos. Cole em GPT, Gemini, DeepSeek ou Qwen. Salve a resposta em `data/entrada/<nome>.txt` e importe: o sistema pontua sozinho.

## Cuidados
- O Google proíbe consulta automática nos termos de uso: uso pessoal, volume baixo, pausas longas (o script já faz). Se travar muito, pare e espere.
- Nada de senha ou perfil vai para o GitHub (`.coletor-perfil/` fica só no seu computador).

## Se o Google pedir verificação demais
- O coletor agora espera 30–60 s entre buscas, faz 5 palavras por rodada (`--limite`) e **para sozinho após 3 verificações**. Espere algumas horas antes de tentar de novo.
- **Modo sem Google (`--urls`)**: você pesquisa a palavra no seu Chrome normal, copia as URLs do topo e cola num arquivo `data/entrada/urls-topo.txt`:
```
psoríase no couro cabeludo
https://site1.com/pagina
https://site2.com/pagina

creatina
https://site3.com/pagina
```
(1ª linha = palavra; linhas seguintes = URLs; linha em branco separa as palavras.) Depois: `node scripts/coletor-serp.js --urls data/entrada/urls-topo.txt --topo 10`. Esse modo não aciona o Google, então não tem captcha; só não traz as perguntas "As pessoas também perguntam".

## Cópia local do HTML e do texto
Para cada concorrente medido, o coletor guarda no SEU computador (pasta `.cache\serp\<palavra>\`, fora do GitHub) o HTML (`.html`, equivale ao Ctrl+U) e o texto (`.txt`). Serve para você conferir os números e consultar. Para a planilha vão só as métricas, nunca o texto.

## A IA lê o texto dos concorrentes
O `montar-prompt.js` inclui no prompt o texto (até 2.500 palavras por página) guardado em `.cache\serp\<palavra>\`, além do vocabulário do topo e das fontes oficiais que eles citam. Rode o `montar-prompt.js` no mesmo computador em que rodou o coletor.

## Planilha com o texto dos concorrentes (para subir no Google Sheets)
No fim de cada rodada o coletor também gera `.cache\concorrentes-texto.csv` (1 linha por concorrente: palavra-chave, posição, site, URL, métricas e o texto da página numa célula, cortado em 45.000 caracteres). Suba esse arquivo no Google Sheets ou anexe no GPT, junto com `data\conteudo\pautas-mestre.csv`. Para rodar sem o coletor: `node scripts/exportar-concorrentes-texto.js`. Fica só no seu PC (`.cache` não vai ao GitHub).

## Só os links (`--so-links`)
```
node scripts/coletor-serp.js --so-links --limite 5
```
Faz só a busca no Google (sem abrir os concorrentes): grava as 5 URLs do topo (mude com `--topo 10`), as perguntas do Google e a dificuldade na planilha mestre (coluna `urls_topo_google`) e acrescenta cada palavra em `data\entrada\urls-topo.txt`. Depois você pode (a) entregar essas URLs ao Gemini para ele ler, ou (b) medir as páginas sem Google: `node scripts/coletor-serp.js --urls data/entrada/urls-topo.txt --topo 10`. O captcha vem da busca no Google, então o limite de palavras por sessão continua o mesmo.
