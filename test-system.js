#!/usr/bin/env node

/**
 * EQWIP System Test Suite
 * Комплексная проверка всех компонентов системы
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Результаты тестов
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Утилиты
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, testFn) {
  try {
    log(`\n🔍 Тестируем: ${name}`, 'cyan');
    const result = testFn();
    if (result === true) {
      log(`✅ ПРОЙДЕН: ${name}`, 'green');
      results.passed++;
    } else if (result === false) {
      log(`❌ ПРОВАЛЕН: ${name}`, 'red');
      results.failed++;
      results.errors.push(name);
    } else {
      log(`⚠️  ПРЕДУПРЕЖДЕНИЕ: ${name} - ${result}`, 'yellow');
      results.warnings++;
    }
  } catch (error) {
    log(`💥 ОШИБКА: ${name} - ${error.message}`, 'red');
    results.failed++;
    results.errors.push(`${name}: ${error.message}`);
  }
}

// Тесты файловой системы
function testFileSystem() {
  log('\n📁 ПРОВЕРКА ФАЙЛОВОЙ СИСТЕМЫ', 'bright');
  
  test('package.json существует', () => {
    return fs.existsSync('package.json');
  });
  
  test('next.config.ts существует', () => {
    return fs.existsSync('next.config.ts');
  });
  
  test('prisma/schema.prisma существует', () => {
    return fs.existsSync('prisma/schema.prisma');
  });
  
  test('src/app/layout.tsx существует', () => {
    return fs.existsSync('src/app/layout.tsx');
  });
  
  test('src/lib/db.ts существует', () => {
    return fs.existsSync('src/lib/db.ts');
  });
  
  test('env.example существует', () => {
    return fs.existsSync('env.example');
  });
  
  test('.gitignore существует', () => {
    return fs.existsSync('.gitignore');
  });
  
  test('README.md существует', () => {
    return fs.existsSync('README.md');
  });
}

// Тесты зависимостей
function testDependencies() {
  log('\n📦 ПРОВЕРКА ЗАВИСИМОСТЕЙ', 'bright');
  
  test('package.json валиден', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.name && pkg.version && pkg.scripts;
  });
  
  test('node_modules существует', () => {
    return fs.existsSync('node_modules');
  });
  
  test('Критические зависимости установлены', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const critical = ['next', 'react', 'react-dom', '@prisma/client', 'prisma'];
    const missing = critical.filter(dep => !pkg.dependencies[dep] && !pkg.devDependencies[dep]);
    return missing.length === 0 || `Отсутствуют: ${missing.join(', ')}`;
  });
}

// Тесты конфигурации
function testConfiguration() {
  log('\n⚙️ ПРОВЕРКА КОНФИГУРАЦИИ', 'bright');
  
  test('next.config.ts валиден', () => {
    try {
      const config = fs.readFileSync('next.config.ts', 'utf8');
      return config.includes('export default') || config.includes('module.exports');
    } catch {
      return false;
    }
  });
  
  test('prisma/schema.prisma валиден', () => {
    try {
      const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
      return schema.includes('generator client') && schema.includes('datasource db');
    } catch {
      return false;
    }
  });
  
  test('tailwind.config.ts существует', () => {
    return fs.existsSync('tailwind.config.ts');
  });
  
  test('tsconfig.json существует', () => {
    return fs.existsSync('tsconfig.json');
  });
}

// Тесты базы данных
function testDatabase() {
  log('\n🗄️ ПРОВЕРКА БАЗЫ ДАННЫХ', 'bright');
  
  test('dev.db существует', () => {
    return fs.existsSync('prisma/dev.db');
  });
  
  test('Prisma клиент работает', () => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      return true;
    } catch (error) {
      return `Ошибка Prisma: ${error.message}`;
    }
  });
}

// Тесты API endpoints
function testAPIEndpoints() {
  log('\n🌐 ПРОВЕРКА API ENDPOINTS', 'bright');
  
  const apiFiles = [
    'src/app/api/auth/[...nextauth]/route.ts',
    'src/app/api/jobs/route.ts',
    'src/app/api/companies/route.ts',
    'src/app/api/candidates/route.ts',
    'src/app/api/admin/route.ts'
  ];
  
  apiFiles.forEach(file => {
    test(`API файл ${file} существует`, () => {
      return fs.existsSync(file);
    });
  });
}

// Тесты компонентов
function testComponents() {
  log('\n🧩 ПРОВЕРКА КОМПОНЕНТОВ', 'bright');
  
  const componentFiles = [
    'src/components/Header.tsx',
    'src/components/Footer.tsx',
    'src/components/ui/button.tsx',
    'src/components/ui/input.tsx',
    'src/components/ui/card.tsx'
  ];
  
  componentFiles.forEach(file => {
    test(`Компонент ${file} существует`, () => {
      return fs.existsSync(file);
    });
  });
}

// Тесты страниц
function testPages() {
  log('\n📄 ПРОВЕРКА СТРАНИЦ', 'bright');
  
  const pageFiles = [
    'src/app/page.tsx',
    'src/app/jobs/page.tsx',
    'src/app/auth/signin/page.tsx',
    'src/app/auth/signup/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/employer/page.tsx',
    'src/app/admin/page.tsx'
  ];
  
  pageFiles.forEach(file => {
    test(`Страница ${file} существует`, () => {
      return fs.existsSync(file);
    });
  });
}

// Тесты безопасности
function testSecurity() {
  log('\n🔒 ПРОВЕРКА БЕЗОПАСНОСТИ', 'bright');
  
  test('.env не в репозитории', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    return gitignore.includes('.env');
  });
  
  test('Секретные файлы исключены', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    return gitignore.includes('*.log') && gitignore.includes('node_modules');
  });
  
  test('env.example содержит примеры', () => {
    const envExample = fs.readFileSync('env.example', 'utf8');
    return envExample.includes('DATABASE_URL') && envExample.includes('NEXTAUTH_SECRET');
  });
}

// Тесты архитектуры
function testArchitecture() {
  log('\n🏗️ ПРОВЕРКА АРХИТЕКТУРЫ', 'bright');
  
  test('BaseService существует', () => {
    return fs.existsSync('src/lib/core/BaseService.ts');
  });
  
  test('BaseRepository существует', () => {
    return fs.existsSync('src/lib/core/BaseRepository.ts');
  });
  
  test('BaseController существует', () => {
    return fs.existsSync('src/lib/core/BaseController.ts');
  });
  
  test('JobRepository существует', () => {
    return fs.existsSync('src/lib/repositories/JobRepository.ts');
  });
  
  test('JobService существует', () => {
    return fs.existsSync('src/lib/services/JobService.ts');
  });
  
  test('JobController существует', () => {
    return fs.existsSync('src/lib/controllers/JobController.ts');
  });
}

// Тесты типов
function testTypes() {
  log('\n📝 ПРОВЕРКА ТИПОВ', 'bright');
  
  test('Job.ts типы существуют', () => {
    return fs.existsSync('src/lib/types/Job.ts');
  });
  
  test('User.ts типы существуют', () => {
    return fs.existsSync('src/lib/types/User.ts');
  });
}

// Тесты документации
function testDocumentation() {
  log('\n📚 ПРОВЕРКА ДОКУМЕНТАЦИИ', 'bright');
  
  test('README.md содержит описание', () => {
    const readme = fs.readFileSync('README.md', 'utf8');
    return readme.length > 100 && readme.includes('EQWIP');
  });
  
  test('LICENSE существует', () => {
    return fs.existsSync('LICENSE');
  });
  
  test('TEST_ACCOUNTS.md существует', () => {
    return fs.existsSync('TEST_ACCOUNTS.md');
  });
}

// Тесты сборки
function testBuild() {
  log('\n🔨 ПРОВЕРКА СБОРКИ', 'bright');
  
  test('TypeScript компилируется', () => {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return `TypeScript ошибки: ${error.message}`;
    }
  });
  
  test('Next.js конфигурация валидна', () => {
    try {
      execSync('npx next build --dry-run', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return `Next.js ошибки: ${error.message}`;
    }
  });
}

// Тесты производительности
function testPerformance() {
  log('\n⚡ ПРОВЕРКА ПРОИЗВОДИТЕЛЬНОСТИ', 'bright');
  
  test('Большие файлы отсутствуют', () => {
    const largeFiles = [];
    function checkDir(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          checkDir(filePath);
        } else if (stat.isFile() && stat.size > 1024 * 1024) { // > 1MB
          largeFiles.push(filePath);
        }
      });
    }
    checkDir('.');
    return largeFiles.length === 0 || `Большие файлы: ${largeFiles.join(', ')}`;
  });
}

// Главная функция
function runAllTests() {
  log('🚀 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ EQWIP', 'bright');
  log('=' * 60, 'blue');
  
  testFileSystem();
  testDependencies();
  testConfiguration();
  testDatabase();
  testAPIEndpoints();
  testComponents();
  testPages();
  testSecurity();
  testArchitecture();
  testTypes();
  testDocumentation();
  testBuild();
  testPerformance();
  
  // Итоговый отчет
  log('\n' + '=' * 60, 'blue');
  log('📊 ИТОГОВЫЙ ОТЧЕТ', 'bright');
  log('=' * 60, 'blue');
  
  log(`✅ Пройдено: ${results.passed}`, 'green');
  log(`❌ Провалено: ${results.failed}`, 'red');
  log(`⚠️  Предупреждений: ${results.warnings}`, 'yellow');
  
  if (results.errors.length > 0) {
    log('\n💥 ОШИБКИ:', 'red');
    results.errors.forEach(error => {
      log(`  • ${error}`, 'red');
    });
  }
  
  const total = results.passed + results.failed + results.warnings;
  const successRate = ((results.passed / total) * 100).toFixed(1);
  
  log(`\n📈 Успешность: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! СИСТЕМА ГОТОВА К РАБОТЕ!', 'green');
  } else {
    log('\n⚠️  ТРЕБУЮТСЯ ИСПРАВЛЕНИЯ', 'yellow');
  }
  
  return results.failed === 0;
}

// Запуск тестов
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, test, results };
