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
