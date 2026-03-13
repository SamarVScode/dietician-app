import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}
    >
      <div className="text-8xl mb-6">🥗</div>
      <h1 className="text-6xl font-bold text-green-900 mb-2">404</h1>
      <p className="text-slate-500 font-medium mb-8">
        Page not found
      </p>
      <button
        onClick={() => navigate(ROUTES.DASHBOARD)}
        className="px-8 py-4 rounded-2xl text-white font-bold transition-all hover:scale-[1.02] hover:shadow-lg"
        style={{ background: 'linear-gradient(135deg, #16a34a, #14532d)' }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}