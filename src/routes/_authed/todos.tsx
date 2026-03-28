import { useState } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Plus, Trash2, CheckCircle, ListTodo } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useTodosCollection } from '@/db-collections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authed/todos')({
  component: TodosPage,
})

function TodosPage() {
  const [newTodo, setNewTodo] = useState('')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as { orgId?: number }

  const { data: currentOrg } = useQuery(
    trpc.organization.getOrCreateCurrent.queryOptions(),
  )
  const orgId = search?.orgId ?? currentOrg?.organization.id

  const todosCollection = useTodosCollection(orgId)

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

  const addMutation = useMutation(
    trpc.todos.add.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
        setNewTodo('')
      },
    }),
  )

  const toggleMutation = useMutation(
    trpc.todos.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.todos.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() })
      },
    }),
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || !orgId) return
    addMutation.mutate({ organizationId: orgId, name: newTodo })
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto font-sans min-h-full bg-nd-bg overflow-x-hidden">
      <header className="mb-10 border-b-2 border-nd-ink pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-nd-accent mb-2">
            <ListTodo className="w-5 h-5" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Task Manager</span>
          </div>
          <h1 className="text-4xl font-black font-serif text-nd-ink uppercase tracking-tighter">
            Workspace Tasks
          </h1>
        </div>
      </header>

      {/* Add todo form */}
      <Card className="bg-nd-surface border-2 border-nd-ink rounded-none shadow-[4px_4px_0px_#1A1A18] mb-10">
        <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
          <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
            Add New Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex gap-3">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enter task description..."
              className="flex-1 bg-nd-bg border-2 border-nd-border focus:border-nd-ink rounded-none font-serif h-12 shadow-inner"
            />
            <Button 
              type="submit" 
              className="bg-nd-ink hover:bg-nd-accent text-nd-bg px-8 h-12 rounded-none transition-all shadow-[2px_2px_0px_#C94A1E]"
              disabled={!newTodo.trim() || addMutation.isPending}
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-bold uppercase tracking-widest text-xs">Append</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Todos list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-nd-ink-muted">
            Current Backlog ({todos.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-20 w-full bg-nd-surface-alt/30 border-2 border-nd-border rounded-none"
              />
            ))}
          </div>
        ) : !todos?.length ? (
          <div className="text-center py-20 bg-nd-surface-alt/20 border-2 border-nd-border border-dashed rounded-none">
            <CheckCircle className="w-12 h-12 text-nd-ink-muted/30 mx-auto mb-3" />
            <p className="font-mono text-xs uppercase tracking-widest text-nd-ink-muted">No entries found in this register.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`group relative flex items-center gap-4 p-5 bg-nd-surface border-2 border-nd-ink rounded-none transition-all hover:shadow-[4px_4px_0px_#1A1A18] hover:-translate-y-0.5 ${todo.completedAt ? 'opacity-70 grayscale bg-nd-surface-alt/50 border-nd-border hover:shadow-none hover:translate-y-0' : ''}`}
              >
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      organizationId: orgId!,
                      id: todo.id,
                      completedAt: todo.completedAt ? null : new Date(),
                    })
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
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-nd-ink-muted opacity-60">
                    ID: {todo.id.toString().slice(-8)} · STAMPED: {new Date(todo.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      deleteMutation.mutate({
                        organizationId: orgId!,
                        id: todo.id,
                      })
                    }
                    className="h-9 w-9 text-nd-ink-muted hover:text-nd-accent hover:bg-nd-accent-light rounded-none transition-colors border border-transparent hover:border-nd-accent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

