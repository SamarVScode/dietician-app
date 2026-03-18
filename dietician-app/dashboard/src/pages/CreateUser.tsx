import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
// ✅ FIX: Import the isolated helper instead of calling createUserWithEmailAndPassword directly
import { createAuthUser } from '../utils/createAuthUser'
import PageWrapper from '../components/layout/PageWrapper'
import { useSettings } from '../hooks/useSettings'
import { generateUserId, generatePassword } from '../utils/generateCredentials'
import { calculateBMI } from '../utils/bmi'
import {
  User, Phone, Weight, Ruler, Target, Salad, Heart,
  Pill, FileText, ChevronRight, Copy, Check, X, Activity,
} from 'lucide-react'

const BODY_TYPES = ['Ectomorph', 'Mesomorph', 'Endomorph']
const GENDERS = ['Male', 'Female', 'Other']

interface FormData {
  name: string
  age: string
  gender: string
  phone: string
  weight: string
  height: string
  bodyType: string
  goal: string
  preference: string
  allergies: string[]
  conditions: string[]
  medications: string
  notes: string
  // Body composition (smart scale — all optional)
  bodyFatPercent: string
  muscleMass: string
  boneMass: string
  bodyWaterPercent: string
  visceralFat: string
  bmr: string
  metabolicAge: string
}

interface Credentials {
  userId: string
  password: string
}

const initialForm: FormData = {
  name: '',
  age: '',
  gender: '',
  phone: '',
  weight: '',
  height: '',
  bodyType: '',
  goal: '',
  preference: '',
  allergies: [],
  conditions: [],
  medications: '',
  notes: '',
  bodyFatPercent: '',
  muscleMass: '',
  boneMass: '',
  bodyWaterPercent: '',
  visceralFat: '',
  bmr: '',
  metabolicAge: '',
}

