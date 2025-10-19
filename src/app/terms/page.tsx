'use client'

import { motion } from 'framer-motion'
import { 
  FileText, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  Globe,
  Scale,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'

export default function TermsPage() {
  const sections = [
    {
      title: '1. Общие положения',
      icon: <FileText className="w-5 h-5" />,
      content: [
        '1.1. Настоящие Условия использования (далее — "Условия") регулируют отношения между ООО "EQWIP" (далее — "Компания") и пользователями платформы EQWIP (далее — "Пользователь").',
        '1.2. Регистрируясь на платформе EQWIP, Пользователь подтверждает, что ознакомлен с настоящими Условиями и принимает их.',
        '1.3. Компания оставляет за собой право изменять настоящие Условия в любое время. Новая редакция Условий вступает в силу с момента ее публикации на платформе.',
        '1.4. Продолжение использования платформы после внесения изменений в Условия означает принятие этих изменений Пользователем.'
      ]
    },
    {
      title: '2. Регистрация и аккаунт',
      icon: <Users className="w-5 h-5" />,
      content: [
        '2.1. Для использования платформы Пользователь обязан пройти регистрацию, предоставив достоверную и полную информацию.',
        '2.2. Пользователь обязан поддерживать актуальность своей контактной информации и данных профиля.',
        '2.3. Пользователь несет полную ответственность за сохранность своих учетных данных (логин и пароль).',
        '2.4. Запрещается передача учетных данных третьим лицам или использование аккаунта другими лицами.',
        '2.5. Компания вправе заблокировать аккаунт Пользователя в случае нарушения настоящих Условий.'
      ]
    },
    {
      title: '3. Использование платформы',
      icon: <Globe className="w-5 h-5" />,
      content: [
        '3.1. Платформа EQWIP предназначена для поиска работы и подбора персонала.',
        '3.2. Пользователям запрещается:',
        '   - Размещать ложную или вводящую в заблуждение информацию',
        '   - Загружать вирусы или вредоносный код',
        '   - Нарушать авторские права и интеллектуальную собственность',
        '   - Использовать платформу для рассылки спама',
        '   - Осуществлять незаконную деятельность',
        '3.3. Пользователь обязуется соблюдать законодательство РФ и нормы деловой этики.',
        '3.4. Компания не несет ответственности за содержание информации, размещаемой Пользователями.'
      ]
    },
    {
      title: '4. Платные услуги',
      icon: <CreditCard className="w-5 h-5" />,
      content: [
        '4.1. Платформа предоставляет как бесплатные, так и платные услуги.',
        '4.2. Стоимость платных услуг указывается на странице тарифов и может быть изменена Компанией.',
        '4.3. Оплата услуг осуществляется через платежные системы, интегрированные в платформу.',
        '4.4. Пользователь вправе отказаться от платных услуг в любой момент, но денежные средства за неиспользованный период не возвращаются.',
        '4.5. Компания вправе приостановить предоставление платных услуг в случае неоплаты.'
      ]
    },
    {
      title: '5. Конфиденциальность',
      icon: <Shield className="w-5 h-5" />,
      content: [
        '5.1. Компания обрабатывает персональные данные Пользователей в соответствии с Политикой конфиденциальности.',
        '5.2. Персональные данные Пользователей защищаются в соответствии с законодательством РФ.',
        '5.3. Компания не передает персональные данные Пользователей третьим лицам без их согласия, за исключением случаев, предусмотренных законодательством.',
        '5.4. Пользователь соглашается на обработку своих персональных данных в целях предоставления услуг платформы.',
        '5.5. Компания принимает необходимые меры для защиты данных Пользователей от несанкционированного доступа.'
      ]
    },
    {
      title: '6. Интеллектуальная собственность',
      icon: <Scale className="w-5 h-5" />,
      content: [
        '6.1. Все права на платформу EQWIP и ее контент принадлежат Компании.',
        '6.2. Пользователям предоставляется ограниченная, неисключительная лицензия на использование платформы.',
        '6.3. Запрещается копирование, распространение или использование элементов платформы без письменного разрешения Компании.',
        '6.4. Пользователь сохраняет права на контент, который он размещает на платформе.',
        '6.5. Размещая контент на платформе, Пользователь предоставляет Компании право на его использование в целях функционирования платформы.'
      ]
    },
    {
      title: '7. Ограничение ответственности',
      icon: <AlertCircle className="w-5 h-5" />,
      content: [
        '7.1. Платформа предоставляется "как есть", без каких-либо гарантий.',
        '7.2. Компания не гарантирует бесперебойную работу платформы.',
        '7.3. Компания не несет ответственности за:',
        '   - Качество услуг, предоставляемых Пользователями друг другу',
        '   - Прямые или косвенные убытки Пользователей',
        '   - Утрату данных или информации',
        '   - Действия третьих лиц',
        '7.4. Максимальная ответственность Компании ограничена суммой, уплаченной Пользователем за услуги за последний месяц.'
      ]
    },
    {
      title: '8. Прекращение использования',
      icon: <Calendar className="w-5 h-5" />,
      content: [
        '8.1. Пользователь вправе прекратить использование платформы в любое время, удалив свой аккаунт.',
        '8.2. Компания вправе заблокировать или удалить аккаунт Пользователя в случае:',
        '   - Нарушения настоящих Условий',
        '   - Мошеннических действий',
        '   - Неуплаты за платные услуги',
        '   - По требованию государственных органов',
        '8.3. При прекращении использования платформы Пользователь теряет доступ к своим данным.',
        '8.4. Компания сохраняет право использовать анонимные данные для улучшения платформы.'
      ]
    },
    {
      title: '9. Разрешение споров',
      icon: <MessageSquare className="w-5 h-5" />,
      content: [
        '9.1. Все споры, возникающие между Пользователем и Компанией, разрешаются путем переговоров.',
        '9.2. При недостижении согласия споры передаются на рассмотрение в суд в соответствии с законодательством РФ.',
        '9.3. Настоящие Условия регулируются законодательством Российской Федерации.',
        '9.4. Если какое-либо положение Условий признается недействительным, это не влияет на действительность остальных положений.',
        '9.5. Бездействие со стороны Компании в случае нарушения Пользователем Условий не означает отказа от прав.'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Условия использования
            </h1>
            <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Правила использования платформы EQWIP. Пожалуйста, внимательно ознакомьтесь с условиями перед регистрацией
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Последнее обновление: 15 января 2024 года</span>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 p-6 mb-8">
          <CardContent className="p-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Быстрая навигация
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {/* Terms Sections */}
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

        {/* Important Notes */}
        <Card className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 mt-12 mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Важная информация
              </h2>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Используя платформу EQWIP, вы подтверждаете свое согласие с настоящими Условиями использования</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>При возникновении вопросов по Условиям, пожалуйста, свяжитесь с нашей службой поддержки</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Компания оставляет за собой право изменять Условия в любое время с уведомлением Пользователей</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Остались вопросы по условиям использования?
          </p>
          <Button
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={() => window.location.href = '/contacts'}
          >
            Связаться с поддержкой
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}