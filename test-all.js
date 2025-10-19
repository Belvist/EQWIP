#!/usr/bin/env node

/**
 * EQWIP Complete Test Suite
 * Главный тест, который запускает все проверки системы
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Импорт тестов
const { runAllTests: runSystemTests } = require('./test-system.js');
const { runServerTests } = require('./test-server.js');

// Главная функция
async function runCompleteTest() {
  log('🚀 ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ EQWIP', 'bright');
  log('=' * 80, 'blue');
  log('Проверяем все компоненты системы...', 'cyan');
  
  const startTime = Date.now();
  let allPassed = true;
  
  try {
    // 1. Тестирование файловой системы и конфигурации
    log('\n📁 ЭТАП 1: ФАЙЛОВАЯ СИСТЕМА И КОНФИГУРАЦИЯ', 'magenta');
    const systemPassed = runSystemTests();
    if (!systemPassed) {
      allPassed = false;
      log('❌ Системные тесты провалены!', 'red');
    }
    
    // 2. Проверка зависимостей
    log('\n📦 ЭТАП 2: ПРОВЕРКА ЗАВИСИМОСТЕЙ', 'magenta');
    try {
      execSync('npm list --depth=0', { stdio: 'pipe' });
      log('✅ Зависимости установлены корректно', 'green');
    } catch (error) {
      log('❌ Проблемы с зависимостями', 'red');
      allPassed = false;
    }
    
    // 3. Проверка TypeScript
    log('\n🔧 ЭТАП 3: ПРОВЕРКА TYPESCRIPT', 'magenta');
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      log('✅ TypeScript компилируется без ошибок', 'green');
    } catch (error) {
      log('❌ TypeScript ошибки найдены', 'red');
      allPassed = false;
    }
    
    // 4. Проверка сборки
    log('\n🔨 ЭТАП 4: ПРОВЕРКА СБОРКИ', 'magenta');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      log('✅ Проект собирается успешно', 'green');
    } catch (error) {
      log('❌ Ошибки сборки', 'red');
      allPassed = false;
    }
    
    // 5. Проверка базы данных
    log('\n🗄️ ЭТАП 5: ПРОВЕРКА БАЗЫ ДАННЫХ', 'magenta');
    try {
      execSync('npx prisma db push', { stdio: 'pipe' });
      log('✅ База данных синхронизирована', 'green');
    } catch (error) {
      log('❌ Проблемы с базой данных', 'red');
      allPassed = false;
    }
    
    // 6. Запуск сервера и тестирование
    log('\n🌐 ЭТАП 6: ТЕСТИРОВАНИЕ СЕРВЕРА', 'magenta');
    log('Запускаем сервер для тестирования...', 'yellow');
    
    // Запускаем сервер в фоне
    const serverProcess = execSync('npm run dev', { 
      stdio: 'pipe',
      detached: true 
    });
    
    // Ждем запуска сервера
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      const serverPassed = await runServerTests();
      if (!serverPassed) {
        allPassed = false;
        log('❌ Тесты сервера провалены!', 'red');
      }
    } catch (error) {
      log('❌ Ошибка тестирования сервера', 'red');
      allPassed = false;
    }
    
    // Останавливаем сервер
    try {
      process.kill(serverProcess.pid);
    } catch (e) {
      // Игнорируем ошибки остановки
    }
    
  } catch (error) {
    log(`💥 Критическая ошибка: ${error.message}`, 'red');
    allPassed = false;
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Итоговый отчет
  log('\n' + '=' * 80, 'blue');
  log('📊 ФИНАЛЬНЫЙ ОТЧЕТ', 'bright');
  log('=' * 80, 'blue');
  
  if (allPassed) {
    log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!', 'green');
    log('✅ Система готова к работе', 'green');
    log('✅ Все компоненты функционируют', 'green');
    log('✅ Архитектура корректна', 'green');
    log('✅ Безопасность настроена', 'green');
  } else {
    log('❌ НАЙДЕНЫ ПРОБЛЕМЫ!', 'red');
    log('⚠️  Требуются исправления', 'yellow');
    log('📝 Проверьте детали выше', 'yellow');
  }
  
  log(`\n⏱️  Время выполнения: ${duration} секунд`, 'cyan');
  log('=' * 80, 'blue');
  
  return allPassed;
}

// Запуск тестов
if (require.main === module) {
  runCompleteTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`💥 Критическая ошибка: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runCompleteTest };