export default function CreateUser() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const { items: goalItems } = useSettings('goals')
  const { items: preferenceItems } = useSettings('preferences')
  const { items: allergyItems } = useSettings('allergies')
  const { items: conditionItems } = useSettings('conditions')
  const { items: bodyTypeItems } = useSettings('bodyTypes')

  const GOALS = goalItems.map((i) => i.name)
  const PREFERENCES = preferenceItems.map((i) => i.name)
  const ALLERGY_OPTIONS = allergyItems.map((i) => i.name)
  const CONDITIONS = conditionItems.map((i) => i.name)
  const BODY_TYPE_OPTIONS = bodyTypeItems.length > 0 ? bodyTypeItems.map((i) => i.name) : BODY_TYPES

  const steps = ['Personal Info', 'Body Metrics', 'Diet Info', 'Health Info', 'Body Comp']

  const bmiData =
    form.weight && form.height
      ? calculateBMI(parseFloat(form.weight), parseFloat(form.height))
      : null

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const toggleAllergy = (allergy: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }))
  }

  const toggleCondition = (condition: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.age) newErrors.age = 'Age is required'
    if (parseInt(form.age) < 1 || parseInt(form.age) > 120) newErrors.age = 'Enter valid age'
    if (!form.gender) newErrors.gender = 'Gender is required'
    if (!form.weight) newErrors.weight = 'Weight is required'
    if (!form.height) newErrors.height = 'Height is required'
    if (!form.bodyType) newErrors.bodyType = 'Body type is required'
    if (!form.goal) newErrors.goal = 'Goal is required'
    if (!form.preference) newErrors.preference = 'Preference is required'
    setErrors(newErrors as Partial<FormData>)
    return Object.keys(newErrors).length === 0
  }

  const createUser = async (attempt = 0): Promise<void> => {
    if (attempt > 3) throw new Error('Failed to generate unique ID after 3 attempts')

    const userId = generateUserId(form.name)
    const password = generatePassword()
    const userEmail = `${userId}@dietapp.com`

    try {
      // ✅ FIX: Uses secondary app — admin session is NOT disturbed
      await createAuthUser(userEmail, password)
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return createUser(attempt + 1)
      }
      throw error
    }

    const bmi = bmiData ? bmiData.value : 0
    const bmiCategory = bmiData ? bmiData.category : ''
    const docRef = doc(collection(db, 'users'))

    await setDoc(docRef, {
      id: docRef.id,
      name: form.name.trim(),
      age: parseInt(form.age),
      gender: form.gender,
      phone: form.phone,
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      bmi,
      bmiCategory,
      bodyType: form.bodyType,
      goal: form.goal,
      preference: form.preference,
      allergies: form.allergies,
      conditions: form.conditions,
      medications: form.medications,
      notes: form.notes,
      // Body composition (smart scale) — stored as numbers, null if not entered
      bodyFatPercent:   form.bodyFatPercent   ? parseFloat(form.bodyFatPercent)   : null,
      muscleMass:       form.muscleMass       ? parseFloat(form.muscleMass)       : null,
      boneMass:         form.boneMass         ? parseFloat(form.boneMass)         : null,
      bodyWaterPercent: form.bodyWaterPercent ? parseFloat(form.bodyWaterPercent) : null,
      visceralFat:      form.visceralFat      ? parseFloat(form.visceralFat)      : null,
      bmr:              form.bmr              ? parseFloat(form.bmr)              : null,
      metabolicAge:     form.metabolicAge     ? parseInt(form.metabolicAge)       : null,
      userId,
      userEmail,
      password,
      status: 'no-plan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setCredentials({ userId, password })
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      await createUser()
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`User ID: ${credentials.userId}\nPassword: ${credentials.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (credentials) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="w-[calc(100vw-24px)] sm:w-110 p-5 sm:p-10" style={{ background: 'white', borderRadius: '28px', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(26,115,232,0.35)' }}>
              <Check size={36} color="white" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d1b3e', letterSpacing: '-0.5px', marginBottom: '6px' }}>Patient Created!</div>
            <div style={{ fontSize: '14px', color: '#8a9bc4', fontWeight: '500' }}>Share these credentials with the patient</div>
          </div>

          <div style={{ background: '#f8fafd', border: '1px solid #e8eef8', borderRadius: '18px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>User ID</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a73e8', letterSpacing: '1px' }}>{credentials.userId}</div>
            </div>
            <div style={{ height: '1px', background: '#e8eef8', margin: '16px 0' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Password</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0d1b3e', letterSpacing: '2px', fontFamily: 'monospace' }}>{credentials.password}</div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '12px', fontWeight: '500', color: '#b45309', marginBottom: '20px' }}>
            ⚠️ Save these credentials before closing. They won't be shown again.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCopy} style={{ flex: 1, padding: '13px', borderRadius: '14px', background: copied ? '#f0fdf4' : '#eef3ff', border: copied ? '1px solid #bbf7d0' : '1px solid #dbe8ff', color: copied ? '#15803d' : '#1a73e8', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Both'}
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '13px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: '14px',
    border: hasError ? '2px solid #fc8181' : '2px solid #e8eef8',
    background: hasError ? '#fff5f5' : '#f8fafd',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#0d1b3e',
    outline: 'none',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  })

  const labelStyle = { display: 'block' as const, fontSize: '13px', fontWeight: '600' as const, color: '#0d1b3e', marginBottom: '8px' }
  const errorStyle = { fontSize: '12px', color: '#e53e3e', fontWeight: '500' as const, marginTop: '4px' }

  const chipStyle = (selected: boolean) => ({
    padding: '8px 16px',
    borderRadius: '40px',
    border: selected ? '2px solid #1a73e8' : '2px solid #e8eef8',
    background: selected ? '#eef3ff' : '#f8fafd',
    color: selected ? '#1a73e8' : '#4a5568',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  })

  const sectionStyle = { background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }
  const sectionClass = 'p-3.5 sm:p-7 rounded-[14px] sm:rounded-[20px]'
  const sectionHeaderStyle = { display: 'flex' as const, alignItems: 'center' as const, gap: '12px', marginBottom: '24px' }
  const sectionIconStyle = (bg: string) => ({ width: '40px', height: '40px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })

  return (
    <PageWrapper title="Add New Patient">
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Progress Steps */}
        <div className="p-3.5 sm:p-5 sm:px-7 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i <= activeStep ? 'linear-gradient(135deg, #1a73e8, #0d47a1)' : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: i <= activeStep ? 'white' : '#b0bdd8', boxShadow: i <= activeStep ? '0 2px 8px rgba(26,115,232,0.3)' : 'none', flexShrink: 0, transition: 'all 0.2s' }}>
                    {i < activeStep ? <Check size={14} /> : i + 1}
                  </div>
                  <span className="hidden sm:inline whitespace-nowrap" style={{ fontSize: '13px', fontWeight: i === activeStep ? '700' : '500', color: i === activeStep ? '#1a73e8' : i < activeStep ? '#0d1b3e' : '#b0bdd8' }}>{step}</span>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: '2px', background: i < activeStep ? '#1a73e8' : '#e8eef8', margin: '0 12px', transition: 'background 0.2s' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 1 — Personal Info */}
        <div className={sectionClass} style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionIconStyle('#eef3ff')}><User size={20} color="#1a73e8" /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>Personal Information</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Basic patient details</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Enter patient full name" style={inputStyle(!!errors.name)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff'; setActiveStep(0) }}
                onBlur={(e) => { e.target.style.border = errors.name ? '2px solid #fc8181' : '2px solid #e8eef8'; e.target.style.background = errors.name ? '#fff5f5' : '#f8fafd' }}
              />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div>
              <label style={labelStyle}>Age *</label>
              <input type="number" value={form.age} onChange={(e) => updateField('age', e.target.value)} placeholder="e.g. 28" style={inputStyle(!!errors.age)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = errors.age ? '2px solid #fc8181' : '2px solid #e8eef8'; e.target.style.background = errors.age ? '#fff5f5' : '#f8fafd' }}
              />
              {errors.age && <div style={errorStyle}>{errors.age}</div>}
            </div>

            <div>
              <label style={labelStyle}><Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="e.g. 9876543210" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Gender *</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {GENDERS.map((g) => (<button key={g} type="button" onClick={() => updateField('gender', g)} style={chipStyle(form.gender === g)}>{g}</button>))}
            </div>
            {errors.gender && <div style={errorStyle}>{errors.gender}</div>}
          </div>
        </div>

        {/* SECTION 2 — Body Metrics */}
        <div className={sectionClass} style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionIconStyle('#f0fdfa')}><Weight size={20} color="#0d9488" /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>Body Metrics</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Physical measurements</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label style={labelStyle}><Weight size={13} style={{ display: 'inline', marginRight: '4px' }} />Weight (kg) *</label>
              <input type="number" value={form.weight} onChange={(e) => updateField('weight', e.target.value)} placeholder="e.g. 72" style={inputStyle(!!errors.weight)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff'; setActiveStep(1) }}
                onBlur={(e) => { e.target.style.border = errors.weight ? '2px solid #fc8181' : '2px solid #e8eef8'; e.target.style.background = errors.weight ? '#fff5f5' : '#f8fafd' }}
              />
              {errors.weight && <div style={errorStyle}>{errors.weight}</div>}
            </div>

            <div>
              <label style={labelStyle}><Ruler size={13} style={{ display: 'inline', marginRight: '4px' }} />Height (cm) *</label>
              <input type="number" value={form.height} onChange={(e) => updateField('height', e.target.value)} placeholder="e.g. 170" style={inputStyle(!!errors.height)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = errors.height ? '2px solid #fc8181' : '2px solid #e8eef8'; e.target.style.background = errors.height ? '#fff5f5' : '#f8fafd' }}
              />
              {errors.height && <div style={errorStyle}>{errors.height}</div>}
            </div>
          </div>

          {bmiData && (
            <div style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '16px', background: 'linear-gradient(135deg, #eef3ff, #e8f5ff)', border: '1px solid #dbe8ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#8a9bc4', marginBottom: '2px' }}>BMI (Auto Calculated)</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#1a73e8', letterSpacing: '-0.5px' }}>{bmiData.value}</div>
              </div>
              <div style={{ padding: '8px 18px', borderRadius: '40px', background: bmiData.category === 'Normal' ? '#f0fdf4' : bmiData.category === 'Underweight' ? '#fffbeb' : bmiData.category === 'Overweight' ? '#fff7ed' : '#fff5f5', border: bmiData.category === 'Normal' ? '1px solid #bbf7d0' : bmiData.category === 'Underweight' ? '1px solid #fde68a' : bmiData.category === 'Overweight' ? '1px solid #fed7aa' : '1px solid #fed7d7', fontSize: '14px', fontWeight: '700', color: bmiData.category === 'Normal' ? '#15803d' : bmiData.category === 'Underweight' ? '#b45309' : bmiData.category === 'Overweight' ? '#c2410c' : '#c53030' }}>
                {bmiData.category}
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Body Type *</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {BODY_TYPE_OPTIONS.map((bt) => (<button key={bt} type="button" onClick={() => updateField('bodyType', bt)} style={chipStyle(form.bodyType === bt)}>{bt}</button>))}
            </div>
            {errors.bodyType && <div style={errorStyle}>{errors.bodyType}</div>}
          </div>
        </div>

        {/* SECTION 3 — Diet Info */}
        <div className={sectionClass} style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionIconStyle('#fefce8')}><Salad size={20} color="#ca8a04" /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>Diet Information</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Goals and food preferences</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}><Target size={13} style={{ display: 'inline', marginRight: '4px' }} />Goal *</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {GOALS.map((g) => (<button key={g} type="button" onClick={() => { updateField('goal', g); setActiveStep(2) }} style={chipStyle(form.goal === g)}>{g}</button>))}
            </div>
            {errors.goal && <div style={errorStyle}>{errors.goal}</div>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Food Preference *</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {PREFERENCES.map((p) => (<button key={p} type="button" onClick={() => updateField('preference', p)} style={chipStyle(form.preference === p)}>{p}</button>))}
            </div>
            {errors.preference && <div style={errorStyle}>{errors.preference}</div>}
          </div>

          <div>
            <label style={labelStyle}>Allergies</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {ALLERGY_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => toggleAllergy(a)} style={{ ...chipStyle(form.allergies.includes(a)), ...(form.allergies.includes(a) ? { background: '#fff5f5', border: '2px solid #fc8181', color: '#c53030' } : {}) }}>
                  {form.allergies.includes(a) && <X size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4 — Health Info */}
        <div className={sectionClass} style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionIconStyle('#fff5f5')}><Heart size={20} color="#e53e3e" /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>Health Information</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Medical conditions and medications</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}><Heart size={13} style={{ display: 'inline', marginRight: '4px' }} />Medical Conditions</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {CONDITIONS.map((c) => (<button key={c} type="button" onClick={() => { toggleCondition(c); setActiveStep(3) }} style={chipStyle(form.conditions.includes(c))}>{c}</button>))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}><Pill size={13} style={{ display: 'inline', marginRight: '4px' }} />Current Medications</label>
            <input type="text" value={form.medications} onChange={(e) => updateField('medications', e.target.value)} placeholder="e.g. Metformin 500mg" style={inputStyle(false)}
              onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
              onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
            />
          </div>

          <div>
            <label style={labelStyle}><FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />Additional Notes</label>
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Any additional notes about the patient..." rows={3}
              style={{ ...inputStyle(false), resize: 'vertical' as const, minHeight: '90px' }}
              onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
              onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
            />
          </div>
        </div>

        {/* SECTION 5 — Body Composition (Smart Scale) */}
        <div className={sectionClass} style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionIconStyle('#f0fdf4')}><Activity size={20} color="#16a34a" /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>Body Composition</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Smart scale / body composition monitor readings (optional)</div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', fontWeight: '500', color: '#15803d', marginBottom: '20px' }}>
            All fields are optional. Enter values from the patient's body composition monitor if available.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label style={labelStyle}>Body Fat (%)</label>
              <input type="number" step="0.1" value={form.bodyFatPercent} onChange={(e) => updateField('bodyFatPercent', e.target.value)} placeholder="e.g. 22.5" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff'; setActiveStep(4) }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Muscle Mass (kg)</label>
              <input type="number" step="0.1" value={form.muscleMass} onChange={(e) => updateField('muscleMass', e.target.value)} placeholder="e.g. 34.2" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Bone Mass (kg)</label>
              <input type="number" step="0.1" value={form.boneMass} onChange={(e) => updateField('boneMass', e.target.value)} placeholder="e.g. 2.8" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Body Water (%)</label>
              <input type="number" step="0.1" value={form.bodyWaterPercent} onChange={(e) => updateField('bodyWaterPercent', e.target.value)} placeholder="e.g. 55.0" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Visceral Fat (level)</label>
              <input type="number" min="1" max="59" value={form.visceralFat} onChange={(e) => updateField('visceralFat', e.target.value)} placeholder="e.g. 8" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>BMR (kcal/day)</label>
              <input type="number" value={form.bmr} onChange={(e) => updateField('bmr', e.target.value)} placeholder="e.g. 1680" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Metabolic Age (years)</label>
              <input type="number" value={form.metabolicAge} onChange={(e) => updateField('metabolicAge', e.target.value)} placeholder="e.g. 30" style={inputStyle(false)}
                onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:justify-between sm:items-center sm:p-5 sm:px-7 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '13px 24px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#dbe8ff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafd'; e.currentTarget.style.borderColor = '#e8eef8' }}
          >
            Cancel
          </button>

          <button onClick={handleSubmit} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '14px', background: isLoading ? '#93b4f0' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(26,115,232,0.35)', transition: 'all 0.2s' }}>
            {isLoading ? (
              <><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />Creating Patient...</>
            ) : (
              <>Create Patient <ChevronRight size={17} /></>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}