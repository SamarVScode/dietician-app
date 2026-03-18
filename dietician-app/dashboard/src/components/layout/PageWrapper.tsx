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
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafd] relative">
      {/* Mobile/tablet backdrop — closes sidebar on tap */}
      <div
        className={`fixed inset-0 z-[200] backdrop-blur-[3px] bg-[rgba(13,27,62,0.45)] lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header title={title} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-[#f8fafd] p-2 min-[401px]:p-2.5 sm:p-5 lg:p-8 max-sm:[&_button]:!text-xs max-sm:[&_button]:![line-height:1.3] max-sm:[&>div]:!gap-3 max-sm:[&>div>div]:!gap-3">
          {children}
        </main>
      </div>
    </div>
  )
}
