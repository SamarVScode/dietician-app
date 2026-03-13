import Sidebar from './Sidebar'
import Header from './Header'

interface PageWrapperProps {
  children: React.ReactNode
  title: string
}

export default function PageWrapper({ children, title }: PageWrapperProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: '#f8fafd',
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Header title={title} />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            background: '#f8fafd',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}