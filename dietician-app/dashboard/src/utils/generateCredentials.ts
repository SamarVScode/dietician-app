export function generateUserId(name: string): string {
  const firstName = name.trim().split(' ')[0].toLowerCase()
  const year = new Date().getFullYear()
  const suffix = Math.random().toString(36).substring(2, 5).toLowerCase()
  return `${firstName}${year}${suffix}`
}

export function generatePassword(): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const specials = '@#$!'
  let password = specials[Math.floor(Math.random() * specials.length)]
  for (let i = 0; i < 7; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}