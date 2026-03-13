export function validateName(name: string): string {
  if (!name.trim()) return 'Name is required'
  if (name.trim().length < 2) return 'Name is too short'
  return ''
}

export function validateAge(age: number): string {
  if (!age) return 'Age is required'
  if (age < 1 || age > 120) return 'Enter a valid age'
  return ''
}

export function validateWeight(weight: number): string {
  if (!weight) return 'Weight is required'
  if (weight < 10 || weight > 300) return 'Enter a valid weight'
  return ''
}

export function validateHeight(height: number): string {
  if (!height) return 'Height is required'
  if (height < 50 || height > 250) return 'Enter a valid height'
  return ''
}

export function validateEmail(email: string): string {
  if (!email.trim()) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Enter a valid email'
  return ''
}

export function validatePassword(password: string): string {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return ''
}