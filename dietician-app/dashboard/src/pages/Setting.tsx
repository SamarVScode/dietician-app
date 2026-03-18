import { useState } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import { useSettings } from '../hooks/useSettings'
import type { SettingCategory } from '../services/settingsService'
import { Plus, X, Settings2 } from 'lucide-react'

const TABS: {
  key: SettingCategory
  label: string
  icon: string
  description: string
  placeholder: string
}[] = [
  {
    key: 'goals',
    label: 'Goals',
    icon: '🎯',
    description: 'Patient health and fitness goals',
    placeholder: 'e.g. Post Surgery Recovery',
  },
  {
    key: 'allergies',
    label: 'Allergies',
    icon: '🌿',
    description: 'Food allergies and intolerances',
    placeholder: 'e.g. Sesame',
  },
  {
    key: 'conditions',
    label: 'Medical Conditions',
    icon: '🏥',
    description: 'Medical conditions and diagnoses',
    placeholder: 'e.g. Celiac Disease',
  },
  {
    key: 'preferences',
    label: 'Food Preferences',
    icon: '🥗',
    description: 'Dietary preferences and restrictions',
    placeholder: 'e.g. Jain',
  },
  {
    key: 'bodyTypes',
    label: 'Body Types',
    icon: '💪',
    description: 'Body type classifications',
    placeholder: 'e.g. Athletic',
  },
]

function CategoryTab({
  category,
  description,
  placeholder,
}: {
  category: SettingCategory
  description: string
  placeholder: string
}) {
  const { items, isLoading, addItem, deleteItem, isAdding } = useSettings(category)
  const [newItem, setNewItem] = useState('')
  const [error, setError] = useState('')

  const handleAdd = async () => {
    const trimmed = newItem.trim()
    if (!trimmed) return setError('Please enter a name')
    const exists = items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) return setError('This item already exists')
    await addItem(trimmed)
    setNewItem('')
    setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const inputStyle = {
    flex: 1,
    padding: '11px 14px',
    borderRadius: '12px',
    border: '2px solid #e8eef8',
    background: '#f8fafd',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#0d1b3e',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  }

  if (isLoading) {
    return (
      <div className="p-8 sm:p-15" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading...</span>
      </div>
    )
  }

  const defaultItems = items.filter((i) => i.isDefault)
  const customItems = items.filter((i) => !i.isDefault)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Description */}
      <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>
        {description}
      </div>

      {/* Add New */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Add Custom Item
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-2.5">
          <input
            style={inputStyle}
            value={newItem}
            placeholder={placeholder}
            onChange={(e) => { setNewItem(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            onFocus={(e) => { e.target.style.border = '2px solid #1a73e8'; e.target.style.background = '#fafcff' }}
            onBlur={(e) => { e.target.style.border = '2px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !newItem.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 20px', borderRadius: '12px', background: !newItem.trim() ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !newItem.trim() ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !newItem.trim() ? 'not-allowed' : 'pointer', boxShadow: !newItem.trim() ? 'none' : '0 4px 12px rgba(26,115,232,0.3)', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}
          >
            {isAdding
              ? <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
              : <Plus size={16} />
            }
            Add
          </button>
        </div>
        {error && (
          <div style={{ fontSize: '12px', color: '#e53e3e', fontWeight: '500', marginTop: '6px' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Custom Items */}
      {customItems.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            Custom Items ({customItems.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
            {customItems.map((item) => (
              <div
                key={item.id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '40px', background: '#eef3ff', border: '2px solid #dbe8ff' }}
              >
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a73e8' }}>
                  {item.name}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#1a73e8', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                >
                  <X size={10} color="white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: '#f0f4ff' }} />

      {/* Default Items */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Default Items ({defaultItems.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
          {defaultItems.map((item) => (
            <div
              key={item.id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '40px', background: '#f8fafd', border: '1.5px solid #e8eef8' }}
            >
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
                {item.name}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#b0bdd8', background: '#f0f4ff', padding: '1px 6px', borderRadius: '40px' }}>
                default
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#b0bdd8', fontWeight: '500', marginTop: '10px' }}>
          Default items cannot be deleted
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingCategory>('goals')

  const activeConfig = TABS.find((t) => t.key === activeTab)!

  return (
    <PageWrapper title="Settings">
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings2 size={22} color="#1a73e8" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>App Settings</div>
            <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>
              Manage dropdown options used across the app
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto sm:overflow-visible" style={{ background: 'white', borderRadius: '16px', padding: '8px', border: '1px solid #e8eef8', display: 'flex', gap: '4px', boxShadow: '0 2px 8px rgba(26,115,232,0.04)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="shrink-0 sm:shrink sm:flex-1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.key ? '#1a73e8' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#8a9bc4',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(26,115,232,0.3)' : 'none',
                whiteSpace: 'nowrap' as const,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="p-4 sm:p-7 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f0f4ff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {activeConfig.icon}
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e' }}>{activeConfig.label}</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>{activeConfig.description}</div>
            </div>
          </div>

          <CategoryTab
            key={activeTab}
            category={activeTab}
            description={activeConfig.description}
            placeholder={activeConfig.placeholder}
          />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}