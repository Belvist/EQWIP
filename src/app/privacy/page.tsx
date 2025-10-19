'use client'

import { motion } from 'framer-motion'
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Cookie,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  FileText,
  Globe,
  Trash2,
  Download,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Общие положения',
      icon: <Shield className="w-5 h-5" />,
      content: [
        '1.1. Настоящая Политика конфиденциальности (далее — "Политика") определяет порядок обработки и защиты персональных данных пользователей платформы EQWIP (далее — "Пользователь").',
        '1.2. Оператором персональных данных является ООО "EQWIP" (далее — "Оператор").',
        '1.3. Политика разработана в соответствии с требованиями Федерального закона № 152-ФЗ "О персональных данных".',
        '1.4. Оператор обязуется принимать все необходимые меры для защиты персональных данных Пользователей.'
      ]
    },
    {
      title: '2. Обрабатываемые данные',
      icon: <Database className="w-5 h-5" />,
      content: [
        '2.1. Оператор обрабатывает следующие персональные данные Пользователей:',
        '   - ФИО (при предоставлении)',
        '   - Email адрес',
        '   - Номер телефона (при предоставлении)',
        '   - Данные резюме (опыт работы, образование, навыки)',
        '   - Данные профилей компаний',
        '   - IP-адрес и данные о устройстве',
        '   - Данные о действиях на платформе',
        '2.2. Обработка специальных категорий персональных данных не осуществляется.',
        '2.3. Данные собираются при регистрации, заполнении профиля и использовании платформы.'
      ]
    },
    {
      title: '3. Цели обработки данных',
      icon: <FileText className="w-5 h-5" />,
      content: [
        '3.1. Персональные данные Пользователей обрабатываются в следующих целях:',
        '   - Предоставление доступа к функциям платформы',
        '   - Организация процесса поиска работы и подбора персонала',
        '   - Связь с Пользователями по вопросам сервиса',
        '   - Улучшение качества работы платформы',
        '   - Персонализация рекомендаций',
        '   - Аналитика и статистика',
        '   - Предотвращение мошенничества',
        '3.2. Обработка данных осуществляется только в заявленных целях.'
      ]
    },
    {
      title: '4. Правовые основания обработки',
      icon: <FileText className="w-5 h-5" />,
      content: [
        '4.1. Обработка персональных данных осуществляется на следующих правовых основаниях:',
        '   - Согласие Пользователя на обработку персональных данных',
        '   - Необходимость для заключения и исполнения договора с Пользователем',
        '   - Необходимость для соблюдения юридических обязательств Оператора',
        '   - Необходимость для защиты жизненно важных интересов Пользователя',
        '4.2. Согласие на обработку персональных данных дается Пользователем при регистрации.',
        '4.3. Пользователь вправе отозвать согласие на обработку персональных данных в любое время.'
      ]
    },
    {
      title: '5. Защита данных',
      icon: <Lock className="w-5 h-5" />,
      content: [
        '5.1. Оператор принимает следующие меры по защите персональных данных:',
        '   - Технические меры: шифрование данных, использование SSL-сертификатов, firewall',
        '   - Организационные меры: ограничение доступа, обучение персонала, контроль',
        '   - Правовые меры: соблюдение законодательства, договоры конфиденциальности',
        '5.2. Доступ к персональным данным имеют только уполномоченные сотрудники.',
        '5.3. Проводится регулярный аудит безопасности систем обработки данных.',
        '5.4. В случае утечки данных Пользователи будут уведомлены в течение 72 часов.'
      ]
    },
    {
      title: '6. Передача данных третьим лицам',
      icon: <Users className="w-5 h-5" />,
      content: [
        '6.1. Оператор не передает персональные данные Пользователей третьим лицам без их согласия, за исключением:',
        '   - Требований законодательства РФ',
        '   - Запросов государственных органов',
        '   - Случаев защиты прав и законных интересов Оператора',
        '   - Случаев защиты прав и законных интересов Пользователей',
        '6.2. При использовании сторонних сервисов (платежные системы, email-рассылки) передача данных осуществляется на основе договоров конфиденциальности.',
        '6.3. Данные не продаются и не передаются для маркетинговых целей третьим лицам.'
      ]
    },
    {
      title: '7. Cookies и аналитика',
      icon: <Cookie className="w-5 h-5" />,
      content: [
        '7.1. Платформа использует cookies для улучшения пользовательского опыта.',
        '7.2. Cookies используются для:',
        '   - Аутентификации Пользователей',
        '   - Сохранения настроек',
        '   - Аналитики использования платформы',
        '   - Персонализации контента',
        '7.3. Пользователь может настроить прием cookies в настройках браузера.',
        '7.4. Используются сервисы аналитики (Google Analytics, Yandex.Metrika) в анонимизированном виде.',
        '7.5. Сбор данных осуществляется в соответствии с Политикой в отношении файлов cookie.'
      ]
    },
    {
      title: '8. Права Пользователей',
      icon: <Eye className="w-5 h-5" />,
      content: [
        '8.1. Пользователи имеют следующие права в отношении своих персональных данных:',
        '   - Право на доступ к своим данным',
        '   - Право на уточнение и обновление данных',
        '   - Право на удаление данных (право на забвение)',
        '   - Право на ограничение обработки',
        '   - Право на возражение против обработки',
        '   - Право на портабельность данных',
        '   - Право на отзыв согласия',
        '8.2. Для реализации прав Пользователь должен обратиться в службу поддержки.',
        '8.3. Запрос рассматривается в течение 30 дней с момента получения.'
      ]
    },
    {
      title: '9. Хранение данных',
      icon: <Database className="w-5 h-5" />,
      content: [
        '9.1. Персональные данные хранятся в течение срока, необходимого для достижения целей обработки.',
        '9.2. Сроки хранения данных:',
        '   - Данные профиля — пока аккаунт активен',
        '   - Данные резюме — пока аккаунт активен',
        '   - Данные о вакансиях — пока вакансия активна',
        '   - Логи действий — 1 год',
        '   - Аналитические данные — 2 года',
        '9.3. После удаления аккаунта данные анонимизируются или удаляются в течение 30 дней.',
        '9.4. Данные могут храниться дольше в случаях, предусмотренных законодательством.'
      ]
    },
    {
      title: '10. Международная передача данных',
      icon: <Globe className="w-5 h-5" />,
      content: [
        '10.1. Персональные данные Пользователей обрабатываются на серверах, расположенных на территории Российской Федерации.',
        '10.2. Международная передача данных осуществляется только в случаях, предусмотренных законодательством РФ.',
        '10.3. При передаче данных за пределы РФ обеспечивается адекватный уровень защиты.',
        '10.4. Пользователь дает согласие на международную передачу данных при регистрации.'
      ]
    },
    {
      title: '11. Изменения Политики',
      icon: <AlertCircle className="w-5 h-5" />,
      content: [
        '11.1. Оператор вправе вносить изменения в настоящую Политику.',
        '11.2. Изменения вступают в силу с момента их публикации на платформе.',
        '11.3. При существенных изменениях Пользователи уведомляются по email.',
        '11.4. Продолжение использования платформы после изменений означает согласие с новой редакцией.',
        '11.5. Рекомендуется регулярно проверять актуальную версию Политики.'
      ]
    },
    {
      title: '12. Контактная информация',
      icon: <Info className="w-5 h-5" />,
      content: [
        '12.1. По вопросам обработки персональных данных можно обращаться:',
        '   - Email: privacy@jobseqwip.ru',
        '   - Телефон: +7 (495) 123-45-67',
        '   - Почтовый адрес: Москва, Россия',
        '12.2. Для реализации прав Пользователей необходимо обратиться в службу поддержки.',
        '12.3. Ответ на запрос предоставляется в течение 30 дней.',
        '12.4. При отказе в удовлетворении запроса предоставляется обоснование.'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Политика конфиденциальности
            </h1>
            <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Как мы собираем, используем и защищаем ваши персональные данные
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Последнее обновление: 15 января 2024 года</span>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6 mb-8">
          <CardContent className="p-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Быстрая навигация
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sections.map((section, index) => (
                <a
                  key={index}
                  href={`#section-${index}`}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="text-gray-700 dark:text-gray-300">
                    {section.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {section.title}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              id={`section-${index}`}
              className="scroll-mt-8"
            >
              <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-8">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                      <div className="text-gray-700 dark:text-gray-300">
                        {section.icon}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {section.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
                          paragraph.startsWith('   ') ? 'ml-6' : ''
                        }`}
                      >
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Data Rights Card */}
        <Card className="bg-gray-50 dark:bg-neutral-900 border-2 border-gray-200 dark:border-gray-800 mt-12 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ваши права на данные
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Доступ к вашим персональным данным</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Исправление неточных данных</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Удаление ваших данных</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Ограничение обработки</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Портабельность данных</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Отзыв согласия</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Возникли вопросы по политике конфиденциальности?
          </p>
          <Button
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/contacts'}
          >
            Связаться с нами
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}