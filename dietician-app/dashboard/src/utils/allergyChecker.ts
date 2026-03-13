export function checkPlanForAllergens(
  planText: string,
  allergies: string[]
): string[] {
  const found: string[] = []
  allergies.forEach((allergy) => {
    if (planText.toLowerCase().includes(allergy.toLowerCase())) {
      found.push(allergy)
    }
  })
  return found
}