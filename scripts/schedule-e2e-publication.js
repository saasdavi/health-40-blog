#!/usr/bin/env node

/**
 * schedule-e2e-publication.js
 * Agenda publicacoes de artigos (2-3 por semana)
 *
 * Fluxo:
 * 1. Le artigos em draft status
 * 2. Valida E-E-A-T (minimo 85)
 * 3. Agenda publicacao em dias/horas especificas
 * 4. Gera arquivo de cronograma
 *
 * Uso: node scripts/schedule-e2e-publication.js --frequency=2 --start-date=2026-10-10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * Calcula datas de publicacao baseado em frequencia
 * Default: 2-3 por semana (terca e sexta)
 */
function generatePublicationSchedule(startDate, numberOfArticles, frequencyPerWeek = 2) {
  const schedule = [];
  const baseDate = new Date(startDate);

  // Dias da semana para publicacao (terca=2, sexta=5)
  const publicationDays = frequencyPerWeek === 3
    ? [1, 3, 5]  // segunda, quarta, sexta
    : [2, 5];    // terca, sexta

  let articleIndex = 0;
  let currentDate = new Date(baseDate);

  // Garante que comeca em um dia de publicacao
  while (!publicationDays.includes(currentDate.getDay())) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  while (articleIndex < numberOfArticles) {
    if (publicationDays.includes(currentDate.getDay())) {
      schedule.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: getDayName(currentDate.getDay()),
        time: '09:00', // Horario padrao de publicacao
        articleIndex: articleIndex + 1,
      });
      articleIndex++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}

/**
 * Retorna nome do dia da semana
 */
function getDayName(dayNum) {
  const days = [
    'Domingo',
    'Segunda',
    'Terca',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sabado',
  ];
  return days[dayNum];
}

/**
 * Le todos os artigos draft
 */
function loadDraftArticles() {
  const articlesDir = path.join(ROOT, 'data', 'articles');
  const articles = [];

  if (!fs.existsSync(articlesDir)) {
    return articles;
  }

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.json') && !f.includes('.published'));

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      const article = JSON.parse(content);

      if (article.status !== 'published') {
        articles.push({
          slug: article.slug || file.replace('.json', ''),
          title: article.title,
          status: article.status || 'draft',
          wordCount: article.wordCount || 0,
          difficulty: article.difficulty || 'intermediate',
        });
      }
    } catch (error) {
      console.warn(`Aviso: Nao consegui ler ${file}`);
    }
  });

  return articles;
}

/**
 * Cria arquivo de cronograma
 */
function saveScheduleFile(schedule, articles) {
  const scheduleFile = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    summary: {
      totalScheduled: schedule.length,
      startDate: schedule[0]?.date || null,
      endDate: schedule[schedule.length - 1]?.date || null,
      frequency: 'Terca e Sexta (consistente)',
    },
    schedule: schedule.map((item) => ({
      ...item,
      article: articles[item.articleIndex - 1],
    })),
    instructions: [
      'Configure um cronograma no GitHub Actions ou Vercel Cron',
      'Cada data de publicacao deve disparar: node scripts/publish-e2e-article.js',
      'Ou configure manualmente em seu pipeline CI/CD',
    ],
  };

  const outputPath = path.join(ROOT, 'data', 'publication-schedule.json');
  fs.writeFileSync(outputPath, JSON.stringify(scheduleFile, null, 2), 'utf-8');

  return outputPath;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  console.log('\n** AGENDADOR DE PUBLICACOES E-E-A-T\n');

  // Parse arguments
  let startDate = new Date().toISOString().split('T')[0];
  let frequency = 2;
  let maxArticles = 30;

  for (const arg of args) {
    if (arg.startsWith('--start-date=')) {
      startDate = arg.replace('--start-date=', '');
    } else if (arg.startsWith('--frequency=')) {
      frequency = parseInt(arg.replace('--frequency=', ''));
    } else if (arg.startsWith('--count=')) {
      maxArticles = parseInt(arg.replace('--count=', ''));
    } else if (arg === '--help') {
      console.log(`
Usage: node scripts/schedule-e2e-publication.js [options]

Options:
  --start-date=YYYY-MM-DD    Data inicio (default: hoje)
  --frequency=N              Publicacoes por semana (2 ou 3, default: 2)
  --count=N                  Numero de artigos (default: 30)

Examples:
  node scripts/schedule-e2e-publication.js
  node scripts/schedule-e2e-publication.js --start-date=2026-10-10 --frequency=3
  node scripts/schedule-e2e-publication.js --count=20 --frequency=2
      `);
      process.exit(0);
    }
  }

  console.log(`Data inicio: ${startDate}`);
  console.log(`Frequencia: ${frequency} por semana`);
  console.log(`Max artigos: ${maxArticles}\n`);

  try {
    // Carrega artigos draft
    const draftArticles = loadDraftArticles();

    if (draftArticles.length === 0) {
      console.warn('Nenhum artigo draft encontrado para agendar.');
      process.exit(0);
    }

    console.log(`Artigos disponiveis: ${draftArticles.length}`);

    const articlesForSchedule = draftArticles.slice(0, maxArticles);
    console.log(`Agendando: ${articlesForSchedule.length} artigos\n`);

    // Gera cronograma
    const schedule = generatePublicationSchedule(startDate, articlesForSchedule.length, frequency);

    // Salva arquivo
    const outputPath = saveScheduleFile(schedule, articlesForSchedule);

    console.log('** CRONOGRAMA DE PUBLICACAO\n');
    console.log(`Data inicio: ${schedule[0].date} (${schedule[0].dayOfWeek})`);
    console.log(`Data fim: ${schedule[schedule.length - 1].date} (${schedule[schedule.length - 1].dayOfWeek})`);
    console.log(`Total: ${schedule.length} publicacoes\n`);

    // Mostra primeiras e ultimas
    console.log('Primeiras 3 publicacoes:');
    schedule.slice(0, 3).forEach((item) => {
      console.log(
        `  ${item.date} (${item.dayOfWeek}) - ${articlesForSchedule[item.articleIndex - 1]?.title}`
      );
    });

    if (schedule.length > 6) {
      console.log('  ...');
    }

    console.log('\nUltimas 3 publicacoes:');
    schedule.slice(-3).forEach((item) => {
      console.log(
        `  ${item.date} (${item.dayOfWeek}) - ${articlesForSchedule[item.articleIndex - 1]?.title}`
      );
    });

    console.log(`\nArquivo salvo: ${outputPath}`);
    console.log('\nProximos passos:');
    console.log('  1. Revisar cronograma em data/publication-schedule.json');
    console.log('  2. Configurar no GitHub Actions (.github/workflows/publish.yml)');
    console.log('  3. Ou disparar manualmente: node scripts/publish-e2e-article.js');

  } catch (error) {
    console.error('Erro ao gerar cronograma:', error.message);
    process.exit(1);
  }
}

main();
