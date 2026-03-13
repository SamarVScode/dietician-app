import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import { useSettings } from '../hooks/useSettings'
import {
  User, Phone, Target, Salad, Heart,
  Pill, FileText, ArrowLeft, Edit2, Save, X, Eye,
  EyeOff, Copy, Check, ClipboardList, UtensilsCrossed,
  Activity, KeyRound, ChevronRight, Trash2,
} from 'lucide-react'

const GENDERS = ['Male', 'Female', 'Other']

type TabKey = 'profile' | 'dietplan' | 'reports' | 'credentials'

interface UserData {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  weight: number
  height: number
  bmi: number
  bmiCategory: string
  bodyType: string
  goal: string
  preference: string
  allergies: string[]
  conditions: string[]
  medications: string
  notes: string
  userId: string
  userEmail: string
  password?: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserData>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Fetch options from Settings
  const { items: goalItems } = useSettings('goals')
  const { items: preferenceItems } = useSettings('preferences')
  const { items: allergyItems } = useSettings('allergies')
  const { items: conditionItems } = useSettings('conditions')
  const { items: bodyTypeItems } = useSettings('bodyTypes')

  const GOALS = goalItems.map((i) => i.name)
  const PREFERENCES = preferenceItems.map((i) => i.name)
  const ALLERGY_OPTIONS = allergyItems.map((i) => i.name)
  const CONDITIONS = conditionItems.map((i) => i.name)
  const BODY_TYPES = bodyTypeItems.length > 0 ? bodyTypeItems.map((i) => i.name) : ['Ectomorph', 'Mesomorph', 'Endomorph']

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'users', id!))
      if (!snap.exists()) throw new Error('User not found')
      return { id: snap.id, ...snap.data() } as UserData
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      await updateDoc(doc(db, 'users', id!), { ...data, updatedAt: new Date().toISOString() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteDoc(doc(db, 'users', id!))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/dashboard')
    },
  })

  const handleEdit = () => { if (user) { setEditForm({ ...user }); setIsEditing(true) } }
  const handleSave = () => updateMutation.mutate(editForm)
  const handleCancel = () => { setEditForm({}); setIsEditing(false) }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = () => {
    if (deleteConfirmText === user?.name) {
      deleteMutation.mutate()
    }
  }

  const updateEdit = (field: keyof UserData, value: string | string[] | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleEditAllergy = (allergy: string) => {
    const current = editForm.allergies ?? user?.allergies ?? []
    updateEdit('allergies', current.includes(allergy) ? current.filter((a) => a !== allergy) : [...current, allergy])
  }

  const toggleEditCondition = (condition: string) => {
    const current = editForm.conditions ?? user?.conditions ?? []
    updateEdit('conditions', current.includes(condition) ? current.filter((c) => c !== condition) : [...current, condition])
  }

  const tabStyle = (key: TabKey) => ({
    display: 'flex' as const, alignItems: 'center' as const, gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none',
    background: activeTab === key ? '#1a73e8' : 'transparent', color: activeTab === key ? 'white' : '#8a9bc4',
    fontSize: '13px', fontWeight: '600' as const, cursor: 'pointer', transition: 'all 0.15s ease',
    boxShadow: activeTab === key ? '0 2px 8px rgba(26,115,232,0.3)' : 'none',
  })

  const cardStyle = { background: 'white', border: '1px solid #e8eef8', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }
  const labelStyle = { fontSize: '11px', fontWeight: '700' as const, color: '#b0bdd8', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '4px' }
  const valueStyle = { fontSize: '15px', fontWeight: '600' as const, color: '#0d1b3e' }
  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid #e8eef8', background: '#f8fafd', fontSize: '14px', fontWeight: '500' as const, color: '#0d1b3e', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }
  const chipStyle = (selected: boolean) => ({ padding: '7px 14px', borderRadius: '40px', border: selected ? '2px solid #1a73e8' : '2px solid #e8eef8', background: selected ? '#eef3ff' : '#f8fafd', color: selected ? '#1a73e8' : '#4a5568', fontSize: '13px', fontWeight: '600' as const, cursor: 'pointer', transition: 'all 0.15s' })

  const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
    active: { label: 'Plan Active', bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#bbf7d0' },
    'no-plan': { label: 'No Plan', bg: '#fffbeb', text: '#b45309', dot: '#f59e0b', border: '#fde68a' },
    inactive: { label: 'Inactive', bg: '#fff5f5', text: '#c53030', dot: '#fc8181', border: '#fed7d7' },
  }

  if (isLoading) {
    return (
      <PageWrapper title="Patient Profile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading patient...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    )
  }

  if (!user) {
    return (
      <PageWrapper title="Patient Profile">
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#0d1b3e' }}>Patient not found</div>
          <button onClick={() => navigate('/dashboard')} style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '14px', background: '#1a73e8', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </PageWrapper>
    )
  }

  const status = statusConfig[user.status] ?? statusConfig['no-plan']

  return (
    <PageWrapper title="Patient Profile">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '36px', width: '420px', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fff5f5', border: '2px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Trash2 size={28} color="#e53e3e" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0d1b3e', marginBottom: '8px' }}>Delete Patient</div>
                <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', lineHeight: '1.5' }}>
                  This will permanently delete <strong style={{ color: '#0d1b3e' }}>{user.name}</strong>'s profile and all associated data. This action cannot be undone.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
                  Type <strong>{user.name}</strong> to confirm deletion:
                </div>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={user.name}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid #e8eef8', background: '#f8fafd', fontSize: '14px', fontWeight: '500', color: '#0d1b3e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                  onFocus={(e) => { e.target.style.border = '2px solid #fc8181'; e.target.style.background = '#fff5f5' }}
                  onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== user.name || deleteMutation.isPending}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', background: deleteConfirmText === user.name ? 'linear-gradient(135deg, #e53e3e, #c53030)' : '#f0f0f0', border: 'none', color: deleteConfirmText === user.name ? 'white' : '#b0bdd8', fontSize: '14px', fontWeight: '700', cursor: deleteConfirmText === user.name ? 'pointer' : 'not-allowed', boxShadow: deleteConfirmText === user.name ? '0 4px 12px rgba(229,62,62,0.3)' : 'none', transition: 'all 0.2s' }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Patient'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#8a9bc4', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: 'fit-content', padding: '4px 0' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        {/* Header Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d1b3e', letterSpacing: '-0.5px', marginBottom: '6px' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
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

          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  <Trash2 size={15} /> Delete
                </button>
                <button onClick={() => navigate(`/users/${id}/plan`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  <UtensilsCrossed size={15} /> Diet Plan
                </button>
                <button onClick={handleEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 3px 12px rgba(26,115,232,0.3)' }}>
                  <Edit2 size={15} /> Edit
                </button>
              </>
            ) : (
              <>
                <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  <X size={15} /> Cancel
                </button>
                <button onClick={handleSave} disabled={updateMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 3px 12px rgba(26,115,232,0.3)' }}>
                  <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '8px', border: '1px solid #e8eef8', display: 'flex', gap: '4px', boxShadow: '0 2px 8px rgba(26,115,232,0.04)' }}>
          {([
            { key: 'profile' as TabKey, label: 'Profile Info', icon: <User size={14} /> },
            { key: 'dietplan' as TabKey, label: 'Diet Plan', icon: <UtensilsCrossed size={14} /> },
            { key: 'reports' as TabKey, label: 'Reports', icon: <Activity size={14} /> },
            { key: 'credentials' as TabKey, label: 'Credentials', icon: <KeyRound size={14} /> },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(tab.key)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFILE ── */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Personal Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={17} color="#1a73e8" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Personal Information</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Full Name</div>
                  {isEditing ? (
                    <input style={inputStyle} value={editForm.name ?? ''} onChange={(e) => updateEdit('name', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={valueStyle}>{user.name}</div>}
                </div>
                <div>
                  <div style={labelStyle}>Age</div>
                  {isEditing ? (
                    <input type="number" style={inputStyle} value={editForm.age ?? ''} onChange={(e) => updateEdit('age', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={valueStyle}>{user.age} years</div>}
                </div>
                <div>
                  <div style={labelStyle}>Phone</div>
                  {isEditing ? (
                    <input style={inputStyle} value={editForm.phone ?? ''} onChange={(e) => updateEdit('phone', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="#8a9bc4" /> {user.phone || '—'}</div>}
                </div>
                <div>
                  <div style={labelStyle}>Gender</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {GENDERS.map((g) => (<button key={g} type="button" onClick={() => updateEdit('gender', g)} style={chipStyle((editForm.gender ?? user.gender) === g)}>{g}</button>))}
                    </div>
                  ) : <div style={valueStyle}>{user.gender}</div>}
                </div>
              </div>
            </div>

            {/* Body Metrics */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚖️</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Body Metrics</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={labelStyle}>Weight (kg)</div>
                  {isEditing ? (
                    <input type="number" style={inputStyle} value={editForm.weight ?? ''} onChange={(e) => updateEdit('weight', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={valueStyle}>{user.weight} kg</div>}
                </div>
                <div>
                  <div style={labelStyle}>Height (cm)</div>
                  {isEditing ? (
                    <input type="number" style={inputStyle} value={editForm.height ?? ''} onChange={(e) => updateEdit('height', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={valueStyle}>{user.height} cm</div>}
                </div>
                <div>
                  <div style={labelStyle}>BMI</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a73e8' }}>{user.bmi}</div>
                </div>
                <div>
                  <div style={labelStyle}>BMI Category</div>
                  <span style={{ padding: '5px 12px', borderRadius: '40px', fontSize: '13px', fontWeight: '700', background: user.bmiCategory === 'Normal' ? '#f0fdf4' : user.bmiCategory === 'Underweight' ? '#fffbeb' : user.bmiCategory === 'Overweight' ? '#fff7ed' : '#fff5f5', color: user.bmiCategory === 'Normal' ? '#15803d' : user.bmiCategory === 'Underweight' ? '#b45309' : user.bmiCategory === 'Overweight' ? '#c2410c' : '#c53030', border: user.bmiCategory === 'Normal' ? '1px solid #bbf7d0' : user.bmiCategory === 'Underweight' ? '1px solid #fde68a' : user.bmiCategory === 'Overweight' ? '1px solid #fed7aa' : '1px solid #fed7d7' }}>
                    {user.bmiCategory}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Body Type</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {BODY_TYPES.map((bt) => (<button key={bt} type="button" onClick={() => updateEdit('bodyType', bt)} style={chipStyle((editForm.bodyType ?? user.bodyType) === bt)}>{bt}</button>))}
                    </div>
                  ) : <div style={valueStyle}>{user.bodyType}</div>}
                </div>
              </div>
            </div>

            {/* Diet Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Salad size={17} color="#ca8a04" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Diet Information</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={labelStyle}>Goal</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {GOALS.map((g) => (<button key={g} type="button" onClick={() => updateEdit('goal', g)} style={chipStyle((editForm.goal ?? user.goal) === g)}>{g}</button>))}
                    </div>
                  ) : <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} color="#8a9bc4" /> {user.goal}</div>}
                </div>
                <div>
                  <div style={labelStyle}>Food Preference</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {PREFERENCES.map((p) => (<button key={p} type="button" onClick={() => updateEdit('preference', p)} style={chipStyle((editForm.preference ?? user.preference) === p)}>{p}</button>))}
                    </div>
                  ) : <div style={valueStyle}>{user.preference}</div>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Allergies</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {ALLERGY_OPTIONS.map((a) => (
                        <button key={a} type="button" onClick={() => toggleEditAllergy(a)} style={{ ...chipStyle((editForm.allergies ?? user.allergies ?? []).includes(a)), ...((editForm.allergies ?? user.allergies ?? []).includes(a) ? { background: '#fff5f5', border: '2px solid #fc8181', color: '#c53030' } : {}) }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {(!user.allergies || user.allergies.length === 0) ? (
                        <span style={{ color: '#b0bdd8', fontSize: '14px', fontWeight: '500' }}>None</span>
                      ) : user.allergies.map((a) => (
                        <span key={a} style={{ padding: '5px 12px', borderRadius: '40px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', fontSize: '13px', fontWeight: '600' }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={17} color="#e53e3e" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Health Information</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={labelStyle}>Medical Conditions</div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {CONDITIONS.map((c) => (<button key={c} type="button" onClick={() => toggleEditCondition(c)} style={chipStyle((editForm.conditions ?? user.conditions ?? []).includes(c))}>{c}</button>))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {(!user.conditions || user.conditions.length === 0) ? (
                        <span style={{ color: '#b0bdd8', fontSize: '14px', fontWeight: '500' }}>None</span>
                      ) : user.conditions.map((c) => (
                        <span key={c} style={{ padding: '5px 12px', borderRadius: '40px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '600' }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={labelStyle}>Medications</div>
                  {isEditing ? (
                    <input style={inputStyle} value={editForm.medications ?? ''} onChange={(e) => updateEdit('medications', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}><Pill size={14} color="#8a9bc4" /> {user.medications || '—'}</div>}
                </div>
                <div>
                  <div style={labelStyle}>Additional Notes</div>
                  {isEditing ? (
                    <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }} value={editForm.notes ?? ''} onChange={(e) => updateEdit('notes', e.target.value)}
                      onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                      onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                    />
                  ) : <div style={{ ...valueStyle, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><FileText size={14} color="#8a9bc4" style={{ marginTop: '2px', flexShrink: 0 }} />{user.notes || '—'}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: DIET PLAN ── */}
        {activeTab === 'dietplan' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UtensilsCrossed size={17} color="#ca8a04" /></div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Current Diet Plan</div>
            </div>
            {user.status === 'no-plan' || user.status === 'inactive' ? (
              <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><UtensilsCrossed size={30} color="#d0d8f0" /></div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No Diet Plan Assigned</div>
                <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '24px' }}>Assign a diet plan to help this patient reach their goal</div>
                <button onClick={() => navigate(`/users/${id}/plan`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
                  <UtensilsCrossed size={17} /> Assign Diet Plan <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div style={{ padding: '20px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#15803d', marginBottom: '4px' }}>✅ Plan Active</div>
                  <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: '500' }}>Patient is currently following a diet plan</div>
                </div>
                <button onClick={() => navigate(`/users/${id}/plan`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', background: 'white', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Change Plan <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: REPORTS ── */}
        {activeTab === 'reports' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={17} color="#3b82f6" /></div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Daily Reports</div>
              </div>
              <button onClick={() => navigate(`/users/${id}/reports`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                <ClipboardList size={14} /> View All Reports
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><ClipboardList size={30} color="#d0d8f0" /></div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>View Full Reports</div>
              <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '24px' }}>See all daily reports submitted by this patient</div>
              <button onClick={() => navigate(`/users/${id}/reports`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
                <Activity size={17} /> Open Reports <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: CREDENTIALS ── */}
        {activeTab === 'credentials' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><KeyRound size={17} color="#1a73e8" /></div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Login Credentials</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '14px', background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '24px', fontSize: '13px', fontWeight: '500', color: '#b45309' }}>
              ⚠️ Keep these credentials secure. Share only with the patient directly.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>User ID</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#1a73e8', letterSpacing: '1px' }}>{user.userId}</div>
                </div>
                <button onClick={() => handleCopy(user.userId, 'userId')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: copied === 'userId' ? '#f0fdf4' : '#eef3ff', border: copied === 'userId' ? '1px solid #bbf7d0' : '1px solid #dbe8ff', color: copied === 'userId' ? '#15803d' : '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied === 'userId' ? <Check size={14} /> : <Copy size={14} />}{copied === 'userId' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Login Email</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>{user.userEmail}</div>
                </div>
                <button onClick={() => handleCopy(user.userEmail, 'email')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', background: copied === 'email' ? '#f0fdf4' : '#eef3ff', border: copied === 'email' ? '1px solid #bbf7d0' : '1px solid #dbe8ff', color: copied === 'email' ? '#15803d' : '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}{copied === 'email' ? 'Copied!' : 'Copy'}
                </button>
              </div>
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