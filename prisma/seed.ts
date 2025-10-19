import { PrismaClient } from '@prisma/client'
import { UserRole, ExperienceLevel, EmploymentType, WorkFormat, Currency, ApplicationStatus, NotificationType, SubscriptionPlan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create skills
  const skills = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'Machine Learning', category: 'Data Science' },
    { name: 'TensorFlow', category: 'Data Science' },
    { name: 'PyTorch', category: 'Data Science' },
    { name: 'Vue.js', category: 'Frontend' },
    { name: 'JavaScript', category: 'Frontend' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'GraphQL', category: 'Backend' },
    { name: 'Terraform', category: 'DevOps' },
    { name: 'CI/CD', category: 'DevOps' },
    { name: 'Pandas', category: 'Data Science' },
    { name: 'Scikit-learn', category: 'Data Science' },
    { name: 'R', category: 'Data Science' },
    { name: 'SQL', category: 'Database' },
    { name: 'Tableau', category: 'Data Science' },
    { name: 'Power BI', category: 'Data Science' },
    { name: 'Blockchain', category: 'Technology' },
    { name: 'Mobile', category: 'Frontend' }
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill
    })
  }

  // Create users
  const passwordHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD || 'Password123!', 10)
  const users = [
    {
      email: 'employer1@eqwip.com',
      name: 'TechCorp HR',
      role: UserRole.EMPLOYER,
      password: passwordHash
    },
    {
      email: 'employer2@eqwip.com',
      name: 'DataTech HR',
      role: UserRole.EMPLOYER,
      password: passwordHash
    },
    {
      email: 'candidate1@eqwip.com',
      name: 'Александр Иванов',
      role: UserRole.CANDIDATE,
      password: passwordHash
    },
    {
      email: 'candidate2@eqwip.com',
      name: 'Мария Петрова',
      role: UserRole.CANDIDATE,
      password: passwordHash
    },
    {
      email: 'admin@eqwip.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: passwordHash
    }
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    })
  }

  // Create employer profiles
  const employerUsers = await prisma.user.findMany({
    where: { role: UserRole.EMPLOYER }
  })

  const employerProfiles = [
    {
      userId: employerUsers[0].id,
      companyName: 'TechCorp',
      description: 'Ведущая технологическая компания, специализирующаяся на разработке инновационных решений для бизнеса',
      website: 'https://techcorp.com',
      industry: 'Технологии',
      size: '1000+ сотрудников',
      location: 'Moscow, Russia',
      logo: 'T'
    },
    {
      userId: employerUsers[1].id,
      companyName: 'DataTech',
      description: 'Компания, работающая на стыке данных и технологий, создающая продукты для анализа больших данных',
      website: 'https://datatech.com',
      industry: 'Data Science',
      size: '500-1000 сотрудников',
      location: 'Saint Petersburg, Russia',
      logo: 'D'
    }
  ]

  for (const profile of employerProfiles) {
    await prisma.employerProfile.upsert({
      where: { userId: profile.userId },
      update: {},
      create: profile
    })
  }

  // Create candidate profiles
  const candidateUsers = await prisma.user.findMany({
    where: { role: UserRole.CANDIDATE }
  })

  const candidateProfiles = [
    {
      userId: candidateUsers[0].id,
      title: 'Senior Full Stack Developer',
      bio: 'Опытный full-stack разработчик с экспертизой в создании масштабируемых веб-приложений. Интересуюсь AI и машинным обучением.',
      location: 'Moscow, Russia',
      experience: 5,
      salaryMin: 120000,
      salaryMax: 180000,
      currency: Currency.USD,
      website: 'https://alexivanov.dev',
      linkedin: 'https://linkedin.com/in/alexivanov',
      github: 'https://github.com/alexivanov'
    },
    {
      userId: candidateUsers[1].id,
      title: 'Python ML Engineer',
      bio: 'Data Scientist с опытом в разработке ML моделей для реальных бизнес-задач. Специализируюсь на NLP и компьютерном зрении.',
      location: 'Saint Petersburg, Russia',
      experience: 4,
      salaryMin: 250000,
      salaryMax: 400000,
      currency: Currency.RUB,
      linkedin: 'https://linkedin.com/in/mariapetrova',
      github: 'https://github.com/mariapetrova'
    }
  ]

  for (const profile of candidateProfiles) {
    await prisma.candidateProfile.upsert({
      where: { userId: profile.userId },
      update: {},
      create: profile
    })
  }

  // Add candidate skills
  const candidateProfilesData = await prisma.candidateProfile.findMany()
  const allSkills = await prisma.skill.findMany()

  // Alexander's skills
  const alexanderSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker']
  for (const skillName of alexanderSkills) {
    const skill = allSkills.find(s => s.name === skillName)
    if (skill && candidateProfilesData[0]) {
      await prisma.candidateSkill.upsert({
        where: {
          candidateId_skillId: {
            candidateId: candidateProfilesData[0].id,
            skillId: skill.id
          }
        },
        update: {},
        create: {
          candidateId: candidateProfilesData[0].id,
          skillId: skill.id,
          level: 5
        }
      })
    }
  }

  // Maria's skills
  const mariaSkills = ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'Scikit-learn']
  for (const skillName of mariaSkills) {
    const skill = allSkills.find(s => s.name === skillName)
    if (skill && candidateProfilesData[1]) {
      await prisma.candidateSkill.upsert({
        where: {
          candidateId_skillId: {
            candidateId: candidateProfilesData[1].id,
            skillId: skill.id
          }
        },
        update: {},
        create: {
          candidateId: candidateProfilesData[1].id,
          skillId: skill.id,
          level: 4
        }
      })
    }
  }

  // Create jobs
  const employerProfilesData = await prisma.employerProfile.findMany()

  const jobs = [
    {
      employerId: employerProfilesData[0].id,
      title: 'Senior React Developer',
      description: 'Ищем опытного React разработчика для работы над масштабируемыми веб-приложениями...',
      requirements: '5+ лет опыта с React, TypeScript, Redux, REST API',
      responsibilities: 'Разработка пользовательских интерфейсов, работа с командой, участие в архитектурных решениях',
      benefits: 'ДМС, Гибкий график, Обучение, Офис в центре Москвы',
      salaryMin: 120000,
      salaryMax: 180000,
      currency: Currency.USD,
      experienceLevel: ExperienceLevel.SENIOR,
      employmentType: EmploymentType.FULL_TIME,
      workFormat: WorkFormat.HYBRID,
      location: 'Moscow',
      isRemote: true,
      isPromoted: true
    },
    {
      employerId: employerProfilesData[0].id,
      title: 'DevOps Engineer',
      description: 'Ищем DevOps инженера для построения и поддержки инфраструктуры...',
      requirements: 'AWS, Kubernetes, CI/CD, Infrastructure as Code',
      responsibilities: 'Настройка и поддержка облачной инфраструктуры, автоматизация процессов',
      benefits: 'Удаленная работа, Гибкое начало дня, Оборудование',
      salaryMin: 80000,
      salaryMax: 120000,
      currency: Currency.EUR,
      experienceLevel: ExperienceLevel.SENIOR,
      employmentType: EmploymentType.FULL_TIME,
      workFormat: WorkFormat.REMOTE,
      location: 'Remote',
      isRemote: true,
      isPromoted: false
    },
    {
      employerId: employerProfilesData[1].id,
      title: 'Python ML Engineer',
      description: 'Присоединяйтесь к команде Data Science для разработки ML моделей...',
      requirements: 'Python, ML/DL, Pandas, Scikit-learn',
      responsibilities: 'Разработка ML моделей, анализ данных, участие в R&D проектах',
      benefits: 'Высокая зарплата, Карьерный рост, Интересные проекты',
      salaryMin: 250000,
      salaryMax: 400000,
      currency: Currency.RUB,
      experienceLevel: ExperienceLevel.MIDDLE,
      employmentType: EmploymentType.FULL_TIME,
      workFormat: WorkFormat.OFFICE,
      location: 'Saint Petersburg',
      isRemote: false,
      isPromoted: true
    }
  ]

  for (const job of jobs) {
    const createdJob = await prisma.job.create({
      data: job
    })

    // Add skills to jobs
    if (createdJob.title.includes('React')) {
      const reactSkills = allSkills.filter(s => ['React', 'TypeScript', 'Node.js'].includes(s.name))
      for (const skill of reactSkills) {
        await prisma.jobSkill.create({
          data: {
            jobId: createdJob.id,
            skillId: skill.id
          }
        })
      }
    } else if (createdJob.title.includes('DevOps')) {
      const devopsSkills = allSkills.filter(s => ['AWS', 'Docker', 'Kubernetes', 'Terraform'].includes(s.name))
      for (const skill of devopsSkills) {
        await prisma.jobSkill.create({
          data: {
            jobId: createdJob.id,
            skillId: skill.id
          }
        })
      }
    } else if (createdJob.title.includes('Python ML')) {
      const mlSkills = allSkills.filter(s => ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'Scikit-learn'].includes(s.name))
      for (const skill of mlSkills) {
        await prisma.jobSkill.create({
          data: {
            jobId: createdJob.id,
            skillId: skill.id
          }
        })
      }
    }
  }

  // Create applications
  const allJobs = await prisma.job.findMany()
  if (candidateProfilesData[0] && allJobs[0]) {
    await prisma.application.create({
      data: {
        candidateId: candidateProfilesData[0].id,
        jobId: allJobs[0].id,
        status: ApplicationStatus.PENDING,
        coverLetter: 'Имею большой опыт работы с React и TypeScript, готов приступить к работе немедленно.'
      }
    })
  }

  if (candidateProfilesData[1] && allJobs[2]) {
    await prisma.application.create({
      data: {
        candidateId: candidateProfilesData[1].id,
        jobId: allJobs[2].id,
        status: ApplicationStatus.REVIEWED,
        coverLetter: 'Специализируюсь на машинном обучении, имею опыт работы с TensorFlow и PyTorch.'
      }
    })
  }

  // Create some notifications
  const allUsers = await prisma.user.findMany()
  for (const user of allUsers) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: 'Добро пожаловать в EQWIP!',
        message: 'Ваш аккаунт успешно создан. Начните искать работу или публикуйте вакансии.'
      }
    })
  }

  // Create subscriptions
  for (const user of allUsers) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: SubscriptionPlan.FREE
      }
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })