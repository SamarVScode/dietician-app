export function calculateBMI(
  weight: number,
  height: number
): { value: number; category: string } {
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  const value = parseFloat(bmi.toFixed(1))
  let category = ''
  if (value < 18.5) category = 'Underweight'
  else if (value < 25) category = 'Normal'
  else if (value < 30) category = 'Overweight'
  else category = 'Obese'
  return { value, category }
}