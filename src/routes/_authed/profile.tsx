import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { User, Save } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/_authed/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session } = authClient.useSession()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSaved(false)

    try {
      await authClient.updateUser({ name })
      setSaved(true)
    } catch {
      // handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <User className="w-6 h-6 text-cyan-400" />
          Profile
        </h1>
        <p className="text-gray-400 mt-1">Manage your account settings.</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email ?? ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-gray-400 cursor-not-allowed text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
            {saved && (
              <span className="text-emerald-400 text-sm">Saved!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
