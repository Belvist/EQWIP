# 🔧 Руководство по устранению неполадок EQWIP

## 🚨 Частые проблемы и их решения

### 1. Проблемы с установкой зависимостей

#### Ошибка: "npm ERR! peer dep missing"
```bash
# Решение 1: Установка с legacy peer deps
npm install --legacy-peer-deps

# Решение 2: Очистка кэша
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Ошибка: "Module not found"
```bash
# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install

# Если не помогло, попробуйте с флагом
npm install --legacy-peer-deps
```

### 2. Проблемы с базой данных

#### Ошибка: "Database not found"
```bash
# Создайте базу данных заново
npm run db:reset
npm run db:seed
```

#### Ошибка: "Prisma schema validation"
```bash
# Проверьте, что используете SQLite
# В prisma/schema.prisma должно быть:
# provider = "sqlite"
# datasource db {
#   provider = "sqlite"
#   url      = env("DATABASE_URL")
# }
```

#### Ошибка: "Migration failed"
```bash
# Удалите старые миграции и создайте новые
rm -rf prisma/migrations
npm run db:migrate
```

### 3. Проблемы с TypeScript

#### Ошибка: "Type errors"
```bash
# Проверьте ошибки
npx tsc --noEmit

# Если много ошибок, можно временно отключить проверку
# В tsconfig.json добавьте:
# "skipLibCheck": true
```

#### Ошибка: "Cannot find module"
```bash
# Переустановите зависимости
npm install

# Проверьте, что файл существует
ls -la src/app/[путь_к_файлу]
```

### 4. Проблемы с запуском

#### Ошибка: "Port 3000 is already in use"
```bash
# Вариант 1: Остановите процесс на порту 3000
npx kill-port 3000

# Вариант 2: Запустите на другом порту
npm run dev -- -p 3001
```

#### Ошибка: "Next.js build failed"
```bash
# Очистите кэш Next.js
rm -rf .next
npm run build
```

### 5. Проблемы с аутентификацией

#### Ошибка: "NextAuth configuration"
```bash
# Проверьте переменные окружения
cat .env | grep NEXTAUTH

# Убедитесь, что NEXTAUTH_SECRET установлен
echo "NEXTAUTH_SECRET=your-secret-key-here" >> .env
```

#### Ошибка: "Database connection"
```bash
# Проверьте DATABASE_URL
echo $DATABASE_URL

# Для SQLite должно быть:
# DATABASE_URL="file:./dev.db"
```

### 6. Проблемы с AI функциями

#### Ошибка: "Ollama not found"
```bash
# Установите Ollama
# Windows: скачайте с https://ollama.ai/download/windows
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh

# Запустите Ollama
ollama serve

# В новом терминале загрузите модели
ollama pull qwen2.5:7b-instruct
ollama pull nomic-embed-text:latest
```

#### Ошибка: "AI functions not working"
```bash
# AI функции работают без Ollama, но с ограничениями
# Проверьте переменные в .env:
# AI_PROVIDER="ollama"
# OLLAMA_URL="http://127.0.0.1:11434"
```

### 7. Проблемы с тестами

#### Ошибка: "Test failed"
```bash
# Запустите быстрый тест
npm run test:quick

# Если тесты не проходят, проверьте:
# 1. Все файлы на месте
# 2. База данных создана
# 3. Зависимости установлены
```

## 🔍 Диагностика проблем

### Проверка системы
```bash
# Проверьте версию Node.js
node --version  # Должна быть 18+

# Проверьте версию npm
npm --version

# Проверьте доступность портов
netstat -an | grep 3000
```

### Проверка проекта
```bash
# Проверьте структуру проекта
ls -la

# Проверьте package.json
cat package.json | grep scripts

# Проверьте .env файл
cat .env
```

### Проверка базы данных
```bash
# Откройте Prisma Studio
npx prisma studio

# Проверьте миграции
npx prisma migrate status

# Проверьте схему
npx prisma db pull
```

## 🚀 Полная переустановка

Если ничего не помогает, выполните полную переустановку:

```bash
# 1. Остановите все процессы
npx kill-port 3000

# 2. Удалите все зависимости
rm -rf node_modules package-lock.json

# 3. Удалите базу данных
rm -rf prisma/dev.db prisma/migrations

# 4. Удалите кэш Next.js
rm -rf .next

# 5. Переустановите все
npm install --legacy-peer-deps

# 6. Настройте базу данных
npm run db:generate
npm run db:migrate
npm run db:seed

# 7. Запустите проект
npm run dev
```

## 📞 Получение помощи

### Логи и диагностика
```bash
# Включите подробные логи
DEBUG=* npm run dev

# Проверьте логи Next.js
npm run dev 2>&1 | tee logs.txt

# Проверьте логи базы данных
npx prisma studio
```

### Создание отчета об ошибке
При создании issue в GitHub приложите:

1. **Версии:**
   ```bash
   node --version
   npm --version
   ```

2. **Логи ошибки:**
   ```bash
   npm run dev 2>&1 | tee error.log
   ```

3. **Результат тестов:**
   ```bash
   npm run test:final
   ```

4. **Содержимое .env** (без секретов):
   ```bash
   cat .env | grep -v SECRET
   ```

## ✅ Чек-лист работоспособности

Перед обращением за помощью проверьте:

- [ ] Node.js версии 18+
- [ ] Все зависимости установлены (`npm install`)
- [ ] База данных создана (`npm run db:migrate`)
- [ ] Тестовые данные загружены (`npm run db:seed`)
- [ ] .env файл настроен
- [ ] Порт 3000 свободен
- [ ] Тесты проходят (`npm run test:final`)

## 🎯 Быстрые решения

### "Не запускается"
```bash
npm install --legacy-peer-deps
npm run db:reset
npm run dev
```

### "Ошибки TypeScript"
```bash
# Временно отключите проверку в tsconfig.json
"skipLibCheck": true
```

### "База данных не работает"
```bash
rm prisma/dev.db
npm run db:migrate
npm run db:seed
```

### "AI не работает"
```bash
# Установите Ollama или оставьте как есть
# AI функции работают без Ollama с ограничениями
```

---

**Если проблема не решается, создайте issue в GitHub с подробным описанием! 🚀**
