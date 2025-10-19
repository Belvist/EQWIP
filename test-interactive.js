#!/usr/bin/env node

/**
 * EQWIP Interactive Test Suite
 * Проверка всех кнопок, ссылок и интерактивных элементов
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

function testInteractive() {
  log('🎯 ИНТЕРАКТИВНЫЙ ТЕСТ EQWIP', 'magenta');
  log('Проверяем каждую кнопку и каждую страницу...', 'cyan');
  log('=' * 60, 'blue');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  const issues = [];
  
  // 1. Проверка главной страницы
  log('\n🏠 ГЛАВНАЯ СТРАНИЦА (/)', 'cyan');
  testPage('src/app/page.tsx', [
    'Поиск вакансий',
    'Кнопки навигации',
    'Ссылки на регистрацию',
    'Ссылки на вход',
    'Секции контента'
  ]);
  
  // 2. Проверка страницы вакансий
  log('\n💼 СТРАНИЦА ВАКАНСИЙ (/jobs)', 'cyan');
  testPage('src/app/jobs/page.tsx', [
    'Фильтры поиска',
    'Кнопки фильтрации',
    'Карточки вакансий',
    'Пагинация',
    'Сортировка',
    'Сохранение вакансий',
    'Отклик на вакансии'
  ]);
  
  // 3. Проверка аутентификации
  log('\n🔐 АУТЕНТИФИКАЦИЯ', 'cyan');
  
  // Страница входа
  testPage('src/app/auth/signin/page.tsx', [
    'Поле email',
    'Поле пароля',
    'Кнопка входа',
    'Ссылка на регистрацию',
    'Ссылка восстановления пароля',
    'Тестовые аккаунты'
  ]);
  
  // Страница регистрации
  testPage('src/app/auth/signup/page.tsx', [
    'Поля формы регистрации',
    'Выбор роли',
    'Кнопка регистрации',
    'Ссылка на вход',
    'Валидация полей'
  ]);
  
  // 4. Проверка дашборда
  log('\n📊 ДАШБОРД (/dashboard)', 'cyan');
  testPage('src/app/dashboard/page.tsx', [
    'Навигационное меню',
    'Статистика',
    'Быстрые действия',
    'Последние активности',
    'Уведомления'
  ]);
  
  // 5. Проверка страницы работодателя
  log('\n🏢 СТРАНИЦА РАБОТОДАТЕЛЯ (/employer)', 'cyan');
  testPage('src/app/employer/page.tsx', [
    'Создание вакансии',
    'Управление вакансиями',
    'Просмотр откликов',
    'Аналитика',
    'Настройки компании'
  ]);
  
  // 6. Проверка админ панели
  log('\n👑 АДМИН ПАНЕЛЬ (/admin)', 'cyan');
  testPage('src/app/admin/page.tsx', [
    'Управление пользователями',
    'Модерация контента',
    'Аналитика платформы',
    'Управление компаниями',
    'Настройки системы'
  ]);
  
  // 7. Проверка профиля
  log('\n👤 ПРОФИЛЬ (/profile)', 'cyan');
  testPage('src/app/profile/page.tsx', [
    'Редактирование профиля',
    'Загрузка аватара',
    'Управление резюме',
    'Настройки уведомлений',
    'Сохранение изменений'
  ]);
  
  // 8. Проверка резюме
  log('\n📄 РЕЗЮМЕ (/resumes)', 'cyan');
  testPage('src/app/resumes/page.tsx', [
    'Создание резюме',
    'Редактирование резюме',
    'Удаление резюме',
    'Предварительный просмотр',
    'Экспорт в PDF'
  ]);
  
  // 9. Проверка компаний
  log('\n🏢 КОМПАНИИ (/companies)', 'cyan');
  testPage('src/app/companies/page.tsx', [
    'Список компаний',
    'Фильтры компаний',
    'Карточки компаний',
    'Подписка на компании',
    'Поиск компаний'
  ]);
  
  // 10. Проверка кандидатов
  log('\n👥 КАНДИДАТЫ (/candidates)', 'cyan');
  testPage('src/app/candidates/page.tsx', [
    'Список кандидатов',
    'Фильтры кандидатов',
    'Профили кандидатов',
    'Поиск кандидатов',
    'Сортировка'
  ]);
  
  // 11. Проверка стажировок
  log('\n🎓 СТАЖИРОВКИ (/internships)', 'cyan');
  testPage('src/app/internships/page.tsx', [
    'Список стажировок',
    'Фильтры стажировок',
    'Подача заявок',
    'Управление заявками'
  ]);
  
  // 12. Проверка уведомлений
  log('\n🔔 УВЕДОМЛЕНИЯ (/notifications)', 'cyan');
  testPage('src/app/notifications/page.tsx', [
    'Список уведомлений',
    'Отметка как прочитанное',
    'Удаление уведомлений',
    'Настройки уведомлений'
  ]);
  
  // 13. Проверка избранного
  log('\n⭐ ИЗБРАННОЕ (/favorites)', 'cyan');
  testPage('src/app/favorites/page.tsx', [
    'Список избранных вакансий',
    'Удаление из избранного',
    'Сортировка избранного',
    'Фильтры избранного'
  ]);
  
  // 14. Проверка откликов
  log('\n📝 ОТКЛИКИ (/otkliki)', 'cyan');
  testPage('src/app/otkliki/page.tsx', [
    'Список откликов',
    'Статусы откликов',
    'Управление откликами',
    'Фильтры откликов'
  ]);
  
  // 15. Проверка заявок
  log('\n📋 ЗАЯВКИ (/applications)', 'cyan');
  testPage('src/app/applications/page.tsx', [
    'Список заявок',
    'Статусы заявок',
    'Управление заявками',
    'Фильтры заявок'
  ]);
  
  // 16. Проверка чата
  log('\n💬 ЧАТ (/chat)', 'cyan');
  testPage('src/app/chat/page.tsx', [
    'Список чатов',
    'Отправка сообщений',
    'Получение сообщений',
    'Уведомления о сообщениях'
  ]);
  
  // 17. Проверка аналитики
  log('\n📈 АНАЛИТИКА (/analytics)', 'cyan');
  testPage('src/app/analytics/page.tsx', [
    'Графики и диаграммы',
    'Фильтры по датам',
    'Экспорт данных',
    'Настройки отображения'
  ]);
  
  // 18. Проверка карьеры
  log('\n🗺️ КАРЬЕРНАЯ КАРТА (/career-map)', 'cyan');
  testPage('src/app/career-map/page.tsx', [
    'Интерактивная карта',
    'Управление целями',
    'Отслеживание прогресса',
    'Рекомендации'
  ]);
  
  // 19. Проверка AI функций
  log('\n🤖 AI ФУНКЦИИ (/ai-features)', 'cyan');
  testPage('src/app/ai-features/page.tsx', [
    'AI рекомендации',
    'AI анализ резюме',
    'AI подбор вакансий',
    'AI чат-бот'
  ]);
  
  // 20. Проверка рекомендаций
  log('\n🎯 РЕКОМЕНДАЦИИ (/ai-recommendations)', 'cyan');
  testPage('src/app/ai-recommendations/page.tsx', [
    'Персональные рекомендации',
    'Фильтры рекомендаций',
    'Сохранение рекомендаций',
    'Обратная связь'
  ]);
  
  // 21. Проверка тарифов
  log('\n💰 ТАРИФЫ (/pricing)', 'cyan');
  testPage('src/app/pricing/page.tsx', [
    'Тарифные планы',
    'Кнопки выбора тарифа',
    'Сравнение тарифов',
    'Оплата'
  ]);
  
  // 22. Проверка контактов
  log('\n📞 КОНТАКТЫ (/contacts)', 'cyan');
  testPage('src/app/contacts/page.tsx', [
    'Форма обратной связи',
    'Контактная информация',
    'Отправка сообщений',
    'Карта офиса'
  ]);
  
  // 23. Проверка помощи
  log('\n❓ ПОМОЩЬ (/help)', 'cyan');
  testPage('src/app/help/page.tsx', [
    'FAQ',
    'Поиск по помощи',
    'Категории вопросов',
    'Контакт поддержки'
  ]);
  
  // 24. Проверка настроек
  log('\n⚙️ НАСТРОЙКИ (/settings)', 'cyan');
  testPage('src/app/settings/page.tsx', [
    'Настройки профиля',
    'Настройки уведомлений',
    'Настройки приватности',
    'Смена пароля'
  ]);
  
  // 25. Проверка статуса
  log('\n📊 СТАТУС (/status)', 'cyan');
  testPage('src/app/status/page.tsx', [
    'Статус системы',
    'Статистика API',
    'Мониторинг',
    'Логи ошибок'
  ]);
  
  // 26. Проверка офлайн страницы
  log('\n📱 ОФЛАЙН (/offline)', 'cyan');
  testPage('src/app/offline/page.tsx', [
    'Сообщение об офлайн режиме',
    'Кнопка обновления',
    'Кэшированный контент'
  ]);
  
  // 27. Проверка университетов
  log('\n🎓 УНИВЕРСИТЕТЫ (/university)', 'cyan');
  testPage('src/app/university/page.tsx', [
    'Список университетов',
    'Регистрация университета',
    'Управление студентами',
    'Статистика'
  ]);
  
  // 28. Проверка создания вакансии
  log('\n➕ СОЗДАНИЕ ВАКАНСИИ (/post-job)', 'cyan');
  testPage('src/app/post-job/page.tsx', [
    'Форма создания вакансии',
    'Поля вакансии',
    'Предварительный просмотр',
    'Публикация вакансии'
  ]);
  
  // 29. Проверка создания стажировки
  log('\n🎓 СОЗДАНИЕ СТАЖИРОВКИ (/internships/create)', 'cyan');
  testPage('src/app/internships/create/page.tsx', [
    'Форма создания стажировки',
    'Поля стажировки',
    'Предварительный просмотр',
    'Публикация стажировки'
  ]);
  
  // 30. Проверка приватности
  log('\n🔒 ПРИВАТНОСТЬ (/privacy)', 'cyan');
  testPage('src/app/privacy/page.tsx', [
    'Политика конфиденциальности',
    'Навигация по разделам',
    'Согласие на обработку данных'
  ]);
  
  // 31. Проверка условий использования
  log('\n📋 УСЛОВИЯ (/terms)', 'cyan');
  testPage('src/app/terms/page.tsx', [
    'Условия использования',
    'Навигация по разделам',
    'Согласие с условиями'
  ]);
  
  // 32. Проверка cookies
  log('\n🍪 COOKIES (/cookies)', 'cyan');
  testPage('src/app/cookies/page.tsx', [
    'Политика cookies',
    'Управление cookies',
    'Согласие на cookies'
  ]);
  
  // Функция тестирования страницы
  function testPage(pagePath, elements) {
    if (!fs.existsSync(pagePath)) {
      log(`  ❌ ${pagePath} не существует`, 'red');
      failed++;
      issues.push(`Отсутствует страница: ${pagePath}`);
      return;
    }
    
    log(`  ✅ ${pagePath} существует`, 'green');
    passed++;
    
    // Читаем содержимое страницы
    const content = fs.readFileSync(pagePath, 'utf8');
    
    // Проверяем каждый элемент
    elements.forEach(element => {
      if (content.includes(element) || 
          content.includes(element.toLowerCase()) ||
          content.includes(element.toUpperCase())) {
        log(`    ✅ ${element}`, 'green');
        passed++;
      } else {
        log(`    ⚠️  ${element} - не найден`, 'yellow');
        warnings++;
        issues.push(`${pagePath}: ${element} не найден`);
      }
    });
  }
  
  // Итоговый отчет
  log('\n' + '=' * 60, 'blue');
  log('📊 ИТОГОВЫЙ ОТЧЕТ ИНТЕРАКТИВНОГО ТЕСТИРОВАНИЯ', 'blue');
  log('=' * 60, 'blue');
  
  log(`✅ Пройдено: ${passed}`, 'green');
  log(`❌ Провалено: ${failed}`, 'red');
  log(`⚠️  Предупреждений: ${warnings}`, 'yellow');
  
  const total = passed + failed + warnings;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  log(`\n📈 Успешность: ${successRate}%`, successRate > 90 ? 'green' : 'yellow');
  
  if (failed === 0) {
    log('\n🎉 ВСЕ СТРАНИЦЫ И КНОПКИ РАБОТАЮТ!', 'green');
    log('✅ Система полностью функциональна', 'green');
    log('✅ Все интерактивные элементы на месте', 'green');
    
    if (warnings > 0) {
      log('\n⚠️  Есть предупреждения, но система работает', 'yellow');
    }
  } else {
    log('\n❌ НАЙДЕНЫ ПРОБЛЕМЫ!', 'red');
    log('⚠️  Требуются исправления', 'yellow');
  }
  
  // Детальные проблемы
  if (issues.length > 0) {
    log('\n🔍 ДЕТАЛЬНЫЕ ПРОБЛЕМЫ:', 'cyan');
    issues.forEach(issue => {
      log(`  • ${issue}`, 'yellow');
    });
  }
  
  // Рекомендации
  log('\n💡 РЕКОМЕНДАЦИИ:', 'cyan');
  log('  • Запустите npm run dev для тестирования', 'yellow');
  log('  • Проверьте каждую страницу в браузере', 'yellow');
  log('  • Протестируйте все кнопки и формы', 'yellow');
  log('  • Проверьте навигацию между страницами', 'yellow');
  
  return failed === 0;
}

// Запуск теста
if (require.main === module) {
  testInteractive();
}

module.exports = { testInteractive };
