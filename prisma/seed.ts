import { PrismaClient, UserRole, ApplicationStatus, NotificationType, SubscriptionPlan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Check if data already exists
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    console.log('✅ Database already seeded!')
    return
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('123456', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eqwip.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
      name: 'Администратор EQWIP'
    }
  })

  // Create employer users
  const employerPassword = await bcrypt.hash('123456', 10)
  const employer1 = await prisma.user.create({
    data: {
      email: 'employer1@eqwip.com',
      password: employerPassword,
      role: UserRole.EMPLOYER,
      emailVerified: true,
      name: 'TechCorp HR'
    }
  })

  const employer2 = await prisma.user.create({
    data: {
      email: 'employer2@eqwip.com',
      password: employerPassword,
      role: UserRole.EMPLOYER,
      emailVerified: true,
      name: 'DataTech HR'
    }
  })

  // Create candidate users
  const candidatePassword = await bcrypt.hash('123456', 10)
  const candidate1 = await prisma.user.create({
    data: {
      email: 'candidate1@eqwip.com',
      password: candidatePassword,
      role: UserRole.CANDIDATE,
      emailVerified: true,
      name: 'Александр Иванов'
    }
  })

  const candidate2 = await prisma.user.create({
    data: {
      email: 'candidate2@eqwip.com',
      password: candidatePassword,
      role: UserRole.CANDIDATE,
      emailVerified: true,
      name: 'Мария Петрова'
    }
  })

  const testUser = await prisma.user.create({
    data: {
      email: 'test@eqwip.com',
      password: candidatePassword,
      role: UserRole.CANDIDATE,
      emailVerified: true,
      name: 'Тестовый Пользователь'
    }
  })

  // Create university users
  console.log('🎓 Creating universities...')
  
  const universities = [
    {
      name: 'МГУ им. М.В. Ломоносова',
      email: 'university1@eqwip.com',
      description: 'Московский государственный университет имени М.В. Ломоносова - ведущий университет России',
      website: 'https://www.msu.ru',
      location: 'Москва',
      establishedYear: 1755,
      studentCount: 50000,
      specialties: ['Информатика', 'Математика', 'Физика', 'Экономика']
    },
    {
      name: 'СПбГУ',
      email: 'university2@eqwip.com',
      description: 'Санкт-Петербургский государственный университет - один из старейших университетов России',
      website: 'https://spbu.ru',
      location: 'Санкт-Петербург',
      establishedYear: 1724,
      studentCount: 30000,
      specialties: ['Программирование', 'Математика', 'Физика', 'Лингвистика']
    },
    {
      name: 'МФТИ',
      email: 'university3@eqwip.com',
      description: 'Московский физико-технический институт - ведущий технический университет',
      website: 'https://mipt.ru',
      location: 'Москва',
      establishedYear: 1951,
      studentCount: 8000,
      specialties: ['Прикладная математика', 'Физика', 'Информатика', 'Биофизика']
    },
    {
      name: 'ИТМО',
      email: 'university4@eqwip.com',
      description: 'Университет ИТМО - национальный исследовательский университет информационных технологий',
      website: 'https://itmo.ru',
      location: 'Санкт-Петербург',
      establishedYear: 1900,
      studentCount: 12000,
      specialties: ['Информационные технологии', 'Программирование', 'Кибербезопасность', 'Робототехника']
    },
    {
      name: 'ВШЭ',
      email: 'university5@eqwip.com',
      description: 'Национальный исследовательский университет "Высшая школа экономики"',
      website: 'https://www.hse.ru',
      location: 'Москва',
      establishedYear: 1992,
      studentCount: 45000,
      specialties: ['Экономика', 'Менеджмент', 'Социология', 'Политология']
    }
  ]

  const createdUniversities = []
  
  for (const uniData of universities) {
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    const university = await prisma.user.create({
      data: {
        email: uniData.email,
        password: hashedPassword,
        role: UserRole.UNIVERSITY,
        emailVerified: true,
        name: uniData.name
      }
    })

    const universityProfile = await prisma.university.create({
      data: {
        userId: university.id,
        name: uniData.name,
        description: uniData.description,
        website: uniData.website,
        location: uniData.location,
        establishedYear: uniData.establishedYear,
        studentCount: uniData.studentCount,
        specialties: JSON.stringify(uniData.specialties)
      }
    })

    createdUniversities.push(universityProfile)
  }

  // Create company profiles
  await prisma.company.create({
    data: {
      name: 'TechCorp',
      description: 'Ведущая технологическая компания, специализирующаяся на разработке инновационных решений',
      website: 'https://techcorp.com',
      location: 'Москва',
      industry: 'IT',
      size: '1000-5000',
      foundedYear: 2010,
      logo: '/api/files/techcorp-logo.png',
      isVerified: true,
      employerId: employer1.id
    }
  })

  await prisma.company.create({
    data: {
      name: 'DataTech',
      description: 'Компания по анализу данных и машинному обучению',
      website: 'https://datatech.com',
      location: 'Санкт-Петербург',
      industry: 'Data Science',
      size: '100-500',
      foundedYear: 2015,
      logo: '/api/files/datatech-logo.png',
      isVerified: true,
      employerId: employer2.id
    }
  })

  // Create skills
  const skills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'JavaScript', 'AWS', 'Docker',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'MongoDB', 'PostgreSQL',
    'Git', 'Linux', 'Kubernetes', 'GraphQL', 'REST API', 'Vue.js', 'Angular'
  ]

  for (const skillName of skills) {
    await prisma.skill.create({
      data: {
        name: skillName,
        category: 'Technical'
      }
    })
  }

  // Create candidate profiles
  const candidateProfilesData = [
    {
      userId: candidate1.id,
      fullName: 'Александр Иванов',
      title: 'Senior Full Stack Developer',
      experience: 5,
      location: 'Москва',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
      bio: 'Опытный разработчик с 5-летним стажем работы с современными технологиями веб-разработки.'
    },
    {
      userId: candidate2.id,
      fullName: 'Мария Петрова',
      title: 'Python ML Engineer',
      experience: 4,
      location: 'Санкт-Петербург',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL'],
      bio: 'Специалист по машинному обучению с опытом работы в области анализа данных.'
    },
    {
      userId: testUser.id,
      fullName: 'Тестовый Пользователь',
      title: 'Junior Developer',
      experience: 1,
      location: 'Москва',
      skills: ['JavaScript', 'React', 'HTML', 'CSS'],
      bio: 'Начинающий разработчик, изучающий современные технологии.'
    }
  ]

  for (const profileData of candidateProfilesData) {
    await prisma.candidateProfile.create({
      data: {
        userId: profileData.userId,
        fullName: profileData.fullName,
        title: profileData.title,
        experience: profileData.experience,
        location: profileData.location,
        skills: profileData.skills,
        bio: profileData.bio,
        isActive: true
      }
    })
  }

  // Create jobs
  const jobs = [
    {
      title: 'Senior React Developer',
      description: 'Ищем опытного React разработчика для работы над крупным проектом',
      requirements: ['React', 'TypeScript', 'Node.js', '5+ лет опыта'],
      benefits: ['Конкурентная зарплата', 'Удаленная работа', 'Медицинская страховка'],
      salaryMin: 150000,
      salaryMax: 250000,
      currency: 'RUB',
      location: 'Москва',
      workFormat: 'Гибридная',
      employmentType: 'Полная занятость',
      experience: 'Senior',
      category: 'IT',
      isActive: true,
      employerId: employer1.id
    },
    {
      title: 'Python ML Engineer',
      description: 'Разработка моделей машинного обучения для анализа данных',
      requirements: ['Python', 'Machine Learning', 'TensorFlow', '3+ лет опыта'],
      benefits: ['Интересные проекты', 'Обучение', 'Гибкий график'],
      salaryMin: 120000,
      salaryMax: 200000,
      currency: 'RUB',
      location: 'Санкт-Петербург',
      workFormat: 'Удаленная',
      employmentType: 'Полная занятость',
      experience: 'Middle',
      category: 'IT',
      isActive: true,
      employerId: employer2.id
    },
    {
      title: 'Frontend Developer',
      description: 'Разработка пользовательских интерфейсов',
      requirements: ['JavaScript', 'React', 'CSS', '2+ лет опыта'],
      benefits: ['Молодая команда', 'Проектное обучение'],
      salaryMin: 80000,
      salaryMax: 150000,
      currency: 'RUB',
      location: 'Москва',
      workFormat: 'Офис',
      employmentType: 'Полная занятость',
      experience: 'Junior',
      category: 'IT',
      isActive: true,
      employerId: employer1.id
    }
  ]

  for (const jobData of jobs) {
    await prisma.job.create({
      data: jobData
    })
  }

  // Create applications
  const allJobs = await prisma.job.findMany()
  const candidateProfiles = await prisma.candidateProfile.findMany()
  
  if (candidateProfiles[0] && allJobs[0]) {
    await prisma.application.create({
      data: {
        candidateId: candidateProfiles[0].id,
        jobId: allJobs[0].id,
        status: ApplicationStatus.PENDING,
        coverLetter: 'Имею большой опыт работы с React и TypeScript, готов приступить к работе немедленно.'
      }
    })
  }

  if (candidateProfiles[1] && allJobs[1]) {
    await prisma.application.create({
      data: {
        candidateId: candidateProfiles[1].id,
        jobId: allJobs[1].id,
        status: ApplicationStatus.REVIEWED,
        coverLetter: 'Специализируюсь на машинном обучении, имею опыт работы с TensorFlow и PyTorch.'
      }
    })
  }

  // Create internships for universities
  console.log('🎓 Creating internships...')
  
  const internships = [
    {
      title: 'Стажировка по веб-разработке',
      description: 'Стажировка для студентов IT направлений по современным технологиям веб-разработки',
      specialty: 'IT',
      studentCount: 5,
      location: 'Москва',
      universityId: createdUniversities[0].id
    },
    {
      title: 'Стажировка по машинному обучению',
      description: 'Исследовательская стажировка в области машинного обучения и искусственного интеллекта',
      specialty: 'Data Science',
      studentCount: 3,
      location: 'Санкт-Петербург',
      universityId: createdUniversities[1].id
    },
    {
      title: 'Стажировка по кибербезопасности',
      description: 'Практическая стажировка по информационной безопасности и защите данных',
      specialty: 'Cybersecurity',
      studentCount: 4,
      location: 'Москва',
      universityId: createdUniversities[2].id
    }
  ]

  for (const internshipData of internships) {
    await prisma.internshipPosting.create({
      data: {
        title: internshipData.title,
        specialty: internshipData.specialty,
        description: internshipData.description,
        studentCount: internshipData.studentCount,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        location: internshipData.location,
        isActive: true,
        universityId: internshipData.universityId
      }
    })
  }

  // Create subscriptions for all users
  const allUsers = await prisma.user.findMany()
  for (const user of allUsers) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: SubscriptionPlan.FREE
      }
    })
  }

  // Create notifications for all users
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

  console.log('✅ Database seeded successfully!')
  console.log('🎓 Created universities:', universities.length)
  console.log('🎓 Created internships:', internships.length)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })