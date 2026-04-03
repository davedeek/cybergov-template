import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Trash2, CheckCircle, ListTodo } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useTodosCollection } from '@/db-collections'
import { useMutationHandler } from '@/hooks/use-mutation-handler'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddTodoForm } from '@/components/forms/AddTodoForm'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader, PageHeaderLabel, PageHeaderTitle } from '@/components/ui/page-header'
import { InlineError } from '@/components/ui/inline-error'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_authed/todos')({
  component: TodosPage,
  head: () => ({
    meta: [{ title: 'Todos — CyberGov' }],
  }),
})

function TodosPage() {
  const trpc = useTRPC()
  const search = useSearch({ strict: false }) as { orgId?: number }
  const { handleMutation, isPending, error: mutationError } = useMutationHandler()

  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const queryClient = useQueryClient()
  const todosCollection = useTodosCollection(orgId)
  const addTodoMutation = useMutation(trpc.todos.add.mutationOptions())

  const { data: liveTodos = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ todo: todosCollection })
        .select(({ todo }) => ({
          ...todo,
        })),
    [todosCollection],
  )

  const todos = liveTodos as any[]

  return (
    <PageContainer>
      {mutationError && (
        <InlineError>Action Required: {mutationError}</InlineError>
      )}

      <PageHeader className="flex items-center justify-between">
        <div>
          <PageHeaderLabel>
            <ListTodo className="w-5 h-5" />
            <Label variant="section">Task Manager</Label>
          </PageHeaderLabel>
          <PageHeaderTitle className="text-4xl font-black tracking-tighter">
            Workspace Tasks
          </PageHeaderTitle>
        </div>
      </PageHeader>

      {/* Add todo form */}
      <Card variant="stamped" className="mb-10 hover:translate-y-0 hover:shadow-stamp">
        <CardHeader variant="stamped">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            Add New Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <AddTodoForm
            onSubmit={async (values) => {
              await handleMutation(
                () => addTodoMutation.mutateAsync({ organizationId: orgId!, name: values.name }),
                {
                  label: 'Create Todo',
                  successToast: 'Todo added',
                  onSuccess: () => queryClient.invalidateQueries(trpc.todos.list.queryFilter({ organizationId: orgId! })),
                }
              )
            }}
            isPending={isPending}
          />
        </CardContent>
      </Card>

      {/* Todos list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <Label variant="section">
            Current Backlog ({todos.length})
          </Label>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-20 w-full border-2 border-nd-border"
              />
            ))}
          </div>
        ) : !todos?.length ? (
          <div className="text-center py-20 bg-nd-surface-alt/20 border-2 border-nd-border border-dashed">
            <CheckCircle className="w-12 h-12 text-nd-ink-muted/30 mx-auto mb-3" />
            <Label variant="section">No entries found in this register.</Label>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`animate-slide-in-row group relative flex items-center gap-4 p-5 bg-nd-surface border-2 border-nd-ink transition-all hover:shadow-stamp hover:-translate-y-0.5 ${todo.completedAt ? 'opacity-70 grayscale bg-nd-surface-alt/50 border-nd-border hover:shadow-none hover:translate-y-0' : ''}`}
              >
                <button
                  onClick={() =>
                    handleMutation(
                      () => todosCollection.update(todo.id, {
                        completedAt: todo.completedAt ? null : new Date(),
                      } as any),
                      { label: 'Toggle Todo', successToast: 'Todo updated' }
                    )
                  }
                  className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-colors ${todo.completedAt ? 'bg-nd-ink border-nd-ink text-nd-bg' : 'bg-nd-bg border-nd-ink hover:border-nd-accent'}`}
                >
                  {todo.completedAt && <CheckCircle className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className={`block font-serif text-lg leading-tight ${
                      todo.completedAt
                        ? 'line-through text-nd-ink-muted italic'
                        : 'text-nd-ink font-bold'
                    }`}
                  >
                    {todo.name}
                  </span>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted opacity-60">
                    ID: {todo.id.toString().slice(-8)} · STAMPED: {new Date(todo.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMutation(
                      () => todosCollection.delete(todo.id),
                      { label: 'Delete Todo', successToast: 'Todo deleted' }
                    )}
                    className="h-9 w-9 text-nd-ink-muted hover:text-nd-accent hover:bg-nd-accent-light transition-colors border border-transparent hover:border-nd-accent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  )
}
