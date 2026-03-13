export interface User {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  phone: string
  weight: number
  height: number
  bmi: number
  bmiCategory: string
  bodyType: 'Ectomorph' | 'Mesomorph' | 'Endomorph'
  goal: string
  preference: string
  allergies: string[]
  conditions: string[]
  medications: string
  notes: string
  userId: string
  status: 'active' | 'no-plan' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  phone: string
  weight: number
  height: number
  bodyType: 'Ectomorph' | 'Mesomorph' | 'Endomorph'
  goal: string
  preference: string
  allergies: string[]
  conditions: string[]
  medications: string
  notes: string
}