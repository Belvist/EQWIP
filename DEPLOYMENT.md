# Deployment Guide

Руководство по развертыванию EQWIP в различных окружениях.

## 🚀 Vercel (Рекомендуется)

### Автоматический деплой
1. Подключите GitHub репозиторий к Vercel
2. Настройте переменные окружения в Vercel Dashboard
3. Деплой запустится автоматически при push в main ветку

### Переменные окружения для Vercel
```env
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
AI_PROVIDER=ollama
OLLAMA_URL=https://your-ollama-instance.com
```

### Настройка базы данных
- Используйте Vercel Postgres или внешний PostgreSQL
- Примените миграции: `npx prisma migrate deploy`

## 🐳 Docker

### Dockerfile
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

### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/eqwip
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=eqwip
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Запуск
```bash
docker-compose up -d
```

## ☁️ AWS

### EC2 + RDS
1. Запустите EC2 инстанс (Ubuntu 20.04+)
2. Создайте RDS PostgreSQL инстанс
3. Настройте Security Groups
4. Установите Node.js и PM2
5. Клонируйте репозиторий и настройте

### Elastic Beanstalk
1. Создайте EB приложение
2. Загрузите код через EB CLI
3. Настройте переменные окружения
4. Настройте RDS для базы данных

## 🐧 Linux VPS

### Установка зависимостей
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib

# Установка PM2
sudo npm install -g pm2
```

### Настройка приложения
```bash
# Клонирование репозитория
git clone https://github.com/Belvist/EQWIP.git
cd EQWIP

# Установка зависимостей
npm install

# Настройка базы данных
sudo -u postgres createdb eqwip
npm run db:migrate

# Сборка приложения
npm run build
```

### Запуск с PM2
```bash
# Создание ecosystem файла
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'eqwip',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/EQWIP',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Запуск приложения
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Настройка Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 SSL/HTTPS

### Let's Encrypt
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Мониторинг

### PM2 Monitoring
```bash
# Установка PM2 Plus
pm2 install pm2-server-monit

# Просмотр метрик
pm2 monit
```

### Логирование
```bash
# Просмотр логов
pm2 logs eqwip

# Ротация логов
pm2 install pm2-logrotate
```

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to server
        run: |
          # Ваши команды деплоя
```

## 🗄️ База данных

### Миграции в продакшене
```bash
# Применение миграций
npx prisma migrate deploy

# Сброс базы данных (ОСТОРОЖНО!)
npx prisma migrate reset
```

### Бэкапы
```bash
# Создание бэкапа
pg_dump eqwip > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
psql eqwip < backup_20250127_120000.sql
```

## 🚨 Troubleshooting

### Проблемы с памятью
```bash
# Увеличение лимита памяти Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Проблемы с базой данных
```bash
# Проверка подключения
npx prisma db pull

# Сброс схемы
npx prisma db push --force-reset
```

### Проблемы с производительностью
- Включите кэширование
- Оптимизируйте запросы к БД
- Используйте CDN для статических файлов
- Настройте сжатие gzip

## 📈 Масштабирование

### Горизонтальное масштабирование
- Используйте load balancer (Nginx, HAProxy)
- Настройте несколько инстансов приложения
- Используйте Redis для сессий

### Вертикальное масштабирование
- Увеличьте RAM и CPU сервера
- Оптимизируйте запросы к БД
- Используйте индексы в базе данных

---

**Удачного деплоя!** 🚀
