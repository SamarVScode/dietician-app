export interface DailyReport {
  id: string
  userId: string
  date: string
  steps: number
  workout: {
    type: string
    duration: string
    notes: string
  }
  dietFollowed: 'yes' | 'partial' | 'no'
  waterIntake: number
  sleepHours: number
  notes: string
  submittedAt: string
}