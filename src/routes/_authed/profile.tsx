import { createFileRoute } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/forms/ProfileForm'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader, PageHeaderTitle, PageHeaderDescription } from '@/components/ui/page-header'
import { InlineError } from '@/components/ui/inline-error'

export const Route = createFileRoute('/_authed/profile')({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: 'Profile — CyberGov' }],
  }),
})

function ProfilePage() {
  const { data: session } = authClient.useSession()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const handleUpdateProfile = async (values: { name: string }) => {
    await handleMutation(
      () => authClient.updateUser({ name: values.name }),
      { label: 'Update User Profile', successToast: 'Profile updated' }
    )
  }

  return (
    <PageContainer size="sm" className="max-w-xl">
      {mutationError && (
        <InlineError>Profile Error: {mutationError}</InlineError>
      )}

      <PageHeader>
        <PageHeaderTitle className="flex items-center gap-3">
          <User className="w-6 h-6 text-nd-accent" />
          Profile
        </PageHeaderTitle>
        <PageHeaderDescription>Manage your account settings.</PageHeaderDescription>
      </PageHeader>

      <Card variant="stamped" className="hover:translate-y-0 hover:shadow-stamp">
        <CardHeader variant="stamped">
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
    </PageContainer>
  )
}
