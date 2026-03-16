import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface PageWrapperProps {
  children: React.ReactNode
  title: string
}

export default function PageWrapper({ children, title }: PageWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="pw-root">
      {/* Mobile/tablet backdrop — closes sidebar on tap */}
      <div
        className={`pw-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pw-body">
        <Header title={title} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="pw-main">
          {children}
        </main>
      </div>
    </div>
  )
}
