import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { realtimeManager } from './realtime'

// Инициализация Socket.IO сервера
export const initializeSocket = (server: NetServer) => {
  realtimeManager.initialize(server)
  return realtimeManager.getIO()
}

// API роут для Socket.IO (если нужен для Next.js)
export const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = initializeSocket(res.socket.server as any)
    res.socket.server.io = io
  }
  res.end()
}

// Утилиты для работы с сокетами на клиенте
export const socketUtils = {
  // Присоединение к комнатам
  joinRooms: (socket: any, userId: string, jobId?: string, companyId?: string) => {
    socket.emit('join-user-room', userId)
    if (jobId) {
      socket.emit('join-job-room', jobId)
    }
    if (companyId) {
      socket.emit('join-company-room', companyId)
    }
  },

  // Отметка уведомления прочитанным
  markNotificationRead: (socket: any, notificationId: string) => {
    socket.emit('mark-notification-read', notificationId)
  },

  // Отметка всех уведомлений прочитанными
  markAllNotificationsRead: (socket: any, userId: string) => {
    socket.emit('mark-all-notifications-read', userId)
  },

  // Подписка на события
  subscribeToNotifications: (socket: any, callback: (notification: any) => void) => {
    socket.on('notification', callback)
    return () => {
      socket.off('notification', callback)
    }
  },

  // Подписка на уведомления о вакансиях
  subscribeToJobNotifications: (socket: any, callback: (notification: any) => void) => {
    socket.on('job-notification', callback)
    return () => {
      socket.off('job-notification', callback)
    }
  },

  // Подписка на уведомления о компаниях
  subscribeToCompanyNotifications: (socket: any, callback: (notification: any) => void) => {
    socket.on('company-notification', callback)
    return () => {
      socket.off('company-notification', callback)
    }
  }
}

export default SocketHandler