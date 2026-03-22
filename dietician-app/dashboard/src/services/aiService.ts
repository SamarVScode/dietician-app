import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from './firebase'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Free models with fallbacks (tested working as of 2026-03)
const MODELS = [
  'google/gemma-3-4b-it:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
]

export interface FoodMacros {
  calories: number
  protein: number
  carbs: number
  fats: number
}

export async function fetchFoodMacros(foodName: string): Promise<FoodMacros | null> {
  const normalized = foodName.trim().toLowerCase()
  if (!normalized) return null

  if (!OPENROUTER_API_KEY) {
    console.error('VITE_OPENROUTER_API_KEY is not set in .env — macro fetch skipped')
    return null
  }

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

    // Try each model until one succeeds
    let macros: FoodMacros | null = null
    for (const model of MODELS) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{
              role: 'user',
              content: `You are a nutrition database. Return ONLY a valid JSON object (no markdown, no explanation) with the macros per standard serving of "${foodName}".\nFormat: {"calories": number, "protein": number, "carbs": number, "fats": number}`,
            }],
            max_tokens: 100,
          }),
        })

        if (!res.ok) {
          console.warn(`Model ${model} failed (${res.status}), trying next...`)
          continue
        }

        const json = await res.json()
        const text: string = json?.choices?.[0]?.message?.content ?? ''

        // Extract JSON — handle code blocks, trailing text, etc.
        const jsonMatch = text.match(/\{[^{}]*\}/)
        if (!jsonMatch) {
          console.warn(`Model ${model} returned unparseable response: ${text}`)
          continue
        }

        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
        const calories = Math.round(Number(parsed.calories) || 0)
        const protein  = Math.round(Number(parsed.protein)  || 0)
        const carbs    = Math.round(Number(parsed.carbs)    || 0)
        const fats     = Math.round(Number(parsed.fats)     || 0)

        if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) {
          console.warn(`Model ${model} returned all-zero macros for "${foodName}", trying next...`)
          continue
        }

        macros = { calories, protein, carbs, fats }
        break
      } catch (modelErr) {
        console.warn(`Model ${model} threw an error:`, modelErr)
      }
    }

    if (!macros) return null

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
