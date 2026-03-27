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
    <div className="p-6 lg:p-8 max-w-xl mx-auto font-sans">
      <div className="mb-8 border-b-2 border-nd-ink pb-6">
        <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight flex items-center gap-3">
          <User className="w-6 h-6 text-nd-accent" />
          Profile
        </h1>
        <p className="text-nd-ink-muted mt-2">Manage your account settings.</p>
      </div>

      <div className="bg-nd-surface rounded-none border-2 border-nd-ink p-8 shadow-[4px_4px_0px_#1A1A18]">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-6">User Parameters</div>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email ?? ''}
              disabled
              className="w-full px-4 py-3 bg-[#EDEAE2] border-none rounded-none text-nd-ink-muted cursor-not-allowed font-sans font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-nd-bg border border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted/50 focus:outline-none focus:border-nd-accent transition-colors font-sans"
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-nd-border/50">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-nd-ink hover:bg-nd-ink/90 disabled:opacity-50 text-nd-bg font-serif font-bold tracking-wide rounded-none transition-colors border-2 border-nd-ink flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
            {saved && (
              <span className="text-[#2B5EA7] font-mono text-xs uppercase tracking-widest font-bold">Saved successfully.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
