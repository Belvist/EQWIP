# EQWIP — платформа поиска работы на базе искусственного интеллекта

![EQWIP Logo](public/eqwipdark.png)

**EQWIP** - это современная платформа для поиска работы в IT-сфере, использующая искусственный интеллект для подбора идеальных вакансий и кандидатов.

[![GitHub stars](https://img.shields.io/github/stars/Belvist/EQWIP?style=social)](https://github.com/Belvist/EQWIP)
[![GitHub forks](https://img.shields.io/github/forks/Belvist/EQWIP?style=social)](https://github.com/Belvist/EQWIP)
[![GitHub issues](https://img.shields.io/github/issues/Belvist/EQWIP)](https://github.com/Belvist/EQWIP/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)



### Быстрый запуск (5 минут)

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/Belvist/EQWIP.git
cd EQWIP

# 2. Установите зависимости
npm install --legacy-peer-deps

# 3. Настройте базу данных
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Запустите приложение
npm run dev
```

**Готово!** Откройте http://localhost:3000

## 👥 Тестовые аккаунты

| Роль | Email | Пароль | Описание |
|------|-------|--------|----------|
| **Админ** | `admin@eqwip.com` | `123456` | Полный доступ к системе |
| **Работодатель** | `employer1@eqwip.com` | `123456` | Управление вакансиями |
| **Кандидат** | `candidate1@eqwip.com` | `123456` | Поиск работы |
| **Университет** | `university1@eqwip.com` | `123456` | Публикация стажировок |

## 🎯 Что можно протестировать

### Для кандидатов:
- Поиск вакансий с фильтрами
- Просмотр карточек вакансий
- Создание и редактирование профиля
- Управление резюме
- Подача заявок на вакансии

### Для работодателей:
- Создание вакансий
- Просмотр откликов
- Аналитика и статистика
- Управление компанией

### Для университетов:
- Публикация стажировок
- Управление студентами
- Просмотр заявок на стажировки
- Аналитика по стажировкам

### Для администраторов:
- Модерация контента
- Управление пользователями
- Аналитика платформы
- Настройки системы

## 📱 Основные страницы

- **Главная:** http://localhost:3000
- **Вакансии:** http://localhost:3000/jobs
- **Вход:** http://localhost:3000/auth/signin
- **Дашборд:** http://localhost:3000/dashboard
- **Работодатель:** http://localhost:3000/employer
- **Админ:** http://localhost:3000/admin
- **Университеты:** http://localhost:3000/university

## 🔧 Доступные команды

```bash
# Разработка
npm run dev          # Запуск в dev режиме
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сборки

# База данных
npm run db:generate  # Генерация Prisma клиента
npm run db:migrate   # Применение миграций
npm run db:reset     # Сброс базы данных
npm run db:seed      # Заполнение тестовыми данными

# Утилиты
npm run setup        # Полная настройка проекта
npm run clean        # Очистка проекта
npm run fresh        # Полная переустановка
```

## 🐛 Решение проблем

### Ошибка установки зависимостей:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Ошибка базы данных:
```bash
rm prisma/dev.db
npm run db:migrate
npm run db:seed
```

### Порт 3000 занят:
```bash
npx kill-port 3000
npm run dev
```

## 🏗️ Технологии

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Next.js API Routes, Prisma ORM
- **База данных:** SQLite (dev) / PostgreSQL (prod)
- **Аутентификация:** NextAuth.js
- **UI:** Radix UI, Tailwind CSS, Framer Motion
- **AI:** Ollama (локально) / OpenAI (опционально)


**EQWIP - найди работу мечты с помощью искусственного интеллекта! 🚀**
