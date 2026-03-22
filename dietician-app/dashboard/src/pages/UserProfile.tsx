import { useState, useEffect } from 'react'
import { showToast } from '../utils/toast'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, orderBy, query as fsQuery, where,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { fetchFoodMacros } from '../services/aiService'
import PageWrapper from '../components/layout/PageWrapper'
import { useSettings } from '../hooks/useSettings'
import { MealBuilder } from '../components/dietplan/MealBuilder'
import { emptyMeal, DAYS, generateDayNames, cloneMeals as cloneMealsUtil, formatTime12h, generateWaterSchedule } from '../components/dietplan/mealUtils'
import type { Meal, DayPlan as MealDayPlan, TemplateFormData } from '../components/dietplan/mealUtils'
import {
  User, Phone, Target, Salad, Heart, Pill, FileText,
  ArrowLeft, Edit2, Save, X, Eye, EyeOff, Copy, Check,
  ClipboardList, UtensilsCrossed, Activity, KeyRound,
  ChevronRight, Trash2, Plus, BookOpen, Flame, Clock,
  AlertTriangle, ChevronDown, ChevronUp, CheckCircle, XCircle, Droplets, Moon, Sun,
} from 'lucide-react'

const GENDERS = ['Male', 'Female', 'Other']
type TabKey = 'profile' | 'dietplan' | 'wellness' | 'reports' | 'credentials'
type PlanMode = 'idle' | 'edit' | 'template' | 'pick-custom-duration' | 'custom-wellness' | 'custom'

interface UserData {
  id: string; name: string; age: number; gender: string; phone: string
  weight: number; height: number; bmi: number; bmiCategory: string
  bodyType: string; goal: string; preference: string
  allergies: string[]; conditions: string[]; medications: string
  notes: string; userId: string; userEmail: string; password?: string
  status: string; createdAt: string; updatedAt: string
  // Body composition (smart scale — optional)
  bodyFatPercent?: number | null
  muscleMass?: number | null
  boneMass?: number | null
  bodyWaterPercent?: number | null
  visceralFat?: number | null
  bmr?: number | null
  metabolicAge?: number | null
}

interface DayPlan { day: number; dayName: string; meals: Meal[]; isOverride: boolean }

interface MealLog {
  mealName: string; scheduledTime: string
  completed: boolean; completedAt: string | null
}
interface WaterLog {
  scheduledTime: string; amountMl: number
  completed: boolean; completedAt: string | null
}

interface AssignedPlan {
  id: string; templateId: string | null; templateName: string
  days: DayPlan[]; assignedAt: string; status: string
  wakeUpTime?: string; sleepTime?: string; waterIntakeMl?: number
}

interface Template extends TemplateFormData {
  id: string; createdAt: string; updatedAt: string
}

// Re-export so usage below stays consistent
const cloneMeals = cloneMealsUtil

