export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function isToday(dateString: string): boolean {
  return dateString === getTodayString()
}