import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useUnitsCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import type { Unit } from '@/types/entities'
import {
  Plus,
  FolderTree,
  Activity,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Download,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CreateUnitForm } from '@/components/forms/CreateUnitForm'
import { OnboardingWizard } from '@/components/ws/OnboardingWizard'

export const Route = createFileRoute('/_authed/ws/')({
  component: UnitsLandingPage,
  head: () => ({
    meta: [{ title: 'Units — CyberGov' }],
  }),
})

function UnitsLandingPage() {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()
  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const unitsCollection = useUnitsCollection(orgId)
  const createUnitMutation = useMutation(trpc.ws.units.create.mutationOptions())
  const importExampleMutation = useMutation(trpc.ws.units.importExampleData.mutationOptions())
  const { data: rawUnits = [], isLoading } = useLiveQuery(
    (q) => q.from({ units: unitsCollection }).select(({ units }) => units),
    [unitsCollection],
  )
  const units = rawUnits as unknown as Unit[]

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [importingExample, setImportingExample] = useState(false)

  // Show onboarding on first visit
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      const key = `cybergov-onboarding-seen-${orgId}`
      if (!localStorage.getItem(key)) {
        setShowOnboarding(true)
      }
    }
  }, [isLoading, orgId])

  const dismissOnboarding = () => {
    if (orgId) {
      localStorage.setItem(`cybergov-onboarding-seen-${orgId}`, '1')
    }
    setShowOnboarding(false)
  }

  const handleImportExample = async () => {
    if (!orgId || importingExample) return
    setImportingExample(true)
    await handleMutation(() => importExampleMutation.mutateAsync({ organizationId: orgId }), {
      label: 'Import Example Data',
      successToast: 'Example data imported',
      onSuccess: (unit: { id: number }) => {
        queryClient.invalidateQueries(trpc.ws.units.list.queryFilter({ organizationId: orgId }))
        dismissOnboarding()
        navigate({
          to: '/ws/$unitId',
          params: { unitId: unit.id.toString() },
          search: { orgId },
        })
      },
    })
    setImportingExample(false)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-nd-bg min-h-full">
      {/* Onboarding wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onDismiss={dismissOnboarding}
          onImportExample={handleImportExample}
          isImporting={importingExample}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-nd-ink">My Units</h1>
          <p className="text-nd-ink-muted mt-2 max-w-2xl">
            Work Simplification applies at the unit level. Select a unit below to analyze its Work
            Distribution and Process Charts, or create a new unit to get started.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleImportExample}
            disabled={importingExample}
            className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted hover:text-nd-accent transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            {importingExample ? 'Importing...' : 'Import Example'}
          </button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-nd-accent hover:bg-nd-accent-hover text-white flex gap-2">
                <Plus className="w-4 h-4" />
                Create Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              {orgId && (
                <CreateUnitForm
                  onSubmit={async (values) => {
                    await handleMutation(
                      () =>
                        createUnitMutation.mutateAsync({
                          organizationId: orgId!,
                          name: values.name.trim(),
                          description: values.description.trim() || undefined,
                        }),
                      {
                        label: 'Create Unit',
                        successToast: 'Unit created',
                        onSuccess: () => {
                          setIsCreateOpen(false)
                          queryClient.invalidateQueries(
                            trpc.ws.units.list.queryFilter({ organizationId: orgId! }),
                          )
                        },
                      },
                    )
                  }}
                  isPending={isPending}
                  onCancel={() => setIsCreateOpen(false)}
                />
              )}
              {mutationError && (
                <div className="mt-4 p-3 bg-nd-accent/10 border border-nd-accent text-nd-accent font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {mutationError}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {units.length === 0 ? (
        <Card className="border-nd-border bg-nd-surface shadow-sm text-center py-16">
          <CardContent>
            <div className="w-16 h-16 bg-nd-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderTree className="w-8 h-8 text-nd-accent" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-nd-ink mb-2">No Units Found</h3>
            <p className="text-nd-ink-muted mb-6 max-w-sm mx-auto">
              You haven't created any organizational units yet. Create a unit to begin setting up
              your Work Distribution and Process Charts.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-nd-accent hover:bg-nd-accent-hover"
              >
                Create First Unit
              </Button>
              <Button
                onClick={handleImportExample}
                disabled={importingExample}
                variant="outline"
                className="rounded-none border-nd-border hover:border-nd-accent hover:text-nd-accent"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {importingExample ? 'Importing...' : 'Load Example Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Card
              key={unit.id}
              className="border-nd-border bg-nd-surface shadow-sm hover:border-nd-accent/50 transition-colors flex flex-col"
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading text-nd-ink flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-nd-ink-muted" />
                  {unit.name}
                </CardTitle>
                {unit.description && (
                  <CardDescription className="text-nd-ink-muted line-clamp-2">
                    {unit.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="flex items-center gap-2 text-sm text-nd-ink-muted bg-nd-surface-alt p-3 rounded-md">
                  <Activity className="w-4 h-4 text-nd-flag-blue" />
                  <span>
                    {unit.name.includes('[Example]') ? 'Example data loaded' : 'Ready for analysis'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between hover:bg-nd-bg hover:text-nd-accent"
                >
                  <Link
                    to="/ws/$unitId"
                    params={{ unitId: unit.id.toString() }}
                    search={orgId ? { orgId } : {}}
                  >
                    Open Unit Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