const goalColors: Record<string, { bg: string; color: string; border: string }> = {
  'Weight Loss':     { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Muscle Gain':     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Maintain Weight': { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  'General Health':  { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  active:    { label: 'Plan Active', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#bbf7d0' },
  'no-plan': { label: 'No Plan',     bg: '#fffbeb', text: '#b45309', dot: '#f59e0b', border: '#fde68a' },
  inactive:  { label: 'Inactive',    bg: '#fff5f5', text: '#c53030', dot: '#fc8181', border: '#fed7d7' },
}

const cardStyle = { background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }
const cardClass = 'p-3.5 sm:p-6 rounded-[14px] sm:rounded-[20px]'
const labelStyle = { fontSize: '11px', fontWeight: '700' as const, color: '#b0bdd8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '4px' }
const valueStyle = { fontSize: '15px', fontWeight: '600' as const, color: '#0d1b3e' }
const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid #e8eef8', background: '#f8fafd', fontSize: '14px', fontWeight: '500' as const, color: '#0d1b3e', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }
const chipStyle = (selected: boolean) => ({ padding: '7px 14px', borderRadius: '40px', border: selected ? '2px solid #1a73e8' : '2px solid #e8eef8', background: selected ? '#eef3ff' : '#f8fafd', color: selected ? '#1a73e8' : '#4a5568', fontSize: '13px', fontWeight: '600' as const, cursor: 'pointer', transition: 'all 0.15s' })

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab]             = useState<TabKey>('profile')
  const [isEditing, setIsEditing]             = useState(false)
  const [editForm, setEditForm]               = useState<Partial<UserData>>({})
  const [showPassword, setShowPassword]       = useState(false)
  const [copied, setCopied]                   = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [planMode, setPlanMode]                     = useState<PlanMode>('idle')
  const [viewDay, setViewDay]                       = useState<number>(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null)
  const [expandedDay, setExpandedDay]               = useState<number | null>(null)
  const [isAssigning, setIsAssigning]               = useState(false)
  const [assignSuccess, setAssignSuccess]           = useState(false)

  // Custom plan state
  const [customDuration, setCustomDuration]       = useState<number>(7)
  const [customPlanName, setCustomPlanName]       = useState('')
  const [customDays, setCustomDays]               = useState<MealDayPlan[]>(() => DAYS.map((dayName, dayIndex) => ({ dayIndex, dayName, meals: [emptyMeal()] })))
  const [customActiveDay, setCustomActiveDay]     = useState(0)
  const [showCustomCopyFrom, setShowCustomCopyFrom] = useState(false)
  const [showCustomCopyTo, setShowCustomCopyTo]     = useState(false)
  const [isSavingCustom, setIsSavingCustom]       = useState(false)

  // Edit existing plan state
  const [editDuration, setEditDuration]           = useState(7)
  const [editDays, setEditDays]                   = useState<MealDayPlan[]>([])
  const [editActiveDay, setEditActiveDay]         = useState(0)
  const [showEditCopyFrom, setShowEditCopyFrom]   = useState(false)
  const [showEditCopyTo, setShowEditCopyTo]       = useState(false)
  const [isSavingEdit, setIsSavingEdit]           = useState(false)
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false)
  const [isDeletingPlan, setIsDeletingPlan]           = useState(false)

  // Wellness fields for custom plan
  const [customWakeUpTime, setCustomWakeUpTime]       = useState('06:00')
  const [customSleepTime, setCustomSleepTime]         = useState('22:00')
  const [customWaterIntakeMl, setCustomWaterIntakeMl] = useState(2000)

  // Wellness tab state
  const [wellnessWakeUp, setWellnessWakeUp]     = useState('06:00')
  const [wellnessSleepTime, setWellnessSleepTime] = useState('22:00')
  const [wellnessWaterMl, setWellnessWaterMl]   = useState(2000)
  const [isSavingWellness, setIsSavingWellness] = useState(false)

  const { items: goalItems }       = useSettings('goals')
  const { items: preferenceItems } = useSettings('preferences')
  const { items: allergyItems }    = useSettings('allergies')
  const { items: conditionItems }  = useSettings('conditions')
  const { items: bodyTypeItems }   = useSettings('bodyTypes')

  const GOALS           = goalItems.map((i) => i.name)
  const PREFERENCES     = preferenceItems.map((i) => i.name)
  const ALLERGY_OPTIONS = allergyItems.map((i) => i.name)
  const CONDITIONS      = conditionItems.map((i) => i.name)
  const BODY_TYPES      = bodyTypeItems.length > 0 ? bodyTypeItems.map((i) => i.name) : ['Ectomorph', 'Mesomorph', 'Endomorph']

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'users', id!))
      if (!snap.exists()) throw new Error('User not found')
      return { id: snap.id, ...snap.data() } as UserData
    },
  })

  const { data: activePlan, isLoading: planLoading } = useQuery({
    queryKey: ['activePlan', id],
    queryFn: async () => {
      const q = fsQuery(collection(db, 'users', id!, 'dietPlans'), orderBy('assignedAt', 'desc'))
      const snap = await getDocs(q)
      if (snap.empty) return null
      const d = snap.docs[0]
      return { id: d.id, ...d.data() } as AssignedPlan
    },
    enabled: activeTab === 'dietplan' || activeTab === 'wellness',
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const q = fsQuery(collection(db, 'templates'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Template[]
    },
    enabled: planMode === 'template',
  })

  const todayYMD = new Date().toISOString().slice(0, 10)

  const { data: todayMealLogs = [], isLoading: mealLogsLoading } = useQuery({
    queryKey: ['mealLogs', id, todayYMD],
    queryFn: async () => {
      const q = fsQuery(
        collection(db, 'users', id!, 'mealLogs'),
        where('date', '==', todayYMD),
      )
      const docs = (await getDocs(q)).docs.map(d => d.data()) as MealLog[]
      return docs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
    },
    enabled: !!id && activeTab === 'reports',
  })

  const { data: todayWaterLogs = [], isLoading: waterLogsLoading } = useQuery({
    queryKey: ['waterLogs', id, todayYMD],
    queryFn: async () => {
      const q = fsQuery(
        collection(db, 'users', id!, 'waterLogs'),
        where('date', '==', todayYMD),
      )
      const docs = (await getDocs(q)).docs.map(d => d.data()) as WaterLog[]
      return docs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
    },
    enabled: !!id && activeTab === 'reports',
  })

  // Sync wellness tab inputs whenever the active plan loads or changes
  useEffect(() => {
    if (activePlan) {
      setWellnessWakeUp(activePlan.wakeUpTime ?? '06:00')
      setWellnessSleepTime(activePlan.sleepTime ?? '22:00')
      setWellnessWaterMl(activePlan.waterIntakeMl ?? 2000)
    }
  }, [activePlan])

  function fmt12h(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number)
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      await updateDoc(doc(db, 'users', id!), { ...data, updatedAt: new Date().toISOString() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsEditing(false)
      showToast.profileSaved()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Firestore does not auto-delete subcollections — delete them first
      for (const sub of ['dietPlans', 'mealLogs', 'waterLogs']) {
        const snap = await getDocs(collection(db, 'users', id!, sub))
        for (const d of snap.docs) await deleteDoc(d.ref)
      }
      await deleteDoc(doc(db, 'users', id!))
    },
    onSuccess: () => { showToast.userDeleted(user?.name ?? 'Patient'); queryClient.invalidateQueries({ queryKey: ['users'] }); navigate('/dashboard') },
  })

  const handleEdit   = () => { if (user) { setEditForm({ ...user }); setIsEditing(true) } }
  const handleSave   = () => updateMutation.mutate(editForm)
  const handleCancel = () => { setEditForm({}); setIsEditing(false) }
  const handleDelete = () => { if (deleteConfirmText === user?.name) deleteMutation.mutate() }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text); setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const updateEdit = (field: keyof UserData, value: string | string[] | number) =>
    setEditForm((prev) => ({ ...prev, [field]: value }))

  const toggleEditAllergy = (a: string) => {
    const cur = editForm.allergies ?? user?.allergies ?? []
    updateEdit('allergies', cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a])
  }
  const toggleEditCondition = (c: string) => {
    const cur = editForm.conditions ?? user?.conditions ?? []
    updateEdit('conditions', cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c])
  }

  const selectedPlan = templates.find((t) => t.id === selectedTemplateId)
  const allergenWarnings = selectedPlan && user
    ? (selectedPlan.days ?? []).flatMap((d) => d.meals).flatMap((m) => m.items).filter((item) =>
        user.allergies.some((a) => item.name.toLowerCase().includes(a.toLowerCase())))
    : []

  // Build day array from template — map template.days directly
  const buildDaysFromTemplate = (template: Template): DayPlan[] =>
    (template.days ?? []).map((d) => ({
      day: d.dayIndex + 1, dayName: d.dayName, meals: cloneMeals(d.meals), isOverride: false,
    }))

  const handleAssignTemplate = async () => {
    if (!selectedPlan || !user) return
    setIsAssigning(true)
    try {
      await addDoc(collection(db, 'users', id!, 'dietPlans'), {
        templateId: selectedPlan.id, templateName: selectedPlan.name,
        days: buildDaysFromTemplate(selectedPlan),
        assignedAt: new Date().toISOString(), assignedBy: 'admin', status: 'active',
      })
      await updateDoc(doc(db, 'users', id!), { status: 'active', updatedAt: new Date().toISOString() })
      await queryClient.invalidateQueries({ queryKey: ['user', id] })
      await queryClient.invalidateQueries({ queryKey: ['activePlan', id] })
      setAssignSuccess(true); resetPlanMode()
      showToast.planAssigned()
    } catch (e) { console.error(e); showToast.error('Failed to assign plan') }
    finally { setIsAssigning(false) }
  }

  const handleSaveCustomPlan = async () => {
    if (!customPlanName.trim()) return
    setIsSavingCustom(true)
    try {
      // Fetch macros for all food items before saving
      const enrichedDays = []
      for (const d of customDays) {
        const enrichedMeals = []
        for (const meal of d.meals) {
          const enrichedItems = []
          let mealCals = 0, mealPro = 0, mealCarbs = 0, mealFats = 0
          for (const item of meal.items) {
            if (item.name.trim() && item.calories == null) {
              const macros = await fetchFoodMacros(item.name)
              if (macros) {
                enrichedItems.push({ ...item, ...macros })
                mealCals += macros.calories; mealPro += macros.protein
                mealCarbs += macros.carbs; mealFats += macros.fats
              } else {
                enrichedItems.push(item)
              }
            } else {
              enrichedItems.push(item)
              mealCals += item.calories ?? 0; mealPro += item.protein ?? 0
              mealCarbs += item.carbs ?? 0; mealFats += item.fats ?? 0
            }
          }
          enrichedMeals.push({ ...meal, items: enrichedItems, calories: mealCals, protein: mealPro, carbs: mealCarbs, fats: mealFats })
        }
        enrichedDays.push({ day: d.dayIndex + 1, dayName: d.dayName, meals: enrichedMeals, isOverride: false })
      }

      await addDoc(collection(db, 'users', id!, 'dietPlans'), {
        templateId: null, templateName: customPlanName.trim(),
        days: enrichedDays,
        wakeUpTime: customWakeUpTime,
        sleepTime: customSleepTime,
        waterIntakeMl: customWaterIntakeMl,
        waterSchedule: generateWaterSchedule(customWakeUpTime, customSleepTime, customWaterIntakeMl),
        assignedAt: new Date().toISOString(), assignedBy: 'admin', status: 'active',
      })
      await updateDoc(doc(db, 'users', id!), { status: 'active', updatedAt: new Date().toISOString() })
      await queryClient.invalidateQueries({ queryKey: ['user', id] })
      await queryClient.invalidateQueries({ queryKey: ['activePlan', id] })
      setAssignSuccess(true); resetPlanMode()
      showToast.planAssigned()
    } catch (e) { console.error(e); showToast.error('Failed to save plan') }
    finally { setIsSavingCustom(false) }
  }

  const handleStartEditPlan = () => {
    if (!activePlan) return
    const duration = activePlan.days.length || 7
    const dayNames = duration === 7 ? DAYS : generateDayNames(duration)
    const days: MealDayPlan[] = dayNames.map((dayName, dayIndex) => {
      const existing = activePlan.days.find((d) => d.day === dayIndex + 1)
      return { dayIndex, dayName, meals: cloneMeals(existing?.meals ?? [emptyMeal()]) }
    })
    setEditDuration(duration)
    setEditDays(days)
    setEditActiveDay(0)
    setPlanMode('edit')
  }

  const handleSaveEditPlan = async () => {
    if (!activePlan) return
    setIsSavingEdit(true)
    try {
      await updateDoc(doc(db, 'users', id!, 'dietPlans', activePlan.id), {
        days: editDays.map((d) => ({ day: d.dayIndex + 1, dayName: d.dayName, meals: cloneMeals(d.meals), isOverride: false })),
        duration: editDuration,
        updatedAt: new Date().toISOString(),
      })
      await queryClient.invalidateQueries({ queryKey: ['activePlan', id] })
      setAssignSuccess(true); setPlanMode('idle')
      showToast.planSaved()
    } catch (e) { console.error(e); showToast.error('Failed to save plan') }
    finally { setIsSavingEdit(false) }
  }

  const handleDeletePlan = async () => {
    if (!activePlan) return
    setIsDeletingPlan(true)
    try {
      await deleteDoc(doc(db, 'users', id!, 'dietPlans', activePlan.id))
      await updateDoc(doc(db, 'users', id!), { status: 'no-plan', updatedAt: new Date().toISOString() })
      queryClient.invalidateQueries({ queryKey: ['activePlan', id] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowDeletePlanModal(false)
      showToast.planRemoved()
    } catch (e) { console.error(e); showToast.error('Failed to remove plan') }
    finally { setIsDeletingPlan(false) }
  }

  const resetPlanMode = () => {
    setPlanMode('idle'); setSelectedTemplateId(null)
    setExpandedTemplateId(null); setExpandedDay(null); setViewDay(1)
    setCustomDuration(7); setCustomPlanName(''); setCustomDays(DAYS.map((dayName, dayIndex) => ({ dayIndex, dayName, meals: [emptyMeal()] }))); setCustomActiveDay(0); setShowCustomCopyFrom(false)
    setCustomWakeUpTime('06:00'); setCustomSleepTime('22:00'); setCustomWaterIntakeMl(2000)
    setShowCustomCopyTo(false)
    setEditDuration(7); setEditDays([]); setEditActiveDay(0); setShowEditCopyFrom(false); setShowEditCopyTo(false)
  }

  const handleSaveWellness = async () => {
    if (!activePlan) return
    setIsSavingWellness(true)
    try {
      await updateDoc(doc(db, 'users', id!, 'dietPlans', activePlan.id), {
        wakeUpTime: wellnessWakeUp,
        sleepTime: wellnessSleepTime,
        waterIntakeMl: wellnessWaterMl,
        waterSchedule: generateWaterSchedule(wellnessWakeUp, wellnessSleepTime, wellnessWaterMl),
        updatedAt: new Date().toISOString(),
      })
      await queryClient.invalidateQueries({ queryKey: ['activePlan', id] })
      showToast.success('Wellness settings saved')
    } catch (e) { console.error(e); showToast.error('Failed to save wellness settings') }
    finally { setIsSavingWellness(false) }
  }

  const updateEditDayMeals = (dayIndex: number, meals: Meal[]) =>
    setEditDays((prev) => prev.map((d) => d.dayIndex === dayIndex ? { ...d, meals } : d))

  const updateCustomDayMeals = (dayIndex: number, meals: Meal[]) =>
    setCustomDays((prev) => prev.map((d) => d.dayIndex === dayIndex ? { ...d, meals } : d))

  const handleChangeEditDuration = (newDuration: number) => {
    if (newDuration === editDuration) return
    const dayNames = newDuration === 7 ? DAYS : generateDayNames(newDuration)
    setEditDuration(newDuration)
    setEditDays((prev) => {
      if (newDuration > prev.length) {
        const extra = dayNames.slice(prev.length).map((dayName, i) => ({
          dayIndex: prev.length + i, dayName, meals: [emptyMeal()],
        }))
        return [...prev.map((d, i) => ({ ...d, dayName: dayNames[i] })), ...extra]
      }
      return prev.slice(0, newDuration).map((d, i) => ({ ...d, dayName: dayNames[i] }))
    })
    setEditActiveDay((prev) => Math.min(prev, newDuration - 1))
  }

  const applyEditDayToAll = () => {
    const meals = editDays[editActiveDay]?.meals ?? []
    setEditDays((prev) => prev.map((d) =>
      d.dayIndex === editActiveDay ? d : { ...d, meals: cloneMeals(meals) }
    ))
    showToast.appliedToAll(editDays[editActiveDay]?.dayName ?? '')
  }

  const copyEditDayTo = (toIdx: number) => {
    updateEditDayMeals(toIdx, cloneMeals(editDays[editActiveDay]?.meals ?? []))
    setShowEditCopyTo(false)
    showToast.copiedTo(editDays[toIdx]?.dayName ?? '')
  }

  const copyEditDayFrom = (fromIdx: number) => {
    updateEditDayMeals(editActiveDay, cloneMeals(editDays[fromIdx]?.meals ?? []))
    setShowEditCopyFrom(false)
    showToast.copiedFrom(editDays[fromIdx]?.dayName ?? '')
  }

  const applyCustomDayToAll = () => {
    const meals = customDays[customActiveDay]?.meals ?? []
    setCustomDays((prev) => prev.map((d) =>
      d.dayIndex === customActiveDay ? d : { ...d, meals: cloneMeals(meals) }
    ))
    showToast.appliedToAll(customDays[customActiveDay]?.dayName ?? '')
  }

  const copyCustomDayTo = (toIdx: number) => {
    updateCustomDayMeals(toIdx, cloneMeals(customDays[customActiveDay]?.meals ?? []))
    setShowCustomCopyTo(false)
    showToast.copiedTo(customDays[toIdx]?.dayName ?? '')
  }

  const copyCustomDayFrom = (fromIdx: number) => {
    updateCustomDayMeals(customActiveDay, cloneMeals(customDays[fromIdx]?.meals ?? []))
    setShowCustomCopyFrom(false)
    showToast.copiedFrom(customDays[fromIdx]?.dayName ?? '')
  }

  const copyMealToEditDays = (meal: Meal, dayIndices: number[]) => {
    setEditDays((prev) => prev.map((d) =>
      dayIndices.includes(d.dayIndex) ? { ...d, meals: [...d.meals, { ...meal, id: Math.random().toString(36).slice(2), items: meal.items.map((i) => ({ ...i })) }] } : d
    ))
  }

  const copyMealToCustomDays = (meal: Meal, dayIndices: number[]) => {
    setCustomDays((prev) => prev.map((d) =>
      dayIndices.includes(d.dayIndex) ? { ...d, meals: [...d.meals, { ...meal, id: Math.random().toString(36).slice(2), items: meal.items.map((i) => ({ ...i })) }] } : d
    ))
  }

  const tabStyle = (key: TabKey) => ({
    display: 'flex' as const, alignItems: 'center' as const, gap: '8px',
    padding: '10px 20px', borderRadius: '12px', border: 'none',
    background: activeTab === key ? '#1a73e8' : 'transparent',
    color: activeTab === key ? 'white' : '#8a9bc4',
    fontSize: '13px', fontWeight: '600' as const, cursor: 'pointer',
    transition: 'all 0.15s ease', boxShadow: activeTab === key ? '0 2px 8px rgba(26,115,232,0.3)' : 'none',
  })

  if (isLoading) return (
    <PageWrapper title="Patient Profile">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading patient...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PageWrapper>
  )

  if (!user) return (
    <PageWrapper title="Patient Profile">
      <div className="p-8 sm:p-20" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0d1b3e' }}>Patient not found</div>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '14px', background: '#1a73e8', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Back to Dashboard</button>
      </div>
    </PageWrapper>
  )

  const status = statusConfig[user.status] ?? statusConfig['no-plan']
  const viewDayPlan = activePlan?.days.find((d) => d.day === viewDay)

  return (
    <PageWrapper title="Patient Profile">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="w-[calc(100vw-24px)] sm:w-105 p-5 sm:p-9" style={{ background: 'white', borderRadius: '24px', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fff5f5', border: '2px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={28} color="#e53e3e" /></div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0d1b3e', marginBottom: '8px' }}>Delete Patient</div>
                <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', lineHeight: '1.5' }}>Permanently delete <strong style={{ color: '#0d1b3e' }}>{user.name}</strong>'s profile and all data.</div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>Type <strong>{user.name}</strong> to confirm:</div>
                <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={user.name}
                  style={{ ...inputStyle, boxSizing: 'border-box' as const }}
                  onFocus={(e) => { e.target.style.border = '2px solid #fc8181'; e.target.style.background = '#fff5f5' }}
                  onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleteConfirmText !== user.name || deleteMutation.isPending}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', background: deleteConfirmText === user.name ? 'linear-gradient(135deg, #e53e3e, #c53030)' : '#f0f0f0', border: 'none', color: deleteConfirmText === user.name ? 'white' : '#b0bdd8', fontSize: '14px', fontWeight: '700', cursor: deleteConfirmText === user.name ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Patient'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Plan Modal */}
        {showDeletePlanModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="w-[calc(100vw-24px)] sm:w-100 p-5 sm:p-9" style={{ background: 'white', borderRadius: '24px', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fff5f5', border: '2px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><UtensilsCrossed size={28} color="#e53e3e" /></div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0d1b3e', marginBottom: '8px' }}>Remove Diet Plan?</div>
                <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', lineHeight: '1.5' }}>This will remove <strong style={{ color: '#0d1b3e' }}>{activePlan?.templateName}</strong> from {user.name}'s profile. The patient's status will change to "No Plan".</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowDeletePlanModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDeletePlan} disabled={isDeletingPlan} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #e53e3e, #c53030)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: isDeletingPlan ? 'not-allowed' : 'pointer', opacity: isDeletingPlan ? 0.7 : 1 }}>
                  {isDeletingPlan ? 'Removing...' : 'Remove Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#8a9bc4', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: 'fit-content', padding: '4px 0' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="p-3.5 sm:p-7 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div className="flex flex-wrap items-start gap-2.5 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 sm:gap-5">
            <div className="w-13 h-13 rounded-[16px] text-xl sm:w-18 sm:h-18 sm:rounded-[22px] sm:text-[28px] shrink-0" style={{ background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', boxShadow: '0 4px 16px rgba(26,115,232,0.3)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-[17px] sm:text-[22px]" style={{ fontWeight: '800', color: '#0d1b3e', letterSpacing: '-0.5px', marginBottom: '6px' }}>{user.name}</div>
              <div className="flex items-center gap-1 sm:gap-2.5 flex-wrap">
                <span style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>{user.userId}</span>
                <span style={{ color: '#e2e8f0' }}>·</span>
                <span style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>{user.age} yrs · {user.gender}</span>
                <span style={{ color: '#e2e8f0' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '40px', background: status.bg, border: `1px solid ${status.border}`, fontSize: '12px', fontWeight: '600', color: status.text }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: status.dot }} />{status.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button onClick={() => setShowDeleteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              <Trash2 size={15} /> Delete
            </button>
            {activeTab === 'profile' && (
              isEditing ? (
                <>
                  <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    <X size={15} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={updateMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 3px 12px rgba(26,115,232,0.3)' }}>
                    <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 3px 12px rgba(26,115,232,0.3)' }}>
                  <Edit2 size={15} /> Edit Profile
                </button>
              )
            )}
          </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto [-webkit-overflow-scrolling:touch] flex-nowrap p-1.5 sm:p-2 max-sm:[&_button]:!whitespace-nowrap max-sm:[&_button]:!shrink-0 max-sm:[&_button]:![padding:8px_10px] max-sm:[&_button]:![font-size:11px] max-sm:[&_button]:!rounded-[10px] max-sm:[&_button]:![gap:5px] max-[400px]:[&_button]:![font-size:10px] max-[400px]:[&_button]:![padding:7px_8px] max-[400px]:[&_button]:![gap:4px]" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e8eef8', boxShadow: '0 2px 8px rgba(26,115,232,0.04)' }}>
          {([
            { key: 'profile' as TabKey,     label: 'Profile Info',  icon: <User size={14} /> },
            { key: 'dietplan' as TabKey,    label: 'Diet Plan',     icon: <UtensilsCrossed size={14} /> },
            { key: 'wellness' as TabKey,    label: 'Wellness',      icon: <Droplets size={14} /> },
            { key: 'reports' as TabKey,     label: 'Reports',       icon: <Activity size={14} /> },
            { key: 'credentials' as TabKey, label: 'Credentials',   icon: <KeyRound size={14} /> },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'dietplan') resetPlanMode(); if (tab.key !== 'profile') handleCancel() }} style={tabStyle(tab.key)}>{tab.icon} {tab.label}</button>
          ))}
        </div>

        {/* ═══════ PROFILE TAB ═══════ */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={cardClass} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={17} color="#1a73e8" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Personal Information</div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Full Name</div>
                  {isEditing ? <input style={inputStyle} value={editForm.name ?? ''} onChange={(e) => updateEdit('name', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={valueStyle}>{user.name}</div>}
                </div>
                <div><div style={labelStyle}>Age</div>{isEditing ? <input type="number" style={inputStyle} value={editForm.age ?? ''} onChange={(e) => updateEdit('age', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={valueStyle}>{user.age} years</div>}</div>
                <div><div style={labelStyle}>Phone</div>{isEditing ? <input style={inputStyle} value={editForm.phone ?? ''} onChange={(e) => updateEdit('phone', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="#8a9bc4" /> {user.phone || '—'}</div>}</div>
                <div><div style={labelStyle}>Gender</div>{isEditing ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{GENDERS.map((g) => <button key={g} type="button" onClick={() => updateEdit('gender', g)} style={chipStyle((editForm.gender ?? user.gender) === g)}>{g}</button>)}</div> : <div style={valueStyle}>{user.gender}</div>}</div>
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚖️</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Body Metrics</div>
              </div>
              <div className="grid grid-cols-1 min-[401px]:grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-5">
                <div><div style={labelStyle}>Weight (kg)</div>{isEditing ? <input type="number" style={inputStyle} value={editForm.weight ?? ''} onChange={(e) => updateEdit('weight', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={valueStyle}>{user.weight} kg</div>}</div>
                <div><div style={labelStyle}>Height (cm)</div>{isEditing ? <input type="number" style={inputStyle} value={editForm.height ?? ''} onChange={(e) => updateEdit('height', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={valueStyle}>{user.height} cm</div>}</div>
                <div><div style={labelStyle}>BMI</div><div style={{ fontSize: '22px', fontWeight: '800', color: '#1a73e8' }}>{user.bmi}</div></div>
                <div><div style={labelStyle}>BMI Category</div><span style={{ padding: '5px 12px', borderRadius: '40px', fontSize: '13px', fontWeight: '700', background: user.bmiCategory === 'Normal' ? '#f0fdf4' : user.bmiCategory === 'Underweight' ? '#fffbeb' : user.bmiCategory === 'Overweight' ? '#fff7ed' : '#fff5f5', color: user.bmiCategory === 'Normal' ? '#15803d' : user.bmiCategory === 'Underweight' ? '#b45309' : user.bmiCategory === 'Overweight' ? '#c2410c' : '#c53030', border: `1px solid ${user.bmiCategory === 'Normal' ? '#bbf7d0' : user.bmiCategory === 'Underweight' ? '#fde68a' : user.bmiCategory === 'Overweight' ? '#fed7aa' : '#fed7d7'}` }}>{user.bmiCategory}</span></div>
                <div style={{ gridColumn: '1 / -1' }}><div style={labelStyle}>Body Type</div>{isEditing ? <div style={{ display: 'flex', gap: '8px' }}>{BODY_TYPES.map((bt) => <button key={bt} type="button" onClick={() => updateEdit('bodyType', bt)} style={chipStyle((editForm.bodyType ?? user.bodyType) === bt)}>{bt}</button>)}</div> : <div style={valueStyle}>{user.bodyType}</div>}</div>
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Salad size={17} color="#ca8a04" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Diet Information</div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                <div><div style={labelStyle}>Goal</div>{isEditing ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{GOALS.map((g) => <button key={g} type="button" onClick={() => updateEdit('goal', g)} style={chipStyle((editForm.goal ?? user.goal) === g)}>{g}</button>)}</div> : <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} color="#8a9bc4" /> {user.goal}</div>}</div>
                <div><div style={labelStyle}>Food Preference</div>{isEditing ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{PREFERENCES.map((p) => <button key={p} type="button" onClick={() => updateEdit('preference', p)} style={chipStyle((editForm.preference ?? user.preference) === p)}>{p}</button>)}</div> : <div style={valueStyle}>{user.preference}</div>}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Allergies</div>
                  {isEditing ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{ALLERGY_OPTIONS.map((a) => <button key={a} type="button" onClick={() => toggleEditAllergy(a)} style={{ ...chipStyle((editForm.allergies ?? user.allergies ?? []).includes(a)), ...((editForm.allergies ?? user.allergies ?? []).includes(a) ? { background: '#fff5f5', border: '2px solid #fc8181', color: '#c53030' } : {}) }}>{a}</button>)}</div>
                  : <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{(!user.allergies || user.allergies.length === 0) ? <span style={{ color: '#b0bdd8', fontSize: '14px', fontWeight: '500' }}>None</span> : user.allergies.map((a) => <span key={a} style={{ padding: '5px 12px', borderRadius: '40px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', fontSize: '13px', fontWeight: '600' }}>{a}</span>)}</div>}
                </div>
              </div>
            </div>

            <div className={cardClass} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={17} color="#16a34a" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Body Composition</div>
              </div>
              {([
                { key: 'bodyFatPercent',   label: 'Body Fat',      unit: '%',        placeholder: 'e.g. 22.5' },
                { key: 'muscleMass',       label: 'Muscle Mass',   unit: 'kg',       placeholder: 'e.g. 34.2' },
                { key: 'boneMass',         label: 'Bone Mass',     unit: 'kg',       placeholder: 'e.g. 2.8'  },
                { key: 'bodyWaterPercent', label: 'Body Water',    unit: '%',        placeholder: 'e.g. 55.0' },
                { key: 'visceralFat',      label: 'Visceral Fat',  unit: 'level',    placeholder: 'e.g. 8'    },
                { key: 'bmr',              label: 'BMR',           unit: 'kcal/day', placeholder: 'e.g. 1680' },
                { key: 'metabolicAge',     label: 'Metabolic Age', unit: 'yrs',      placeholder: 'e.g. 30'   },
              ] as { key: keyof UserData; label: string; unit: string; placeholder: string }[]).some(
                (f) => user[f.key] != null
              ) || isEditing ? (
                <div className="grid grid-cols-1 min-[401px]:grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-5">
                  {([
                    { key: 'bodyFatPercent',   label: 'Body Fat',      unit: '%',        placeholder: 'e.g. 22.5', step: '0.1' },
                    { key: 'muscleMass',       label: 'Muscle Mass',   unit: 'kg',       placeholder: 'e.g. 34.2', step: '0.1' },
                    { key: 'boneMass',         label: 'Bone Mass',     unit: 'kg',       placeholder: 'e.g. 2.8',  step: '0.1' },
                    { key: 'bodyWaterPercent', label: 'Body Water',    unit: '%',        placeholder: 'e.g. 55.0', step: '0.1' },
                    { key: 'visceralFat',      label: 'Visceral Fat',  unit: 'level',    placeholder: 'e.g. 8',    step: '1'   },
                    { key: 'bmr',              label: 'BMR',           unit: 'kcal/day', placeholder: 'e.g. 1680', step: '1'   },
                    { key: 'metabolicAge',     label: 'Metabolic Age', unit: 'yrs',      placeholder: 'e.g. 30',   step: '1'   },
                  ] as { key: keyof UserData; label: string; unit: string; placeholder: string; step: string }[]).map((f) => (
                    <div key={f.key}>
                      <div style={labelStyle}>{f.label}</div>
                      {isEditing ? (
                        <input type="number" step={f.step} style={inputStyle}
                          value={editForm[f.key] != null ? String(editForm[f.key]) : user[f.key] != null ? String(user[f.key]) : ''}
                          placeholder={f.placeholder}
                          onChange={(e) => updateEdit(f.key, e.target.value === '' ? '' : parseFloat(e.target.value) as any)}
                          onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                          onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                        />
                      ) : (
                        <div style={valueStyle}>{user[f.key] != null ? `${user[f.key]} ${f.unit}` : '—'}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#b0bdd8', fontSize: '13px', fontWeight: '500' }}>
                  No body composition data recorded. Click <strong>Edit Profile</strong> to add.
                </div>
              )}
            </div>

            <div className={cardClass} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={17} color="#e53e3e" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Health Information</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div><div style={labelStyle}>Medical Conditions</div>{isEditing ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{CONDITIONS.map((c) => <button key={c} type="button" onClick={() => toggleEditCondition(c)} style={chipStyle((editForm.conditions ?? user.conditions ?? []).includes(c))}>{c}</button>)}</div> : <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>{(!user.conditions || user.conditions.length === 0) ? <span style={{ color: '#b0bdd8', fontSize: '14px', fontWeight: '500' }}>None</span> : user.conditions.map((c) => <span key={c} style={{ padding: '5px 12px', borderRadius: '40px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '600' }}>{c}</span>)}</div>}</div>
                <div><div style={labelStyle}>Medications</div>{isEditing ? <input style={inputStyle} value={editForm.medications ?? ''} onChange={(e) => updateEdit('medications', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Pill size={14} color="#8a9bc4" /> {user.medications || '—'}</div>}</div>
                <div><div style={labelStyle}>Additional Notes</div>{isEditing ? <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }} value={editForm.notes ?? ''} onChange={(e) => updateEdit('notes', e.target.value)} onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }} onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }} /> : <div style={{ ...valueStyle, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><FileText size={14} color="#8a9bc4" style={{ marginTop: '2px', flexShrink: 0 }} />{user.notes || '—'}</div>}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ DIET PLAN TAB ═══════ */}
        {activeTab === 'dietplan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {assignSuccess && (
              <div style={{ padding: '16px 20px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={18} color="white" /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d' }}>Plan Saved!</div><div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '500' }}>The patient's plan is now active.</div></div>
                <button onClick={() => setAssignSuccess(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86efac' }}><X size={16} /></button>
              </div>
            )}

            {/* ── IDLE: view current plan or assign ── */}
            {planMode === 'idle' && (
              <div className={cardClass} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UtensilsCrossed size={17} color="#ca8a04" /></div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>{activePlan ? activePlan.templateName : 'Diet Plan'}</div>
                      {activePlan && <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>Assigned {new Date(activePlan.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    </div>
                  </div>
                  {activePlan && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setShowDeletePlanModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        <Trash2 size={14} /> Remove
                      </button>
                      <button onClick={handleStartEditPlan}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        <Edit2 size={14} /> Edit Plan
                      </button>
                    </div>
                  )}
                </div>

                {planLoading ? (
                  <div className="p-5 sm:p-10" style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : !activePlan ? (
                  <div className="px-5 py-8 sm:px-10 sm:py-12" style={{ textAlign: 'center' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><UtensilsCrossed size={30} color="#d0d8f0" /></div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No Diet Plan Assigned</div>
                    <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '28px' }}>Assign a plan to help {user.name} reach their goal</div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
                      <button onClick={() => setPlanMode('template')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '14px', background: '#eef3ff', border: '2px solid #dbe8ff', color: '#1a73e8', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                        <BookOpen size={16} /> Use a Template
                      </button>
                      <button onClick={() => setPlanMode('pick-custom-duration')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
                        <Plus size={16} /> Create Custom Plan
                      </button>
                    </div>
                  </div>
                ) : (
                  // ── VIEW active plan ──
                  <div>
                    {/* Day selector */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' as const, marginBottom: '16px', paddingBottom: '4px' }}>
                      {activePlan.days.map((d: DayPlan) => (
                        <button key={d.day} onClick={() => setViewDay(d.day)}
                          style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '40px', border: viewDay === d.day ? '2px solid #1a73e8' : '1.5px solid #e8eef8', background: viewDay === d.day ? '#eef3ff' : 'white', color: viewDay === d.day ? '#1a73e8' : '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {d.dayName.slice(0, 3)}
                          {d.isOverride && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>

                    {/* Meals for selected day */}
                    {viewDayPlan && (
                      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
                        {viewDayPlan.meals.map((meal: Meal, idx: number) => (
                          <div key={meal.id ?? idx} style={{ background: '#f8fafd', borderRadius: '16px', padding: '16px', border: '1px solid #e8eef8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>{meal.name || `Meal ${idx + 1}`}</div>
                              <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {formatTime12h(meal.time)}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                              {meal.items.filter((i) => i.name).map((item, i: number) => (
                                <div key={i} style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />{item.name}
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                              {([{ label: 'Cal', value: meal.calories, color: '#c2410c', bg: '#fff7ed' }, { label: 'Pro', value: meal.protein, color: '#1d4ed8', bg: '#eff6ff' }, { label: 'Carb', value: meal.carbs, color: '#15803d', bg: '#f0fdf4' }, { label: 'Fat', value: meal.fats, color: '#7c3aed', bg: '#f5f3ff' }] as { label: string; value: number; color: string; bg: string }[]).map((m) => (
                                <div key={m.label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: '8px', background: m.bg }}>
                                  <div style={{ fontSize: '10px', fontWeight: '700', color: m.color }}>{m.label}</div>
                                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0d1b3e' }}>{m.value != null && m.value > 0 ? m.value : '—'}</div>
                                </div>
                              ))}
                            </div>
                            {meal.notes && <div style={{ marginTop: '10px', fontSize: '11px', color: '#8a9bc4', fontStyle: 'italic', lineHeight: 1.4 }}>📝 {meal.notes}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f4ff', display: 'flex', gap: '10px' }}>
                      <button onClick={() => setPlanMode('template')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        <BookOpen size={14} /> Replace with Template
                      </button>
                      <button onClick={() => setPlanMode('pick-custom-duration')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        <Plus size={14} /> New Custom Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── EDIT existing plan ── */}
            {planMode === 'edit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Edit: {activePlan?.templateName}</div>
                    <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>Edit any day's meals directly</div>
                  </div>
                  <button onClick={resetPlanMode} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#f8fafd', border: '1.5px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <X size={13} /> Cancel
                  </button>
                </div>

                {/* Duration picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#8a9bc4' }}>Duration:</span>
                  {[7, 15, 30].map((d) => (
                    <button key={d} onClick={() => handleChangeEditDuration(d)}
                      style={{ padding: '6px 14px', borderRadius: '40px', border: editDuration === d ? '2px solid #1a73e8' : '2px solid #e8eef8', background: editDuration === d ? '#eef3ff' : '#f8fafd', color: editDuration === d ? '#1a73e8' : '#8a9bc4', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {d === 7 ? 'Weekly (7)' : `${d} Days`}
                    </button>
                  ))}
                </div>

                {/* Day tabs */}
                <div className="flex gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded-[16px] overflow-x-auto max-sm:[&_button]:![padding:8px_3px] max-sm:[&_button]:![font-size:10px] max-sm:[&_button]:!rounded-lg" style={{ background: 'white', border: '1px solid #e8eef8' }}>
                  {editDays.map((d, idx) => {
                    const isActive = editActiveDay === idx
                    const mealCount = d.meals.length
                    return (
                      <button key={`${d.dayName}-${idx}`} onClick={() => { setEditActiveDay(idx); setShowEditCopyFrom(false); setShowEditCopyTo(false) }}
                        style={{ flex: editDuration <= 7 ? 1 : undefined, minWidth: editDuration > 7 ? '52px' : undefined, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', padding: '10px 4px', borderRadius: '12px', border: 'none', background: isActive ? '#1a73e8' : 'transparent', color: isActive ? 'white' : '#8a9bc4', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                        <span>{editDuration <= 7 ? d.dayName.slice(0, 3) : String(idx + 1)}</span>
                        <span style={{ fontSize: '10px', fontWeight: '600', opacity: 0.75 }}>{mealCount}m</span>
                      </button>
                    )
                  })}
                </div>

                {/* Actions bar */}
                <div className="flex flex-col items-start gap-2 p-2.5 sm:p-3 sm:px-4 sm:flex-row sm:items-center sm:justify-between rounded-[14px] max-sm:[&>div:last-child]:!w-full max-sm:[&>div:last-child]:!justify-end" style={{ background: 'white', border: '1px solid #e8eef8' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>
                    {editDays[editActiveDay]?.dayName}
                    <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginLeft: '8px' }}>
                      {editDays[editActiveDay]?.meals.length ?? 0} meal{(editDays[editActiveDay]?.meals.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={applyEditDayToAll}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                      <Copy size={12} /> Apply to all days
                    </button>
                    <div style={{ position: 'relative' as const }}>
                      <button onClick={() => { setShowEditCopyFrom(!showEditCopyFrom); setShowEditCopyTo(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                        Copy from <ChevronDown size={12} />
                      </button>
                      {showEditCopyFrom && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'white', border: '1px solid #e8eef8', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column' as const, gap: '2px', zIndex: 20, boxShadow: '0 8px 24px rgba(26,115,232,0.12)', minWidth: '150px', maxHeight: '220px', overflowY: 'auto' as const }}>
                          {editDays.map((d, idx) => idx !== editActiveDay && (
                            <button key={`${d.dayName}-${idx}`} onClick={() => copyEditDayFrom(idx)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#0d1b3e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                              <span>{d.dayName}</span>
                              <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>{d.meals.length}m</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ position: 'relative' as const }}>
                      <button onClick={() => { setShowEditCopyTo(!showEditCopyTo); setShowEditCopyFrom(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                        Copy to <ChevronDown size={12} />
                      </button>
                      {showEditCopyTo && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'white', border: '1px solid #e8eef8', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column' as const, gap: '2px', zIndex: 20, boxShadow: '0 8px 24px rgba(26,115,232,0.12)', minWidth: '150px', maxHeight: '220px', overflowY: 'auto' as const }}>
                          {editDays.map((d, idx) => idx !== editActiveDay && (
                            <button key={`${d.dayName}-${idx}`} onClick={() => copyEditDayTo(idx)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#0d1b3e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                              <span>{d.dayName}</span>
                              <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>{d.meals.length}m</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={cardClass} style={cardStyle}>
                  <MealBuilder
                    key={editActiveDay}
                    meals={editDays[editActiveDay]?.meals ?? []}
                    onChange={(meals) => updateEditDayMeals(editActiveDay, meals)}
                    dayNames={editDays.map((d) => d.dayName)}
                    currentDayIndex={editActiveDay}
                    onCopyMealToDays={copyMealToEditDays}
                  />
                </div>

                <div className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4.5 sm:px-6 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
                  <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>
                    {editDuration} days · {editDays.reduce((s, d) => s + d.meals.length, 0)} total meals
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={resetPlanMode} style={{ padding: '11px 20px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSaveEditPlan} disabled={isSavingEdit}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
                      {isSavingEdit ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Changes</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TEMPLATE MODE ── */}
            {planMode === 'template' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Choose a Template</div>
                    <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>Select a saved template to assign to {user.name}</div>
                  </div>
                  <button onClick={resetPlanMode} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#f8fafd', border: '1.5px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <X size={13} /> Cancel
                  </button>
                </div>

                {user.allergies.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7' }}>
                    <AlertTriangle size={14} color="#e53e3e" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#c53030' }}>Patient allergies: {user.allergies.join(', ')}</span>
                  </div>
                )}

                {templates.length === 0 ? (
                  <div className="p-5 sm:p-12" style={{ ...cardStyle, textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No templates saved yet</div>
                    <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '20px' }}>Create templates from the Templates page, or build a custom plan instead.</div>
                    <button onClick={() => setPlanMode('pick-custom-duration')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)' }}>
                      <Plus size={16} /> Create Custom Plan Instead
                    </button>
                  </div>
                ) : templates.map((template) => {
                  const isSelected = selectedTemplateId === template.id
                  const isExpanded = expandedTemplateId === template.id
                  const gc = goalColors[template.targetGoal] ?? goalColors['General Health']
                  const templateDays = template.days ?? []
                  const mealsPerDay = templateDays[0]?.meals?.length ?? 0
                  const totalCals = templateDays[0]?.meals?.reduce((s: number, m: Meal) => s + (m.calories ?? 0), 0) ?? 0
                  const days = buildDaysFromTemplate(template)

                  return (
                    <div key={template.id} style={{ background: 'white', borderRadius: '18px', border: isSelected ? '2px solid #1a73e8' : '1px solid #e8eef8', overflow: 'hidden', boxShadow: isSelected ? '0 4px 20px rgba(26,115,232,0.12)' : '0 2px 8px rgba(26,115,232,0.04)', transition: 'all 0.15s', position: 'relative' as const }}>
                      {template.targetGoal === user.goal && (
                        <div style={{ position: 'absolute', top: '-1px', right: '16px', padding: '3px 10px', borderRadius: '0 0 10px 10px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', color: 'white', fontSize: '10px', fontWeight: '700' }}>✨ RECOMMENDED</div>
                      )}
                      <div onClick={() => setSelectedTemplateId(isSelected ? null : template.id)} style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: isSelected ? '2px solid #1a73e8' : '2px solid #e8eef8', background: isSelected ? '#1a73e8' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {isSelected && <Check size={12} color="white" />}
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: gc.bg, border: `1px solid ${gc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen size={19} color={gc.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>{template.name}</div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '40px', background: gc.bg, border: `1px solid ${gc.border}`, fontSize: '11px', fontWeight: '700', color: gc.color }}>{template.targetGoal}</span>
                            <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>{mealsPerDay} meals/day</span>
                            {totalCals > 0 && <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Flame size={11} /> {totalCals} kcal/day</span>}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setExpandedTemplateId(isExpanded ? null : template.id); setExpandedDay(null) }}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{isExpanded ? 'Hide' : 'Preview'}
                        </button>
                      </div>

                      {isSelected && allergenWarnings.length > 0 && (
                        <div style={{ margin: '0 20px 14px', padding: '10px 14px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={15} color="#e53e3e" />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#c53030' }}>⚠️ May contain allergens: {user.allergies.join(', ')}</span>
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #f0f4ff', background: '#fafcff' }}>
                          <div style={{ padding: '14px 20px', display: 'flex', gap: '6px', overflowX: 'auto' as const }}>
                            {days.map((day: DayPlan) => (
                              <button key={day.day} onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                                style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '40px', border: expandedDay === day.day ? '2px solid #1a73e8' : '1.5px solid #e8eef8', background: expandedDay === day.day ? '#eef3ff' : 'white', color: expandedDay === day.day ? '#1a73e8' : '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {day.dayName.slice(0, 3)}
                                {day.isOverride && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b' }} />}
                              </button>
                            ))}
                          </div>
                          {expandedDay !== null && (() => {
                            const day = days.find((d: DayPlan) => d.day === expandedDay)
                            if (!day) return null
                            return (
                              <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                {day.meals.map((meal: Meal, idx: number) => (
                                  <div key={meal.id ?? idx} style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #e8eef8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{meal.name || `Meal ${idx + 1}`}</div>
                                      <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {formatTime12h(meal.time)}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
                                      {meal.items.filter((i) => i.name).map((item, i: number) => (
                                        <div key={i} style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />{item.name}
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                                      {([{ label: 'Cal', value: meal.calories, color: '#c2410c' }, { label: 'Pro', value: meal.protein, color: '#1d4ed8' }, { label: 'Carb', value: meal.carbs, color: '#15803d' }, { label: 'Fat', value: meal.fats, color: '#7c3aed' }] as { label: string; value: number; color: string }[]).map((m) => (
                                        <div key={m.label} style={{ textAlign: 'center', padding: '4px', borderRadius: '6px', background: '#f8fafd' }}>
                                          <div style={{ fontSize: '10px', fontWeight: '700', color: m.color }}>{m.label}</div>
                                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0d1b3e' }}>{m.value != null && m.value > 0 ? m.value : '—'}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}

                {templates.length > 0 && (
                  <div className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4.5 sm:px-6 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
                    <div style={{ fontSize: '14px', color: selectedTemplateId ? '#0d1b3e' : '#b0bdd8', fontWeight: selectedTemplateId ? '700' : '500' }}>
                      {selectedTemplateId ? <>Selected: <span style={{ color: '#1a73e8' }}>{templates.find((t) => t.id === selectedTemplateId)?.name}</span></> : 'No template selected'}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={resetPlanMode} style={{ padding: '11px 20px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleAssignTemplate} disabled={!selectedTemplateId || isAssigning}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', background: !selectedTemplateId ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !selectedTemplateId ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !selectedTemplateId ? 'not-allowed' : 'pointer', boxShadow: !selectedTemplateId ? 'none' : '0 4px 16px rgba(26,115,232,0.35)', transition: 'all 0.2s' }}>
                        {isAssigning ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Assigning...</> : <><UtensilsCrossed size={15} /> Assign Template</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PICK CUSTOM DURATION ── */}
            {planMode === 'pick-custom-duration' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="text-[13px] sm:text-[15px]" style={{ fontWeight: '700', color: '#0d1b3e' }}>Select Plan Duration</div>
                    <div className="text-[11px] sm:text-[13px]" style={{ color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>Choose how long this diet plan will be</div>
                  </div>
                  <button onClick={resetPlanMode} className="text-[11px] sm:text-[13px]" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#f8fafd', border: '1.5px solid #e8eef8', color: '#4a5568', fontWeight: '600', cursor: 'pointer' }}>
                    <X size={13} /> Cancel
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { value: 7, label: 'Weekly', subtitle: '7-day plan', color: '#1a73e8', bg: '#eef3ff', border: '#dbe8ff' },
                    { value: 15, label: '15 Days', subtitle: '15-day plan', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
                    { value: 30, label: 'Monthly', subtitle: '30-day plan', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
                  ].map((opt) => (
                    <button key={opt.value} onClick={() => setCustomDuration(opt.value)}
                      className="gap-3 p-3.5 sm:gap-4 sm:p-[18px] sm:px-[22px] rounded-[14px] sm:rounded-[16px]"
                      style={{
                        display: 'flex', alignItems: 'center',
                        background: 'white',
                        border: customDuration === opt.value ? `2px solid ${opt.color}` : '1.5px solid #e8eef8',
                        boxShadow: customDuration === opt.value ? `0 4px 20px ${opt.color}20` : '0 2px 8px rgba(26,115,232,0.04)',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const,
                      }}>
                      <div className="w-10 h-10 rounded-[12px] sm:w-12 sm:h-12 sm:rounded-[14px] text-sm sm:text-base" style={{ background: opt.bg, border: `1px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: opt.color, flexShrink: 0 }}>
                        {opt.value}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="text-[13px] sm:text-[15px]" style={{ fontWeight: '700', color: '#0d1b3e', marginBottom: '2px' }}>{opt.label}</div>
                        <div className="text-[10px] sm:text-xs" style={{ color: '#8a9bc4', fontWeight: '500' }}>{opt.subtitle}</div>
                      </div>
                      <div className="w-[18px] h-[18px] sm:w-5 sm:h-5" style={{ borderRadius: '50%', border: customDuration === opt.value ? `2px solid ${opt.color}` : '2px solid #e8eef8', background: customDuration === opt.value ? opt.color : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {customDuration === opt.value && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const dayNames = generateDayNames(customDuration)
                    setCustomDays(dayNames.map((dayName, dayIndex) => ({ dayIndex, dayName, meals: [emptyMeal()] })))
                    setCustomActiveDay(0)
                    setPlanMode('custom-wellness')
                  }}
                  style={{ padding: '13px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
                  Continue
                </button>
              </div>
            )}

            {/* ── CUSTOM WELLNESS STEP ── */}
            {planMode === 'custom-wellness' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Plan Details</div>
                    <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>
                      {customDuration}-day plan · Set name & wellness schedule
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setPlanMode('pick-custom-duration')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '12px', background: '#f8fafd', border: '1.5px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      ← Back
                    </button>
                    <button onClick={resetPlanMode} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '12px', background: '#f8fafd', border: '1.5px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>

                {/* Plan Name */}
                <div className={cardClass} style={cardStyle}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>Plan Name *</label>
                  <input value={customPlanName} onChange={(e) => setCustomPlanName(e.target.value)}
                    placeholder={`e.g. ${user.name}'s ${user.goal} Plan`}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e8eef8', background: '#f8fafd', fontSize: '15px', fontWeight: '600', color: '#0d1b3e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                    onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                    onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                  />
                </div>

                {/* Wellness settings */}
                <div className={cardClass} style={cardStyle}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '14px', display: 'block' }}>Wellness Schedule</label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Wake Up Time</label>
                      <input type="time" value={customWakeUpTime} onChange={(e) => setCustomWakeUpTime(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                        onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Sleep Time</label>
                      <input type="time" value={customSleepTime} onChange={(e) => setCustomSleepTime(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                        onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Daily Water Target (litres)</label>
                    <input type="number" step="0.1" min="0" max="10"
                      value={customWaterIntakeMl / 1000}
                      onChange={(e) => setCustomWaterIntakeMl(Math.round(parseFloat(e.target.value || '0') * 1000))}
                      placeholder="e.g. 2.0"
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  </div>
                  {/* Live schedule preview — visible as soon as wake/sleep are valid */}
                  {(() => {
                    const [wh, wm] = customWakeUpTime.split(':').map(Number)
                    const [sh, sm] = customSleepTime.split(':').map(Number)
                    if (isNaN(wh) || isNaN(sh)) return null
                    const wakeMin = wh * 60 + (wm || 0)
                    const sleepMin = sh * 60 + (sm || 0)
                    if (sleepMin <= wakeMin) return null
                    const slotCount = Math.floor((sleepMin - wakeMin) / 60)
                    if (slotCount === 0) return null
                    const mlPerSlot = customWaterIntakeMl > 0 ? Math.round(customWaterIntakeMl / slotCount) : null
                    return (
                      <div style={{ padding: '14px', borderRadius: '12px', background: '#eef8ff', border: '1px solid #bee3f8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                          <Droplets size={13} color="#1a73e8" />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a73e8', textTransform: 'uppercase' as const, letterSpacing: '0.6px' }}>Schedule Preview</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bc4', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' }}>Wake Up</div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1a73e8' }}>{formatTime12h(customWakeUpTime)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bc4', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' }}>Sleep</div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#7c3aed' }}>{formatTime12h(customSleepTime)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bc4', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' }}>Reminders</div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0d1b3e' }}>{slotCount}×</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bc4', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' }}>Per Slot</div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: mlPerSlot ? '#10b981' : '#d0d8f0' }}>{mlPerSlot ? `${mlPerSlot}ml` : '—'}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <button
                  disabled={!customPlanName.trim()}
                  onClick={() => setPlanMode('custom')}
                  style={{ padding: '13px', borderRadius: '14px', background: !customPlanName.trim() ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !customPlanName.trim() ? '#b0bdd8' : 'white', fontWeight: '700', cursor: !customPlanName.trim() ? 'not-allowed' : 'pointer', boxShadow: !customPlanName.trim() ? 'none' : '0 4px 16px rgba(26,115,232,0.35)' }}>
                  Continue to Meal Builder →
                </button>
              </div>
            )}

            {/* ── CUSTOM PLAN MODE ── */}
            {planMode === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Create Custom Plan</div>
                    <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>Build a plan specifically for {user.name}</div>
                  </div>
                  <button onClick={resetPlanMode} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#f8fafd', border: '1.5px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <X size={13} /> Cancel
                  </button>
                </div>

                {/* Day tabs */}
                <div className="flex gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded-[16px] max-sm:[&_button]:![padding:8px_3px] max-sm:[&_button]:![font-size:10px] max-sm:[&_button]:!rounded-lg" style={{ background: 'white', border: '1px solid #e8eef8', overflowX: 'auto' }}>
                  {customDays.map((day, idx) => {
                    const isActive = customActiveDay === idx
                    const mealCount = day.meals.length
                    return (
                      <button key={idx} onClick={() => { setCustomActiveDay(idx); setShowCustomCopyFrom(false) }}
                        style={{ flexShrink: 0, minWidth: customDuration > 7 ? '48px' : undefined, flex: customDuration <= 7 ? 1 : undefined, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', padding: '10px 4px', borderRadius: '12px', border: 'none', background: isActive ? '#1a73e8' : 'transparent', color: isActive ? 'white' : '#8a9bc4', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span>{day.dayName.length > 5 ? day.dayName.replace('Day ', 'D') : day.dayName.slice(0, 3)}</span>
                        <span style={{ fontSize: '10px', fontWeight: '600', opacity: 0.75 }}>{mealCount}m</span>
                      </button>
                    )
                  })}
                </div>

                {/* Actions bar */}
                <div className="flex flex-col items-start gap-2 p-2.5 sm:p-3 sm:px-4 sm:flex-row sm:items-center sm:justify-between rounded-[14px] max-sm:[&>div:last-child]:!w-full max-sm:[&>div:last-child]:!justify-end" style={{ background: 'white', border: '1px solid #e8eef8' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>
                    {customDays[customActiveDay]?.dayName ?? ''}
                    <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginLeft: '8px' }}>
                      {customDays[customActiveDay]?.meals.length ?? 0} meal{(customDays[customActiveDay]?.meals.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={applyCustomDayToAll}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                      <Copy size={12} /> Apply to all days
                    </button>
                    <div style={{ position: 'relative' as const }}>
                      <button onClick={() => { setShowCustomCopyFrom(!showCustomCopyFrom); setShowCustomCopyTo(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                        Copy from <ChevronDown size={12} />
                      </button>
                      {showCustomCopyFrom && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'white', border: '1px solid #e8eef8', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column' as const, gap: '2px', zIndex: 20, boxShadow: '0 8px 24px rgba(26,115,232,0.12)', minWidth: '150px', maxHeight: '250px', overflowY: 'auto' }}>
                          {customDays.map((day, idx) => idx !== customActiveDay && (
                            <button key={idx} onClick={() => copyCustomDayFrom(idx)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#0d1b3e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                              <span>{day.dayName}</span>
                              <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>{day.meals.length}m</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ position: 'relative' as const }}>
                      <button onClick={() => { setShowCustomCopyTo(!showCustomCopyTo); setShowCustomCopyFrom(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                        Copy to <ChevronDown size={12} />
                      </button>
                      {showCustomCopyTo && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'white', border: '1px solid #e8eef8', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column' as const, gap: '2px', zIndex: 20, boxShadow: '0 8px 24px rgba(26,115,232,0.12)', minWidth: '150px', maxHeight: '250px', overflowY: 'auto' }}>
                          {customDays.map((day, idx) => idx !== customActiveDay && (
                            <button key={idx} onClick={() => copyCustomDayTo(idx)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#0d1b3e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                              <span>{day.dayName}</span>
                              <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>{day.meals.length}m</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={cardClass} style={cardStyle}>
                  <MealBuilder
                    key={customActiveDay}
                    meals={customDays[customActiveDay]?.meals ?? []}
                    onChange={(meals) => updateCustomDayMeals(customActiveDay, meals)}
                    dayNames={customDays.map((d) => d.dayName)}
                    currentDayIndex={customActiveDay}
                    onCopyMealToDays={copyMealToCustomDays}
                  />
                </div>

                <div className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4.5 sm:px-6 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: customPlanName ? '#0d1b3e' : '#b0bdd8' }}>{customPlanName || 'Unnamed Plan'}</div>
                    <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>{customDuration} days · {customDays.reduce((s, d) => s + d.meals.length, 0)} total meals</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={resetPlanMode} style={{ padding: '11px 20px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSaveCustomPlan} disabled={!customPlanName.trim() || isSavingCustom}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', background: !customPlanName.trim() ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !customPlanName.trim() ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !customPlanName.trim() ? 'not-allowed' : 'pointer', boxShadow: !customPlanName.trim() ? 'none' : '0 4px 16px rgba(26,115,232,0.35)' }}>
                      {isSavingCustom ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Saving...</> : <><Check size={15} /> Assign Custom Plan</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ REPORTS TAB ═══════ */}
        {activeTab === 'reports' && (
          <div className={cardClass} style={cardStyle}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', padding: '20px 22px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={17} color="#3b82f6" /></div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Today's Report</div>
                  <div style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: '500', marginTop: '1px' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => navigate(`/users/${id}/reports`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>
                <ClipboardList size={14} /> View All Reports
              </button>
            </div>

            <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Summary row */}
              {!mealLogsLoading && !waterLogsLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#f8fafd', border: '1px solid #e8eef8' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Meal Adherence</div>
                    {todayMealLogs.length > 0 ? (
                      <>
                        <div style={{ fontSize: '26px', fontWeight: '800', color: (() => { const pct = Math.round((todayMealLogs.filter(l => l.completed).length / todayMealLogs.length) * 100); return pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' })() }}>
                          {Math.round((todayMealLogs.filter(l => l.completed).length / todayMealLogs.length) * 100)}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: '500', marginTop: '3px' }}>{todayMealLogs.filter(l => l.completed).length}/{todayMealLogs.length} completed</div>
                      </>
                    ) : (
                      <div style={{ fontSize: '22px', fontWeight: '800', color: '#b0bdd8' }}>—</div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#f8fafd', border: '1px solid #e8eef8' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Water Today</div>
                    {todayWaterLogs.length > 0 ? (
                      <>
                        <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981' }}>
                          {(() => { const ml = todayWaterLogs.filter(l => l.completed).reduce((s, l) => s + l.amountMl, 0); return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml` })()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: '500', marginTop: '3px' }}>{todayWaterLogs.filter(l => l.completed).length}/{todayWaterLogs.length} slots done</div>
                      </>
                    ) : (
                      <div style={{ fontSize: '22px', fontWeight: '800', color: '#b0bdd8' }}>—</div>
                    )}
                  </div>
                </div>
              )}

              {/* Meal logs */}
              {mealLogsLoading ? (
                <div style={{ height: '80px', borderRadius: '14px', background: '#f0f4ff' }} />
              ) : todayMealLogs.length === 0 ? (
                <div style={{ padding: '20px', borderRadius: '14px', background: '#f8fafd', border: '1px solid #e8eef8', textAlign: 'center' }}>
                  <UtensilsCrossed size={22} color="#d0d8f0" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>No meal logs for today yet</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                    <UtensilsCrossed size={13} color="#3b82f6" />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0d1b3e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Meals</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todayMealLogs.map((meal, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '13px', background: meal.completed ? '#f0fdf4' : '#fff8f8', border: `1px solid ${meal.completed ? '#bbf7d0' : '#fecaca'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          {meal.completed ? <CheckCircle size={15} color="#22c55e" /> : <XCircle size={15} color="#ef4444" />}
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{meal.mealName}</div>
                            <div style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: '500', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={9} /> {fmt12h(meal.scheduledTime)}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: meal.completed ? '#22c55e' : '#ef4444' }}>
                          {meal.completed && meal.completedAt ? `Done ${new Date(meal.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Missed'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Water logs */}
              {waterLogsLoading ? (
                <div style={{ height: '60px', borderRadius: '14px', background: '#f0f4ff' }} />
              ) : todayWaterLogs.length === 0 ? (
                <div style={{ padding: '20px', borderRadius: '14px', background: '#f8fafd', border: '1px solid #e8eef8', textAlign: 'center' }}>
                  <Droplets size={22} color="#d0d8f0" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>No water logs for today yet</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                    <Droplets size={13} color="#10b981" />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0d1b3e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Water</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '8px' }}>
                    {todayWaterLogs.map((slot, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 11px', borderRadius: '12px', background: slot.completed ? '#f0fdf4' : '#f8fafd', border: `1px solid ${slot.completed ? '#bbf7d0' : '#e8eef8'}` }}>
                        <Droplets size={12} color={slot.completed ? '#10b981' : '#d0d8f0'} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: slot.completed ? '#0d1b3e' : '#b0bdd8' }}>{slot.amountMl}ml</div>
                          <div style={{ fontSize: '10px', color: '#b0bdd8', fontWeight: '500' }}>{fmt12h(slot.scheduledTime)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ═══════ WELLNESS TAB ═══════ */}
        {activeTab === 'wellness' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!activePlan ? (
              <div className={cardClass} style={{ ...cardStyle, textAlign: 'center' as const, padding: '48px 24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Droplets size={24} color="#1a73e8" />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e', marginBottom: '6px' }}>No Active Plan</div>
                <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>Assign a diet plan first to configure wellness settings.</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className={cardClass} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Droplets size={20} color="#1a73e8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Wellness Settings</div>
                    <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>Controls sleep schedule and water reminders on the mobile app for <strong style={{ color: '#0d1b3e' }}>{user.name}</strong></div>
                  </div>
                </div>

                {/* Sleep schedule */}
                <div className={cardClass} style={cardStyle}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '16px', display: 'block' }}>Sleep Schedule</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px' }}><Sun size={12} color="#f59e0b" /> Wake Up Time</label>
                      <input type="time" value={wellnessWakeUp} onChange={(e) => setWellnessWakeUp(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                        onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px' }}><Moon size={12} color="#7c3aed" /> Sleep Time</label>
                      <input type="time" value={wellnessSleepTime} onChange={(e) => setWellnessSleepTime(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                        onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Water */}
                <div className={cardClass} style={cardStyle}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '16px', display: 'block' }}>Daily Water Target</label>
                  <input type="number" step="0.1" min="0" max="10"
                    value={wellnessWaterMl / 1000}
                    onChange={(e) => setWellnessWaterMl(Math.round(parseFloat(e.target.value || '0') * 1000))}
                    placeholder="e.g. 2.0"
                    style={{ ...inputStyle, maxWidth: '180px' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                    onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                  />
                  <div style={{ fontSize: '12px', color: '#b0bdd8', marginTop: '6px' }}>litres per day</div>
                </div>

                {/* Live schedule preview — recomputes on every wake/sleep/water change */}
                {(() => {
                  const schedule = generateWaterSchedule(wellnessWakeUp, wellnessSleepTime, wellnessWaterMl)
                  if (schedule.length === 0) return null
                  const mlPerSlot = schedule[0]?.amountMl ?? 0
                  return (
                    <div className={cardClass} style={{ ...cardStyle, background: '#eef8ff', border: '1px solid #bee3f8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                        <Droplets size={13} color="#1a73e8" />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a73e8', textTransform: 'uppercase' as const, letterSpacing: '0.6px' }}>Reminder Preview</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {[
                          { label: 'Wake Up',   value: formatTime12h(wellnessWakeUp),              color: '#1a73e8' },
                          { label: 'Sleep',     value: formatTime12h(wellnessSleepTime),            color: '#7c3aed' },
                          { label: 'Reminders', value: `${schedule.length}`,                        color: '#0d1b3e' },
                          { label: 'Per Slot',  value: mlPerSlot ? `${mlPerSlot} ml` : '—',        color: mlPerSlot ? '#10b981' : '#d0d8f0' },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bc4', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Save button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSaveWellness} disabled={isSavingWellness}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: isSavingWellness ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)', opacity: isSavingWellness ? 0.7 : 1 }}>
                    {isSavingWellness ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Wellness Settings</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════ CREDENTIALS TAB ═══════ */}
        {activeTab === 'credentials' && (
          <div className={cardClass} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><KeyRound size={17} color="#1a73e8" /></div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Login Credentials</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '14px', background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '24px', fontSize: '13px', fontWeight: '500', color: '#b45309' }}>
              ⚠️ Keep these credentials secure. Share only with the patient directly.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[{ label: 'User ID', value: user.userId, key: 'userId', large: true }, { label: 'Login Email', value: user.userEmail, key: 'email', large: false }].map((item) => (
                <div key={item.key} style={{ padding: '20px', borderRadius: '16px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{item.label}</div>
                    <div style={{ fontSize: item.large ? '26px' : '16px', fontWeight: item.large ? '800' : '700', color: item.large ? '#1a73e8' : '#0d1b3e', letterSpacing: item.large ? '1px' : 'normal' }}>{item.value}</div>
                  </div>
                  <button onClick={() => handleCopy(item.value, item.key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: copied === item.key ? '#f0fdf4' : '#eef3ff', border: copied === item.key ? '1px solid #bbf7d0' : '1px solid #dbe8ff', color: copied === item.key ? '#15803d' : '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {copied === item.key ? <Check size={14} /> : <Copy size={14} />}{copied === item.key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
              <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Password</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0d1b3e', letterSpacing: '3px', fontFamily: 'monospace' }}>{showPassword ? (user.password ?? '(not stored)') : '••••••••'}</div>
                </div>
                <button onClick={() => setShowPassword(!showPassword)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#8a9bc4', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}{showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ padding: '16px 20px', borderRadius: '14px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#8a9bc4' }}>Patient Since</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}