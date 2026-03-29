import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useTRPC } from '@/integrations/trpc/react'

export function useOrganization() {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }
  
  const { data: currentOrg, isLoading } = useQuery({
    ...trpc.organization.getOrCreateCurrent.queryOptions(),
  })

  const organization = currentOrg?.organization
  const orgId = search?.orgId ?? organization?.id

  return {
    organization: organization ? { ...organization, id: orgId as number } : undefined,
    orgId: orgId as number | undefined,
    isLoading
  }
}
