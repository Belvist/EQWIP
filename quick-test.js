#!/usr/bin/env node

/**
 * EQWIP Quick Test
 * Быстрая проверка основных компонентов
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Цвета
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function quickTest() {
  log('🚀 БЫСТРАЯ ПРОВЕРКА EQWIP', 'blue');
  log('=' * 40, 'blue');
  
  let passed = 0;
  let failed = 0;
  
  // Проверка файлов
  const criticalFiles = [
    'package.json',
    'next.config.ts',
    'prisma/schema.prisma',
    'src/app/layout.tsx',
    'src/lib/db.ts',
    'env.example',
    '.gitignore',
    'README.md'
  ];
  
  log('\n📁 Критические файлы:', 'yellow');
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`  ✅ ${file}`, 'green');
      passed++;
    } else {
      log(`  ❌ ${file}`, 'red');
      failed++;
    }
  });
  
  // Проверка зависимостей
  log('\n📦 Зависимости:', 'yellow');
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const critical = ['next', 'react', 'react-dom', '@prisma/client'];
    const missing = critical.filter(dep => !pkg.dependencies[dep]);
    
    if (missing.length === 0) {
      log('  ✅ Критические зависимости присутствуют', 'green');
      passed++;
    } else {
      log(`  ❌ Отсутствуют: ${missing.join(', ')}`, 'red');
      failed++;
    }
  } catch (error) {
    log('  ❌ Ошибка чтения package.json', 'red');
    failed++;
  }
  
  // Проверка базы данных
  log('\n🗄️ База данных:', 'yellow');
  if (fs.existsSync('prisma/dev.db')) {
    log('  ✅ База данных существует', 'green');
    passed++;
  } else {
    log('  ❌ База данных не найдена', 'red');
    failed++;
  }
  
  // Проверка TypeScript
  log('\n🔧 TypeScript:', 'yellow');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    log('  ✅ TypeScript компилируется', 'green');
    passed++;
  } catch (error) {
    log('  ❌ TypeScript ошибки', 'red');
    failed++;
  }
  
  // Итог
  log('\n' + '=' * 40, 'blue');
  log(`✅ Пройдено: ${passed}`, 'green');
  log(`❌ Провалено: ${failed}`, 'red');
  
  const total = passed + failed;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  if (failed === 0) {
    log('\n🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!', 'green');
    log('Система готова к запуску!', 'green');
  } else {
    log(`\n⚠️  Успешность: ${successRate}%`, 'yellow');
    log('Требуются исправления', 'yellow');
  }
  
  return failed === 0;
}

// Запуск
if (require.main === module) {
  quickTest();
}

module.exports = { quickTest };
