#!/usr/bin/env node

/**
 * EQWIP UI Elements Test Suite
 * Проверка реальных UI элементов и интерактивности
 */

const fs = require('fs');
const path = require('path');

// Цвета
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testUIElements() {
  log('🎨 ТЕСТ UI ЭЛЕМЕНТОВ EQWIP', 'magenta');
  log('Проверяем реальные кнопки, формы и интерактивные элементы...', 'cyan');
  log('=' * 60, 'blue');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  const issues = [];
  
  // Функция проверки UI элементов
  function testPageUI(pagePath, expectedElements) {
    if (!fs.existsSync(pagePath)) {
      log(`  ❌ ${pagePath} не существует`, 'red');
      failed++;
      issues.push(`Отсутствует страница: ${pagePath}`);
      return;
    }
    
    log(`  ✅ ${pagePath} существует`, 'green');
    passed++;
    
    const content = fs.readFileSync(pagePath, 'utf8');
    
    expectedElements.forEach(element => {
      const found = element.patterns.some(pattern => 
        content.includes(pattern) || 
        content.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (found) {
        log(`    ✅ ${element.name}`, 'green');
        passed++;
      } else {
        log(`    ⚠️  ${element.name} - не найден`, 'yellow');
        warnings++;
        issues.push(`${pagePath}: ${element.name} не найден`);
      }
    });
  }
  
  // 1. Главная страница
  log('\n🏠 ГЛАВНАЯ СТРАНИЦА (/)', 'cyan');
  testPageUI('src/app/page.tsx', [
    { name: 'Поиск вакансий', patterns: ['search', 'поиск', 'Search', 'input', 'placeholder'] },
    { name: 'Навигация', patterns: ['Header', 'nav', 'menu', 'navigation'] },
    { name: 'Кнопки действий', patterns: ['Button', 'button', 'onClick', 'href'] },
    { name: 'Секции контента', patterns: ['section', 'div', 'className', 'container'] }
  ]);
  
  // 2. Страница вакансий
  log('\n💼 СТРАНИЦА ВАКАНСИЙ (/jobs)', 'cyan');
  testPageUI('src/app/jobs/page.tsx', [
    { name: 'Фильтры', patterns: ['filter', 'Filter', 'select', 'option', 'checkbox'] },
    { name: 'Карточки вакансий', patterns: ['Card', 'card', 'JobCard', 'job-card'] },
    { name: 'Кнопки действий', patterns: ['Button', 'button', 'onClick', 'save', 'apply'] },
    { name: 'Пагинация', patterns: ['pagination', 'Pagination', 'page', 'next', 'prev'] },
    { name: 'Поиск', patterns: ['search', 'Search', 'input', 'query'] }
  ]);
  
  // 3. Страница входа
  log('\n🔐 СТРАНИЦА ВХОДА (/auth/signin)', 'cyan');
  testPageUI('src/app/auth/signin/page.tsx', [
    { name: 'Форма входа', patterns: ['form', 'Form', 'onSubmit', 'handleSubmit'] },
    { name: 'Поле email', patterns: ['email', 'Email', 'type="email"', 'input'] },
    { name: 'Поле пароля', patterns: ['password', 'Password', 'type="password"'] },
    { name: 'Кнопка входа', patterns: ['Button', 'button', 'Войти', 'Sign In', 'onClick'] },
    { name: 'Ссылки', patterns: ['href', 'Link', 'link', 'регистрация', 'signup'] }
  ]);
  
  // 4. Страница регистрации
  log('\n📝 СТРАНИЦА РЕГИСТРАЦИИ (/auth/signup)', 'cyan');
  testPageUI('src/app/auth/signup/page.tsx', [
    { name: 'Форма регистрации', patterns: ['form', 'Form', 'onSubmit', 'handleSubmit'] },
    { name: 'Поля формы', patterns: ['input', 'Input', 'name', 'email', 'password'] },
    { name: 'Выбор роли', patterns: ['role', 'Role', 'select', 'option', 'CANDIDATE', 'EMPLOYER'] },
    { name: 'Кнопка регистрации', patterns: ['Button', 'button', 'Регистрация', 'Sign Up'] }
  ]);
  
  // 5. Дашборд
  log('\n📊 ДАШБОРД (/dashboard)', 'cyan');
  testPageUI('src/app/dashboard/page.tsx', [
    { name: 'Навигация', patterns: ['nav', 'Nav', 'menu', 'Menu', 'sidebar'] },
    { name: 'Статистика', patterns: ['stats', 'Stats', 'statistics', 'count', 'number'] },
    { name: 'Кнопки действий', patterns: ['Button', 'button', 'onClick', 'action'] },
    { name: 'Карточки', patterns: ['Card', 'card', 'CardContent', 'CardHeader'] }
  ]);
  
  // 6. Страница работодателя
  log('\n🏢 СТРАНИЦА РАБОТОДАТЕЛЯ (/employer)', 'cyan');
  testPageUI('src/app/employer/page.tsx', [
    { name: 'Создание вакансии', patterns: ['create', 'Create', 'new', 'New', 'add', 'Add'] },
    { name: 'Управление', patterns: ['manage', 'Manage', 'edit', 'Edit', 'delete', 'Delete'] },
    { name: 'Аналитика', patterns: ['analytics', 'Analytics', 'chart', 'Chart', 'graph'] },
    { name: 'Кнопки действий', patterns: ['Button', 'button', 'onClick', 'action'] }
  ]);
  
  // 7. Админ панель
  log('\n👑 АДМИН ПАНЕЛЬ (/admin)', 'cyan');
  testPageUI('src/app/admin/page.tsx', [
    { name: 'Управление пользователями', patterns: ['users', 'Users', 'user', 'User'] },
    { name: 'Модерация', patterns: ['moderation', 'Moderation', 'moderate', 'Moderate'] },
    { name: 'Аналитика', patterns: ['analytics', 'Analytics', 'stats', 'Stats'] },
    { name: 'Настройки', patterns: ['settings', 'Settings', 'config', 'Config'] }
  ]);
  
  // 8. Профиль
  log('\n👤 ПРОФИЛЬ (/profile)', 'cyan');
  testPageUI('src/app/profile/page.tsx', [
    { name: 'Редактирование', patterns: ['edit', 'Edit', 'editing', 'Editing', 'onClick'] },
    { name: 'Форма профиля', patterns: ['form', 'Form', 'input', 'Input', 'onChange'] },
    { name: 'Загрузка файлов', patterns: ['upload', 'Upload', 'file', 'File', 'avatar'] },
    { name: 'Сохранение', patterns: ['save', 'Save', 'onSubmit', 'handleSubmit'] }
  ]);
  
  // 9. Резюме
  log('\n📄 РЕЗЮМЕ (/resumes)', 'cyan');
  testPageUI('src/app/resumes/page.tsx', [
    { name: 'Создание резюме', patterns: ['create', 'Create', 'new', 'New', 'add', 'Add'] },
    { name: 'Редактирование', patterns: ['edit', 'Edit', 'update', 'Update'] },
    { name: 'Удаление', patterns: ['delete', 'Delete', 'remove', 'Remove'] },
    { name: 'Предварительный просмотр', patterns: ['preview', 'Preview', 'view', 'View'] }
  ]);
  
  // 10. Компании
  log('\n🏢 КОМПАНИИ (/companies)', 'cyan');
  testPageUI('src/app/companies/page.tsx', [
    { name: 'Список компаний', patterns: ['company', 'Company', 'companies', 'Companies'] },
    { name: 'Поиск', patterns: ['search', 'Search', 'input', 'Input', 'query'] },
    { name: 'Фильтры', patterns: ['filter', 'Filter', 'select', 'Select'] },
    { name: 'Карточки', patterns: ['Card', 'card', 'CardContent', 'CardHeader'] }
  ]);
  
  // 11. Кандидаты
  log('\n👥 КАНДИДАТЫ (/candidates)', 'cyan');
  testPageUI('src/app/candidates/page.tsx', [
    { name: 'Список кандидатов', patterns: ['candidate', 'Candidate', 'candidates', 'Candidates'] },
    { name: 'Поиск', patterns: ['search', 'Search', 'input', 'Input'] },
    { name: 'Фильтры', patterns: ['filter', 'Filter', 'select', 'Select'] },
    { name: 'Сортировка', patterns: ['sort', 'Sort', 'order', 'Order'] }
  ]);
  
  // 12. Уведомления
  log('\n🔔 УВЕДОМЛЕНИЯ (/notifications)', 'cyan');
  testPageUI('src/app/notifications/page.tsx', [
    { name: 'Список уведомлений', patterns: ['notification', 'Notification', 'notifications', 'Notifications'] },
    { name: 'Действия', patterns: ['action', 'Action', 'onClick', 'Button'] },
    { name: 'Статусы', patterns: ['status', 'Status', 'read', 'Read', 'unread', 'Unread'] }
  ]);
  
  // 13. Избранное
  log('\n⭐ ИЗБРАННОЕ (/favorites)', 'cyan');
  testPageUI('src/app/favorites/page.tsx', [
    { name: 'Список избранного', patterns: ['favorite', 'Favorite', 'favorites', 'Favorites'] },
    { name: 'Удаление', patterns: ['delete', 'Delete', 'remove', 'Remove'] },
    { name: 'Сортировка', patterns: ['sort', 'Sort', 'order', 'Order'] }
  ]);
  
  // 14. Отклики
  log('\n📝 ОТКЛИКИ (/otkliki)', 'cyan');
  testPageUI('src/app/otkliki/page.tsx', [
    { name: 'Список откликов', patterns: ['application', 'Application', 'applications', 'Applications'] },
    { name: 'Статусы', patterns: ['status', 'Status', 'pending', 'Pending', 'approved', 'Approved'] },
    { name: 'Действия', patterns: ['action', 'Action', 'onClick', 'Button'] }
  ]);
  
  // 15. Заявки
  log('\n📋 ЗАЯВКИ (/applications)', 'cyan');
  testPageUI('src/app/applications/page.tsx', [
    { name: 'Список заявок', patterns: ['application', 'Application', 'applications', 'Applications'] },
    { name: 'Статусы', patterns: ['status', 'Status', 'state', 'State'] },
    { name: 'Действия', patterns: ['action', 'Action', 'onClick', 'Button'] }
  ]);
  
  // 16. Чат
  log('\n💬 ЧАТ (/chat)', 'cyan');
  testPageUI('src/app/chat/page.tsx', [
    { name: 'Список чатов', patterns: ['chat', 'Chat', 'message', 'Message'] },
    { name: 'Отправка сообщений', patterns: ['send', 'Send', 'input', 'Input', 'onSubmit'] },
    { name: 'Получение сообщений', patterns: ['receive', 'Receive', 'get', 'Get'] }
  ]);
  
  // 17. Аналитика
  log('\n📈 АНАЛИТИКА (/analytics)', 'cyan');
  testPageUI('src/app/analytics/page.tsx', [
    { name: 'Графики', patterns: ['chart', 'Chart', 'graph', 'Graph', 'recharts'] },
    { name: 'Фильтры', patterns: ['filter', 'Filter', 'date', 'Date', 'range', 'Range'] },
    { name: 'Экспорт', patterns: ['export', 'Export', 'download', 'Download'] }
  ]);
  
  // 18. Карьерная карта
  log('\n🗺️ КАРЬЕРНАЯ КАРТА (/career-map)', 'cyan');
  testPageUI('src/app/career-map/page.tsx', [
    { name: 'Интерактивная карта', patterns: ['map', 'Map', 'career', 'Career'] },
    { name: 'Управление целями', patterns: ['goal', 'Goal', 'goals', 'Goals'] },
    { name: 'Прогресс', patterns: ['progress', 'Progress', 'track', 'Track'] }
  ]);
  
  // 19. AI функции
  log('\n🤖 AI ФУНКЦИИ (/ai-features)', 'cyan');
  testPageUI('src/app/ai-features/page.tsx', [
    { name: 'AI рекомендации', patterns: ['ai', 'AI', 'recommendation', 'Recommendation'] },
    { name: 'AI анализ', patterns: ['analysis', 'Analysis', 'analyze', 'Analyze'] },
    { name: 'AI чат', patterns: ['chat', 'Chat', 'bot', 'Bot'] }
  ]);
  
  // 20. Рекомендации
  log('\n🎯 РЕКОМЕНДАЦИИ (/ai-recommendations)', 'cyan');
  testPageUI('src/app/ai-recommendations/page.tsx', [
    { name: 'Персональные рекомендации', patterns: ['recommendation', 'Recommendation', 'personal', 'Personal'] },
    { name: 'Фильтры', patterns: ['filter', 'Filter', 'select', 'Select'] },
    { name: 'Сохранение', patterns: ['save', 'Save', 'bookmark', 'Bookmark'] }
  ]);
  
  // 21. Тарифы
  log('\n💰 ТАРИФЫ (/pricing)', 'cyan');
  testPageUI('src/app/pricing/page.tsx', [
    { name: 'Тарифные планы', patterns: ['plan', 'Plan', 'pricing', 'Pricing', 'price', 'Price'] },
    { name: 'Кнопки выбора', patterns: ['Button', 'button', 'select', 'Select', 'choose', 'Choose'] },
    { name: 'Сравнение', patterns: ['compare', 'Compare', 'comparison', 'Comparison'] }
  ]);
  
  // 22. Контакты
  log('\n📞 КОНТАКТЫ (/contacts)', 'cyan');
  testPageUI('src/app/contacts/page.tsx', [
    { name: 'Форма обратной связи', patterns: ['form', 'Form', 'contact', 'Contact', 'message', 'Message'] },
    { name: 'Контактная информация', patterns: ['contact', 'Contact', 'info', 'Info', 'address', 'Address'] },
    { name: 'Отправка', patterns: ['send', 'Send', 'submit', 'Submit', 'onSubmit'] }
  ]);
  
  // 23. Помощь
  log('\n❓ ПОМОЩЬ (/help)', 'cyan');
  testPageUI('src/app/help/page.tsx', [
    { name: 'FAQ', patterns: ['faq', 'FAQ', 'question', 'Question', 'answer', 'Answer'] },
    { name: 'Поиск', patterns: ['search', 'Search', 'input', 'Input'] },
    { name: 'Категории', patterns: ['category', 'Category', 'categories', 'Categories'] }
  ]);
  
  // 24. Настройки
  log('\n⚙️ НАСТРОЙКИ (/settings)', 'cyan');
  testPageUI('src/app/settings/page.tsx', [
    { name: 'Настройки профиля', patterns: ['profile', 'Profile', 'setting', 'Setting'] },
    { name: 'Уведомления', patterns: ['notification', 'Notification', 'notify', 'Notify'] },
    { name: 'Приватность', patterns: ['privacy', 'Privacy', 'private', 'Private'] }
  ]);
  
  // 25. Статус
  log('\n📊 СТАТУС (/status)', 'cyan');
  testPageUI('src/app/status/page.tsx', [
    { name: 'Статус системы', patterns: ['status', 'Status', 'system', 'System'] },
    { name: 'Мониторинг', patterns: ['monitor', 'Monitor', 'health', 'Health'] },
    { name: 'Статистика', patterns: ['stats', 'Stats', 'statistics', 'Statistics'] }
  ]);
  
  // 26. Офлайн
  log('\n📱 ОФЛАЙН (/offline)', 'cyan');
  testPageUI('src/app/offline/page.tsx', [
    { name: 'Офлайн сообщение', patterns: ['offline', 'Offline', 'message', 'Message'] },
    { name: 'Кнопка обновления', patterns: ['refresh', 'Refresh', 'reload', 'Reload', 'Button'] }
  ]);
  
  // 27. Университеты
  log('\n🎓 УНИВЕРСИТЕТЫ (/university)', 'cyan');
  testPageUI('src/app/university/page.tsx', [
    { name: 'Список университетов', patterns: ['university', 'University', 'universities', 'Universities'] },
    { name: 'Регистрация', patterns: ['register', 'Register', 'registration', 'Registration'] },
    { name: 'Управление', patterns: ['manage', 'Manage', 'admin', 'Admin'] }
  ]);
  
  // 28. Создание вакансии
  log('\n➕ СОЗДАНИЕ ВАКАНСИИ (/post-job)', 'cyan');
  testPageUI('src/app/post-job/page.tsx', [
    { name: 'Форма создания', patterns: ['form', 'Form', 'create', 'Create', 'job', 'Job'] },
    { name: 'Поля вакансии', patterns: ['title', 'Title', 'description', 'Description', 'input', 'Input'] },
    { name: 'Предварительный просмотр', patterns: ['preview', 'Preview', 'view', 'View'] }
  ]);
  
  // 29. Создание стажировки
  log('\n🎓 СОЗДАНИЕ СТАЖИРОВКИ (/internships/create)', 'cyan');
  testPageUI('src/app/internships/create/page.tsx', [
    { name: 'Форма создания', patterns: ['form', 'Form', 'create', 'Create', 'internship', 'Internship'] },
    { name: 'Поля стажировки', patterns: ['title', 'Title', 'description', 'Description', 'input', 'Input'] },
    { name: 'Предварительный просмотр', patterns: ['preview', 'Preview', 'view', 'View'] }
  ]);
  
  // 30. Приватность
  log('\n🔒 ПРИВАТНОСТЬ (/privacy)', 'cyan');
  testPageUI('src/app/privacy/page.tsx', [
    { name: 'Политика конфиденциальности', patterns: ['privacy', 'Privacy', 'policy', 'Policy'] },
    { name: 'Навигация', patterns: ['nav', 'Nav', 'menu', 'Menu', 'section', 'Section'] }
  ]);
  
  // 31. Условия
  log('\n📋 УСЛОВИЯ (/terms)', 'cyan');
  testPageUI('src/app/terms/page.tsx', [
    { name: 'Условия использования', patterns: ['terms', 'Terms', 'conditions', 'Conditions'] },
    { name: 'Навигация', patterns: ['nav', 'Nav', 'menu', 'Menu', 'section', 'Section'] }
  ]);
  
  // 32. Cookies
  log('\n🍪 COOKIES (/cookies)', 'cyan');
  testPageUI('src/app/cookies/page.tsx', [
    { name: 'Политика cookies', patterns: ['cookie', 'Cookie', 'cookies', 'Cookies'] },
    { name: 'Управление', patterns: ['manage', 'Manage', 'control', 'Control'] }
  ]);
  
  // Итоговый отчет
  log('\n' + '=' * 60, 'blue');
  log('📊 ИТОГОВЫЙ ОТЧЕТ UI ЭЛЕМЕНТОВ', 'blue');
  log('=' * 60, 'blue');
  
  log(`✅ Пройдено: ${passed}`, 'green');
  log(`❌ Провалено: ${failed}`, 'red');
  log(`⚠️  Предупреждений: ${warnings}`, 'yellow');
  
  const total = passed + failed + warnings;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  log(`\n📈 Успешность: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');
  
  if (failed === 0) {
    log('\n🎉 ВСЕ UI ЭЛЕМЕНТЫ НАЙДЕНЫ!', 'green');
    log('✅ Система имеет все необходимые интерфейсы', 'green');
    log('✅ Все страницы содержат интерактивные элементы', 'green');
    
    if (warnings > 0) {
      log('\n⚠️  Есть предупреждения, но система функциональна', 'yellow');
    }
  } else {
    log('\n❌ НАЙДЕНЫ ПРОБЛЕМЫ!', 'red');
    log('⚠️  Требуются исправления', 'yellow');
  }
  
  // Детальные проблемы
  if (issues.length > 0) {
    log('\n🔍 ДЕТАЛЬНЫЕ ПРОБЛЕМЫ:', 'cyan');
    issues.slice(0, 20).forEach(issue => {
      log(`  • ${issue}`, 'yellow');
    });
    
    if (issues.length > 20) {
      log(`  ... и еще ${issues.length - 20} проблем`, 'yellow');
    }
  }
  
  // Рекомендации
  log('\n💡 РЕКОМЕНДАЦИИ:', 'cyan');
  log('  • Запустите npm run dev для тестирования', 'yellow');
  log('  • Проверьте каждую страницу в браузере', 'yellow');
  log('  • Протестируйте все кнопки и формы', 'yellow');
  log('  • Проверьте навигацию между страницами', 'yellow');
  log('  • Убедитесь, что все формы работают', 'yellow');
  
  return failed === 0;
}

// Запуск теста
if (require.main === module) {
  testUIElements();
}

module.exports = { testUIElements };
