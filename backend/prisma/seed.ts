import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/bobrapp?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

const roadmapSteps = [
  {
    order: 1,
    title: "Знакомство с музыкальным путем",
    description: "Определи свою цель и текущую точку старта.",
    content:
      "На этом этапе важно понять, зачем ты занимаешься музыкой и какого результата хочешь достичь.",
    checklist: [
      "Запиши свою главную музыкальную цель",
      "Опиши текущий опыт",
      "Выбери ближайший практический шаг",
    ],
    quiz: [
      {
        id: "goal",
        question: "Что важно определить в начале музыкального пути?",
        options: [
          { id: "goal", text: "Цель и текущую точку старта" },
          { id: "plugin", text: "Самый дорогой плагин" },
          { id: "cover", text: "Обложку альбома" },
        ],
        correctOptionId: "goal",
      },
    ],
    pointsReward: 10,
  },
  {
    order: 2,
    title: "Основы DAW",
    description: "Разберись с базовым рабочим пространством DAW.",
    content:
      "DAW помогает записывать, редактировать и собирать музыкальные идеи в один проект.",
    checklist: [
      "Создай новый проект",
      "Добавь аудио или MIDI-дорожку",
      "Сохрани проект",
    ],
    quiz: [
      {
        id: "daw",
        question: "Для чего нужна DAW?",
        options: [
          { id: "record", text: "Для записи и сборки музыкальных идей" },
          { id: "mail", text: "Для рассылки писем" },
          { id: "poster", text: "Для печати афиш" },
        ],
        correctOptionId: "record",
      },
    ],
    pointsReward: 15,
  },
  {
    order: 3,
    title: "Создание первого музыкального фрагмента",
    description: "Собери короткую музыкальную идею.",
    content:
      "Музыкальный фрагмент может быть простым: ритм, бас, аккорды или мелодия.",
    checklist: [
      "Выбери темп",
      "Создай 4-8 тактов идеи",
      "Экспортируй черновик",
    ],
    quiz: [
      {
        id: "fragment",
        question: "Каким может быть первый музыкальный фрагмент?",
        options: [
          { id: "simple", text: "Простой короткой идеей" },
          { id: "album", text: "Только готовым альбомом" },
          { id: "contract", text: "Только контрактом с лейблом" },
        ],
        correctOptionId: "simple",
      },
    ],
    pointsReward: 20,
  },
  {
    order: 4,
    title: "Основы структуры трека",
    description: "Пойми, из каких частей может состоять трек.",
    content:
      "Структура помогает слушателю понимать развитие трека: вступление, куплет, припев, брейк и финал.",
    checklist: [
      "Разметь части будущего трека",
      "Сделай простую аранжировку",
      "Проверь переходы между частями",
    ],
    quiz: [
      {
        id: "structure",
        question: "Зачем нужна структура трека?",
        options: [
          { id: "development", text: "Чтобы управлять развитием трека" },
          { id: "volume", text: "Чтобы сделать все дорожки громче" },
          { id: "password", text: "Чтобы защитить проект паролем" },
        ],
        correctOptionId: "development",
      },
    ],
    pointsReward: 20,
  },
  {
    order: 5,
    title: "Запись вокала или партии",
    description: "Запиши живую партию или вокальный дубль.",
    content:
      "Запись не обязана быть идеальной с первого раза. Важно получить материал, с которым можно работать.",
    checklist: [
      "Подготовь микрофон или инструмент",
      "Запиши несколько дублей",
      "Выбери лучший фрагмент",
    ],
    quiz: [
      {
        id: "takes",
        question: "Зачем записывать несколько дублей?",
        options: [
          { id: "choice", text: "Чтобы выбрать лучший фрагмент" },
          { id: "delete", text: "Чтобы сразу все удалить" },
          { id: "hide", text: "Чтобы скрыть проект" },
        ],
        correctOptionId: "choice",
      },
    ],
    pointsReward: 25,
  },
  {
    order: 6,
    title: "Базовое сведение",
    description: "Сделай трек чище и сбалансированнее.",
    content:
      "Базовое сведение начинается с громкости, панорамы, эквализации и простых эффектов.",
    checklist: [
      "Выставь громкости дорожек",
      "Убери лишние частоты",
      "Добавь базовые эффекты",
    ],
    quiz: [
      {
        id: "mix",
        question: "С чего начинается базовое сведение?",
        options: [
          { id: "balance", text: "С баланса громкости и частот" },
          { id: "cover", text: "С выбора обложки" },
          { id: "upload", text: "С загрузки видео" },
        ],
        correctOptionId: "balance",
      },
    ],
    pointsReward: 25,
  },
  {
    order: 7,
    title: "Подготовка первого релиза",
    description: "Подготовь материал к публикации.",
    content:
      "Перед релизом важно проверить файл, название, обложку и описание трека.",
    checklist: [
      "Экспортируй финальный файл",
      "Подготовь название и описание",
      "Проверь качество перед публикацией",
    ],
    quiz: [
      {
        id: "release",
        question: "Что важно проверить перед релизом?",
        options: [
          { id: "quality", text: "Файл, название, описание и качество" },
          { id: "random", text: "Случайный пароль" },
          { id: "silence", text: "Только тишину в начале" },
        ],
        correctOptionId: "quality",
      },
    ],
    pointsReward: 30,
  },
  {
    order: 8,
    title: "Публикация достижения в профиль",
    description: "Зафиксируй результат и покажи прогресс.",
    content:
      "Публичная фиксация результата помогает видеть путь развития и делиться прогрессом.",
    checklist: [
      "Опиши достигнутый результат",
      "Добавь достижение в профиль",
      "Опубликуй roadmap-пост",
    ],
    quiz: [
      {
        id: "achievement",
        question: "Зачем фиксировать достижение в профиле?",
        options: [
          { id: "progress", text: "Чтобы видеть и показывать прогресс" },
          { id: "reset", text: "Чтобы сбросить roadmap" },
          { id: "block", text: "Чтобы заблокировать следующий этап" },
        ],
        correctOptionId: "progress",
      },
    ],
    pointsReward: 30,
  },
];

async function main() {
  for (const step of roadmapSteps) {
    await prisma.roadmapStep.upsert({
      where: {
        order: step.order,
      },
      create: step,
      update: step,
    });
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
