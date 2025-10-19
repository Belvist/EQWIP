# 🚀 Руководство по деплою EQWIP

## 🌐 Варианты деплоя

### 1. Vercel (Рекомендуется)

**Преимущества:**
- Автоматический деплой из GitHub
- Встроенная поддержка Next.js
- Бесплатный хостинг
- Автоматические SSL сертификаты

**Шаги:**

1. **Подготовьте репозиторий:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Подключите к Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Войдите через GitHub
   - Нажмите "New Project"
   - Выберите репозиторий EQWIP
   - Нажмите "Deploy"

3. **Настройте переменные окружения:**
   ```env
   DATABASE_URL="your-production-database-url"
   NEXTAUTH_URL="https://your-domain.vercel.app"
   NEXTAUTH_SECRET="your-production-secret"
   AI_PROVIDER="ollama"
   OLLAMA_URL="your-ollama-url"
   ```

4. **Настройте базу данных:**
   ```bash
   # В Vercel Dashboard -> Settings -> Environment Variables
   # Добавьте переменные окружения
   ```

### 2. Railway

**Преимущества:**
- Простой деплой
- Встроенная база данных PostgreSQL
- Автоматические деплои

**Шаги:**

1. **Подключите к Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Настройте базу данных:**
   ```bash
   railway add postgresql
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

3. **Деплой:**
   ```bash
   railway up
   ```

### 3. DigitalOcean App Platform

**Преимущества:**
- Полный контроль
- Масштабируемость
- Интеграция с DigitalOcean

**Шаги:**

1. **Создайте App Spec:**
   ```yaml
   name: eqwip
   services:
   - name: web
     source_dir: /
     github:
       repo: Belvist/EQWIP
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: DATABASE_URL
       value: ${db.DATABASE_URL}
   databases:
   - name: db
     engine: PG
     version: "13"
   ```

2. **Деплой через CLI:**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

### 4. Docker

**Создайте Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/eqwip
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=eqwip
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🗄️ Настройка базы данных

### PostgreSQL (Рекомендуется для продакшена)

1. **Создайте базу данных:**
   ```sql
   CREATE DATABASE eqwip_production;
   CREATE USER eqwip_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE eqwip_production TO eqwip_user;
   ```

2. **Обновите DATABASE_URL:**
   ```env
   DATABASE_URL="postgresql://eqwip_user:secure_password@localhost:5432/eqwip_production"
   ```

3. **Примените миграции:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Supabase (Облачная PostgreSQL)

1. **Создайте проект на [supabase.com](https://supabase.com)**
2. **Получите connection string:**
   ```env
   DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
   ```

3. **Настройте Prisma:**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 🔐 Настройка безопасности

### 1. Переменные окружения

**Обязательные для продакшена:**
```env
# База данных
DATABASE_URL="your-production-database-url"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@your-domain.com"

# AI (опционально)
AI_PROVIDER="ollama"
OLLAMA_URL="https://your-ollama-instance.com"
```

### 2. SSL сертификаты

**Vercel/Railway:** Автоматически
**Собственный сервер:** Используйте Let's Encrypt

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com
```

### 3. Firewall

```bash
# Откройте только необходимые порты
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 Мониторинг и логи

### 1. Логирование

```javascript
// В next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}
```

### 2. Мониторинг производительности

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

**Sentry (ошибки):**
```bash
npm install @sentry/nextjs
```

### 3. Health Check

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  })
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:final
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 📈 Оптимизация производительности

### 1. Next.js оптимизации

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false
}
```

### 2. Кэширование

```javascript
// В API routes
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

### 3. CDN

**Vercel:** Автоматически
**Другие платформы:** Настройте CloudFlare или AWS CloudFront

## 🚨 Backup и восстановление

### 1. База данных

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### 2. Файлы

```bash
# Backup файлов
tar -czf files-backup.tar.gz public/uploads/

# Restore
tar -xzf files-backup.tar.gz
```

## ✅ Чек-лист деплоя

- [ ] Код загружен в GitHub
- [ ] Переменные окружения настроены
- [ ] База данных создана и настроена
- [ ] Миграции применены
- [ ] Тестовые данные загружены
- [ ] SSL сертификат установлен
- [ ] Домен настроен
- [ ] Мониторинг настроен
- [ ] Backup настроен
- [ ] Тесты проходят

## 🎉 Готово!

Ваша платформа EQWIP развернута в продакшене!

**Следующие шаги:**
1. Протестируйте все функции
2. Настройте мониторинг
3. Настройте backup
4. Обучите пользователей

---

**Успешного деплоя! 🚀**