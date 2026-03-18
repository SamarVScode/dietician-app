import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from './firebase'

const OPENROUTER_API_KEY = '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'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface FoodMacros {
  calories: number
  protein: number
  carbs: number
  fats: number
}

export async function fetchFoodMacros(foodName: string): Promise<FoodMacros | null> {
  const normalized = foodName.trim().toLowerCase()
  if (!normalized) return null

  try {
    // Check Firebase cache first
    const q = query(collection(db, 'foods'), where('name', '==', normalized))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const data = snap.docs[0].data()
      return {
        calories: data.calories ?? 0,
        protein: data.protein ?? 0,
        carbs: data.carbs ?? 0,
        fats: data.fats ?? 0,
      }
    }

    // Call OpenRouter API
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e2b-it:free',
        messages: [{
          role: 'user',
          content: `Return ONLY a JSON object with the approximate macros for a standard serving of "${foodName}". Format: {"calories": number, "protein": number, "carbs": number, "fats": number}. Numbers only, no text.`,
        }],
      }),
    })

    if (!res.ok) {
      console.error('OpenRouter API error:', res.status, await res.text())
      return null
    }

    const json = await res.json()
    const text: string = json?.choices?.[0]?.message?.content ?? ''

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as FoodMacros
    const macros: FoodMacros = {
      calories: Math.round(parsed.calories ?? 0),
      protein: Math.round(parsed.protein ?? 0),
      carbs: Math.round(parsed.carbs ?? 0),
      fats: Math.round(parsed.fats ?? 0),
    }

    // Cache in Firebase
    await addDoc(collection(db, 'foods'), {
      name: normalized,
      ...macros,
      createdAt: new Date().toISOString(),
    })

    return macros
  } catch (err) {
    console.error('Failed to fetch macros for:', foodName, err)
    return null
  }
}
