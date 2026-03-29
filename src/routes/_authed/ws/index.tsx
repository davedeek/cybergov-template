import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useUnitsCollection } from '@/db-collections'
import { Plus, FolderTree, Activity, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CreateUnitForm } from '@/components/forms/CreateUnitForm'

export const Route = createFileRoute('/_authed/ws/')({
  component: UnitsLandingPage,
})

function UnitsLandingPage() {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const { data: currentOrg } = useQuery(trpc.organization.getOrCreateCurrent.queryOptions())
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const unitsCollection = useUnitsCollection(orgId)
  const { data: units = [], isLoading } = useLiveQuery(
    (q) => q.from({ units: unitsCollection }).select(({ units }) => units),
    [unitsCollection],
  )

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nd-accent"></div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-nd-bg min-h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-nd-ink">
            My Units
          </h1>
          <p className="text-nd-ink-muted mt-2 max-w-2xl">
            Work Simplification applies at the unit level. Select a unit below to analyze its Work Distribution and Process Charts, or create a new unit to get started.
          </p>
        </div>

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
                unitsCollection={unitsCollection} 
                orgId={orgId} 
                onSuccess={() => setIsCreateOpen(false)} 
                onCancel={() => setIsCreateOpen(false)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {units.length === 0 ? (
        <Card className="border-nd-border bg-nd-surface shadow-sm text-center py-16">
          <CardContent>
            <div className="w-16 h-16 bg-nd-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderTree className="w-8 h-8 text-nd-accent" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-nd-ink mb-2">No Units Found</h3>
            <p className="text-nd-ink-muted mb-6 max-w-sm mx-auto">
              You haven't created any organizational units yet. Create a unit to begin setting up your Work Distribution and Process Charts.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-nd-accent hover:bg-nd-accent-hover">
              Create First Unit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Card key={unit.id} className="border-nd-border bg-nd-surface shadow-sm hover:border-nd-accent/50 transition-colors flex flex-col">
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
                  <span>Ready for analysis</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild variant="outline" className="w-full justify-between hover:bg-nd-bg hover:text-nd-accent">
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
