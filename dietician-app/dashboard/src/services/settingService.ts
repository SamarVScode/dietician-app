import { db } from './firebase'
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, orderBy,
} from 'firebase/firestore'

export type SettingCategory = 'goals' | 'allergies' | 'conditions' | 'preferences' | 'bodyTypes'

export interface SettingItem {
  id: string
  name: string
  isDefault: boolean
}

const DEFAULT_ITEMS: Record<SettingCategory, string[]> = {
  goals: ['Weight Loss', 'Weight Gain', 'Maintenance', 'Muscle Gain', 'General Health'],
  allergies: ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'],
  conditions: ['Diabetes', 'Hypertension', 'PCOS', 'Thyroid', 'Obesity'],
  preferences: ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian', 'Gluten-Free'],
  bodyTypes: ['Ectomorph', 'Mesomorph', 'Endomorph'],
}

export async function fetchSettings(category: SettingCategory): Promise<SettingItem[]> {
  const defaults: SettingItem[] = DEFAULT_ITEMS[category].map((name, i) => ({
    id: `default-${i}`,
    name,
    isDefault: true,
  }))

  const q = query(
    collection(db, 'settings', category, 'items'),
    orderBy('name')
  )
  const snap = await getDocs(q)
  const custom: SettingItem[] = snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    isDefault: false,
  }))

  return [...defaults, ...custom]
}

export async function addSettingItem(category: SettingCategory, name: string): Promise<void> {
  await addDoc(collection(db, 'settings', category, 'items'), { name })
}

export async function deleteSettingItem(category: SettingCategory, id: string): Promise<void> {
  await deleteDoc(doc(db, 'settings', category, 'items', id))
}