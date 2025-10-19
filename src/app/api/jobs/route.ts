import { NextRequest } from 'next/server'
import { JobController } from '@/lib/controllers/JobController'

const jobController = new JobController()

export async function GET(request: NextRequest) {
  return jobController.GET(request)
}

export async function POST(request: NextRequest) {
  return jobController.POST(request)
}