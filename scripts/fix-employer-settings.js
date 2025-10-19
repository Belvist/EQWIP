const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixEmployerSettings() {
  try {
    console.log('Checking employer profiles...')
    
    // Get all employer profiles
    const employers = await prisma.employerProfile.findMany({
      select: {
        id: true,
        userId: true,
        companyName: true,
        notifyOnUniversityPost: true
      }
    })
    
    console.log(`Found ${employers.length} employer profiles`)
    
    // Check which ones have notifyOnUniversityPost set
    const withNotify = employers.filter(e => e.notifyOnUniversityPost === true)
    const withoutNotify = employers.filter(e => e.notifyOnUniversityPost !== true)
    
    console.log(`Employers with notifyOnUniversityPost=true: ${withNotify.length}`)
    console.log(`Employers with notifyOnUniversityPost=false or null: ${withoutNotify.length}`)
    
    if (withoutNotify.length > 0) {
      console.log('\nEmployers without notifyOnUniversityPost:')
      withoutNotify.forEach(e => {
        console.log(`- ${e.companyName} (ID: ${e.id}, UserID: ${e.userId})`)
      })
      
      // Ask if we should set them all to true
      console.log('\nSetting all employers to accept university posts...')
      
      const updateResult = await prisma.employerProfile.updateMany({
        where: {
          notifyOnUniversityPost: {
            not: true
          }
        },
        data: {
          notifyOnUniversityPost: true
        }
      })
      
      console.log(`Updated ${updateResult.count} employer profiles`)
    }
    
    // Check notifications
    console.log('\nChecking notifications...')
    const notifications = await prisma.notification.findMany({
      where: {
        title: 'Заявка на стажеров от университета'
      },
      select: {
        id: true,
        userId: true,
        title: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`Found ${notifications.length} university internship notifications`)
    notifications.forEach(n => {
      console.log(`- ${n.title} for user ${n.userId} at ${n.createdAt}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixEmployerSettings()



