import { useState } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from '@tanstack/react-db'
import { useTodosCollection } from '@/db-collections'

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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto font-sans">
      <div className="mb-6 border-b-2 border-nd-ink pb-6">
        <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight">Todos</h1>
        <p className="text-nd-ink-muted mt-2">
          Manage tasks for your workspace.
        </p>
      </div>

      {/* Add todo form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 px-4 py-3 bg-nd-bg border-2 border-nd-border rounded-none text-nd-ink placeholder:text-nd-ink-muted focus:outline-none focus:border-nd-ink transition-colors font-sans"
        />
        <button
          type="submit"
          disabled={!newTodo.trim() || addMutation.isPending}
          className="px-6 py-3 bg-nd-ink hover:bg-nd-ink/90 disabled:opacity-50 text-nd-bg font-serif font-bold tracking-wide rounded-none transition-colors border-2 border-nd-ink flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {/* Todos list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-[#EDEAE2] border border-[#C8C3B4] rounded-none animate-pulse"
            />
          ))}
        </div>
      ) : !todos?.length ? (
        <div className="text-center py-12 bg-nd-surface border-2 border-nd-border border-dashed rounded-none">
          <CheckCircle className="w-12 h-12 text-nd-ink-muted mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-nd-ink-muted">No todos yet. Add one above.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-center gap-3 p-4 bg-nd-surface border border-nd-border rounded-none group hover:border-nd-ink transition-colors ${todo.completedAt ? 'bg-[#FAF9F5]' : ''}`}
            >
              <button
                onClick={() =>
                  toggleMutation.mutate({
                    organizationId: orgId!,
                    id: todo.id,
                    completedAt: todo.completedAt ? null : new Date(),
                  })
                }
                className={`flex-shrink-0 transition-colors ${todo.completedAt ? 'text-[#2B5EA7]' : 'text-nd-ink-muted hover:text-nd-ink'}`}
              >
                {todo.completedAt ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span
                className={`flex-1 font-serif text-[15px] ${
                  todo.completedAt
                    ? 'line-through text-nd-ink-muted italic'
                    : 'text-nd-ink'
                }`}
              >
                {todo.name}
              </span>
              <button
                onClick={() =>
                  deleteMutation.mutate({
                    organizationId: orgId!,
                    id: todo.id,
                  })
                }
                className="flex-shrink-0 text-[#C94A1E]/50 hover:text-[#C94A1E] opacity-0 group-hover:opacity-100 transition-all ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
