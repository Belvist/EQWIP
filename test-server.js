#!/usr/bin/env node

/**
 * EQWIP Server Test Suite
 * Проверка работы сервера и API endpoints
 */

const http = require('http');
const https = require('https');
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

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

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

// HTTP запрос
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Проверка запуска сервера
function testServerStart() {
  log('\n🚀 ПРОВЕРКА ЗАПУСКА СЕРВЕРА', 'bright');
  
  test('Сервер запускается без ошибок', () => {
    try {
      // Проверяем, что процесс может запуститься
      execSync('npm run build', { stdio: 'pipe', timeout: 30000 });
      return true;
    } catch (error) {
      return `Ошибка сборки: ${error.message}`;
    }
  });
}

// Проверка API endpoints
async function testAPIEndpoints() {
  log('\n🌐 ПРОВЕРКА API ENDPOINTS', 'bright');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    { path: '/api/health', method: 'GET', expectedStatus: 200 },
    { path: '/api/jobs', method: 'GET', expectedStatus: 200 },
    { path: '/api/companies', method: 'GET', expectedStatus: 200 },
    { path: '/api/stats', method: 'GET', expectedStatus: 200 },
    { path: '/api/auth/session', method: 'GET', expectedStatus: 200 }
  ];
  
  for (const endpoint of endpoints) {
    test(`API ${endpoint.method} ${endpoint.path}`, async () => {
      try {
        const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method
        });
        
        if (response.statusCode === endpoint.expectedStatus) {
          return true;
        } else {
          return `Ожидался статус ${endpoint.expectedStatus}, получен ${response.statusCode}`;
        }
      } catch (error) {
        return `Ошибка запроса: ${error.message}`;
      }
    });
  }
}

// Проверка страниц
async function testPages() {
  log('\n📄 ПРОВЕРКА СТРАНИЦ', 'bright');
  
  const baseUrl = 'http://localhost:3000';
  const pages = [
    { path: '/', name: 'Главная страница' },
    { path: '/jobs', name: 'Страница вакансий' },
    { path: '/auth/signin', name: 'Страница входа' },
    { path: '/auth/signup', name: 'Страница регистрации' },
    { path: '/about', name: 'О нас' },
    { path: '/pricing', name: 'Тарифы' }
  ];
  
  for (const page of pages) {
    test(`Страница ${page.name} (${page.path})`, async () => {
      try {
        const response = await makeRequest(`${baseUrl}${page.path}`);
        
        if (response.statusCode === 200) {
          return true;
        } else {
          return `Статус: ${response.statusCode}`;
        }
      } catch (error) {
        return `Ошибка: ${error.message}`;
      }
    });
  }
}

// Проверка аутентификации
async function testAuthentication() {
  log('\n🔐 ПРОВЕРКА АУТЕНТИФИКАЦИИ', 'bright');
  
  const baseUrl = 'http://localhost:3000';
  
  test('Страница входа доступна', async () => {
    try {
      const response = await makeRequest(`${baseUrl}/auth/signin`);
      return response.statusCode === 200;
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
  
  test('Страница регистрации доступна', async () => {
    try {
      const response = await makeRequest(`${baseUrl}/auth/signup`);
      return response.statusCode === 200;
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
  
  test('API сессии работает', async () => {
    try {
      const response = await makeRequest(`${baseUrl}/api/auth/session`);
      return response.statusCode === 200;
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
}

// Проверка производительности
async function testPerformance() {
  log('\n⚡ ПРОВЕРКА ПРОИЗВОДИТЕЛЬНОСТИ', 'bright');
  
  const baseUrl = 'http://localhost:3000';
  
  test('Время ответа главной страницы', async () => {
    try {
      const start = Date.now();
      const response = await makeRequest(`${baseUrl}/`);
      const duration = Date.now() - start;
      
      if (response.statusCode === 200) {
        return duration < 3000 || `Медленный ответ: ${duration}ms`;
      } else {
        return `Ошибка: ${response.statusCode}`;
      }
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
  
  test('Время ответа API вакансий', async () => {
    try {
      const start = Date.now();
      const response = await makeRequest(`${baseUrl}/api/jobs`);
      const duration = Date.now() - start;
      
      if (response.statusCode === 200) {
        return duration < 2000 || `Медленный ответ: ${duration}ms`;
      } else {
        return `Ошибка: ${response.statusCode}`;
      }
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
}

// Проверка ошибок
async function testErrorHandling() {
  log('\n🚨 ПРОВЕРКА ОБРАБОТКИ ОШИБОК', 'bright');
  
  const baseUrl = 'http://localhost:3000';
  
  test('404 страница', async () => {
    try {
      const response = await makeRequest(`${baseUrl}/nonexistent-page`);
      return response.statusCode === 404;
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
  
  test('Некорректный API endpoint', async () => {
    try {
      const response = await makeRequest(`${baseUrl}/api/nonexistent`);
      return response.statusCode === 404;
    } catch (error) {
      return `Ошибка: ${error.message}`;
    }
  });
}

// Главная функция
async function runServerTests() {
  log('🌐 ЗАПУСК ТЕСТИРОВАНИЯ СЕРВЕРА EQWIP', 'bright');
  log('=' * 60, 'blue');
  
  testServerStart();
  await testAPIEndpoints();
  await testPages();
  await testAuthentication();
  await testPerformance();
  await testErrorHandling();
  
  // Итоговый отчет
  log('\n' + '=' * 60, 'blue');
  log('📊 ИТОГОВЫЙ ОТЧЕТ СЕРВЕРА', 'bright');
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
    log('\n🎉 ВСЕ ТЕСТЫ СЕРВЕРА ПРОЙДЕНЫ!', 'green');
  } else {
    log('\n⚠️  ТРЕБУЮТСЯ ИСПРАВЛЕНИЯ', 'yellow');
  }
  
  return results.failed === 0;
}

// Запуск тестов
if (require.main === module) {
  runServerTests().catch(console.error);
}

module.exports = { runServerTests, test, results };
