import { createFileRoute } from '@tanstack/react-router'
import { User, AlertCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/forms/ProfileForm'
import { useMutationHandler } from '@/hooks/use-mutation-handler'

export const Route = createFileRoute('/_authed/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session } = authClient.useSession()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const handleUpdateProfile = async (values: { name: string }) => {
    await handleMutation(
      () => authClient.updateUser({ name: values.name }),
      { label: 'Update User Profile' }
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto font-sans">
      {mutationError && (
        <div className="mb-6 p-4 bg-nd-accent/10 border-2 border-nd-accent text-nd-accent font-mono text-xs uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Profile Error: {mutationError}</span>
        </div>
      )}

      <div className="mb-8 border-b-2 border-nd-ink pb-6">
        <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight flex items-center gap-3">
          <User className="w-6 h-6 text-nd-accent" />
          Profile
        </h1>
        <p className="text-nd-ink-muted mt-2">Manage your account settings.</p>
      </div>

      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18]">
        <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            User Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {session?.user && (
            <ProfileForm 
              initialName={session.user.name ?? ''} 
              email={session.user.email ?? ''} 
              onSubmit={handleUpdateProfile}
              isPending={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
