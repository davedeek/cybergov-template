import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChefHat, Clock, Users, Gauge } from 'lucide-react'
import { Streamdown } from 'streamdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

interface Recipe {
  name: string
  description: string
  prepTime: string
  cookTime: string
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: { item: string; amount: string; notes?: string }[]
  instructions: string[]
  tips?: string[]
  nutritionPerServing?: {
    calories?: number
    protein?: string
    carbs?: string
    fat?: string
  }
}

type Mode = 'structured' | 'oneshot'

const SAMPLE_RECIPES = [
  'Homemade Margherita Pizza',
  'Thai Green Curry',
  'Classic Beef Bourguignon',
  'Chocolate Lava Cake',
  'Crispy Korean Fried Chicken',
  'Fresh Spring Rolls with Peanut Sauce',
  'Creamy Mushroom Risotto',
  'Authentic Pad Thai',
]

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const difficultyStyles = {
    easy: 'text-nd-flag-blue bg-nd-flag-blue/5 border-nd-flag-blue',
    medium: 'text-nd-ink bg-nd-surface border-nd-border',
    hard: 'text-nd-flag-red bg-nd-flag-red/5 border-nd-flag-red',
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="border-b-2 border-nd-ink pb-6">
        <h3 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight mb-2">
          {recipe.name}
        </h3>
        <p className="text-nd-ink-muted leading-relaxed italic">{recipe.description}</p>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 p-3 bg-nd-surface border border-nd-border shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Prep Time</span>
          <div className="flex items-center gap-2 text-nd-ink">
            <Clock className="w-4 h-4 text-nd-accent" />
            <span className="font-mono text-sm">{recipe.prepTime}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-nd-surface border border-nd-border shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Cook Time</span>
          <div className="flex items-center gap-2 text-nd-ink">
            <Clock className="w-4 h-4 text-nd-accent" />
            <span className="font-mono text-sm">{recipe.cookTime}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-nd-surface border border-nd-border shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted">Servings</span>
          <div className="flex items-center gap-2 text-nd-ink">
            <Users className="w-4 h-4 text-nd-accent" />
            <span className="font-mono text-sm">{recipe.servings} people</span>
          </div>
        </div>
        <div className={`flex flex-col gap-1 p-3 border shadow-sm ${difficultyStyles[recipe.difficulty]}`}>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">Difficulty</span>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            <span className="font-mono text-sm font-bold uppercase">{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-nd-surface p-6 border-2 border-nd-ink shadow-[4px_4px_0px_#1A1A18]">
        <h4 className="text-lg font-bold font-serif text-nd-ink uppercase tracking-tight mb-6 border-b border-nd-border pb-2 flex items-center gap-2">
          <span className="w-2 h-4 bg-nd-accent inline-block" />
          Ingredients
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="flex items-start gap-3 text-nd-ink border-b border-nd-border border-dashed pb-2">
              <span className="font-mono text-sm font-bold text-nd-accent">{ing.amount}</span>
              <span className="text-sm">
                {ing.item}
                {ing.notes && (
                  <span className="text-nd-ink-muted text-xs italic"> — {ing.notes}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div>
        <h4 className="text-lg font-bold font-serif text-nd-ink uppercase tracking-tight mb-6 border-b border-nd-ink pb-2">Instructions</h4>
        <ol className="space-y-6">
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className="flex gap-4 text-nd-ink group">
              <span className="flex-shrink-0 w-8 h-8 bg-nd-ink text-nd-bg font-mono flex items-center justify-center text-sm font-bold shadow-[2px_2px_0px_#C94A1E]">
                {idx + 1}
              </span>
              <span className="text-sm leading-relaxed pt-1 flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <div className="bg-[#FAF9F5] p-5 border border-nd-border italic">
          <h4 className="text-sm font-mono uppercase tracking-widest text-nd-ink mb-3 flex items-center gap-2">
            <span className="w-1 h-3 bg-nd-ink inline-block" />
            Chef's Notes
          </h4>
          <ul className="space-y-2">
            {recipe.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-nd-ink-muted text-sm px-2">
                <span className="text-nd-accent">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nutrition */}
      {recipe.nutritionPerServing && (
        <div className="pt-4 border-t border-nd-border">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted mb-3 italic">
            Nutrition (per serving)
          </h4>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono">
            {recipe.nutritionPerServing.calories && (
              <span className="px-2 py-1 bg-nd-surface border border-nd-border text-nd-ink">
                CAL: {recipe.nutritionPerServing.calories}
              </span>
            )}
            {recipe.nutritionPerServing.protein && (
              <span className="px-2 py-1 bg-nd-surface border border-nd-border text-nd-ink">
                PRO: {recipe.nutritionPerServing.protein}
              </span>
            )}
            {recipe.nutritionPerServing.carbs && (
              <span className="px-2 py-1 bg-nd-surface border border-nd-border text-nd-ink">
                CARB: {recipe.nutritionPerServing.carbs}
              </span>
            )}
            {recipe.nutritionPerServing.fat && (
              <span className="px-2 py-1 bg-nd-surface border border-nd-border text-nd-ink">
                FAT: {recipe.nutritionPerServing.fat}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StructuredPage() {
  const [recipeName, setRecipeName] = useState('')
  const [result, setResult] = useState<{
    mode: Mode
    recipe?: Recipe
    markdown?: string
    provider: string
    model: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (mode: Mode) => {
    if (!recipeName.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipe')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const canExecute = !!(!isLoading && recipeName.trim() && !error)

  return (
    <div className="min-h-[calc(100vh-80px)] bg-nd-bg p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-nd-ink pb-6">
          <ChefHat className="w-8 h-8 text-nd-accent" />
          <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight">
            Output Comparison
          </h1>
        </div>

        <p className="text-nd-ink-muted mb-8 max-w-2xl text-sm leading-relaxed">
          Evaluate different generation methodologies.
          <strong className="text-nd-ink"> One-Shot</strong> produces freeform
          markdown documentation, whereas <strong className="text-nd-ink">Structured</strong> mandates
          validated JSON parameters via a strict schema definition.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <Label htmlFor="recipe-name" className="text-xs font-mono uppercase tracking-widest text-nd-ink-muted">
              Inquiry / Subject
            </Label>
            <Input
              id="recipe-name"
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              disabled={isLoading}
              placeholder="e.g., Chocolate Chip Cookies"
              className="h-12 rounded-none border-2 border-nd-ink bg-nd-surface px-4 text-nd-ink focus-visible:ring-nd-accent font-sans shadow-sm"
            />

            <div className="pt-2">
              <Label className="text-[10px] font-mono uppercase tracking-widest text-nd-ink-muted mb-2 block">
                Standard Inquiries
              </Label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_RECIPES.map((name) => (
                  <button
                    key={name}
                    onClick={() => setRecipeName(name)}
                    disabled={isLoading}
                    className="px-3 py-1 text-[10px] font-mono bg-nd-surface hover:bg-nd-surface-alt text-nd-ink rounded-none border border-nd-border transition-colors uppercase tracking-tight"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => handleGenerate('oneshot')}
                disabled={!canExecute}
                variant="outline"
                className="h-14 rounded-none border-2 border-nd-ink font-serif font-bold text-nd-ink hover:bg-nd-surface-alt shadow-[4px_4px_0px_#1A1A18] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-tight"
              >
                Execute One-Shot
              </Button>
              <Button
                onClick={() => handleGenerate('structured')}
                disabled={!canExecute}
                className="h-14 rounded-none bg-nd-ink text-nd-bg font-serif font-bold hover:bg-nd-ink/90 shadow-[4px_4px_0px_#C94A1E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-tight"
              >
                Execute Structured
              </Button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-nd-surface rounded-none p-10 border-2 border-nd-ink shadow-[8px_8px_0px_#1A1A18]">
          <div className="flex items-center justify-between mb-8 border-b border-nd-border pb-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-nd-accent">
              Generated Artifact
            </h2>
            {result && (
              <span
                className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${
                  result.mode === 'structured'
                    ? 'bg-nd-ink text-nd-bg border-nd-ink'
                    : 'bg-nd-surface-alt text-nd-ink border-nd-border'
                }`}
              >
                Mode: {result.mode}
              </span>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-none border-2 border-nd-flag-red bg-nd-flag-red/5 mb-8">
              <AlertDescription className="font-mono text-sm uppercase">
                <strong>Transmission Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-6">
              <Skeleton className="h-12 w-2/3 bg-nd-surface-alt" />
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-20 bg-nd-surface-alt" />
                <Skeleton className="h-20 bg-nd-surface-alt" />
                <Skeleton className="h-20 bg-nd-surface-alt" />
                <Skeleton className="h-20 bg-nd-surface-alt" />
              </div>
              <Skeleton className="h-40 w-full bg-nd-surface-alt" />
              <Skeleton className="h-60 w-full bg-nd-surface-alt" />
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              {result.mode === 'structured' && result.recipe ? (
                <RecipeCard recipe={result.recipe} />
              ) : result.markdown ? (
                <div className="prose max-w-none prose-nd-ink font-sans">
                  <Streamdown>{result.markdown}</Streamdown>
                </div>
              ) : null}
            </div>
          ) : !error && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 text-nd-ink-muted border-2 border-dashed border-nd-border bg-nd-surface-alt">
              <ChefHat className="w-16 h-16 mb-6 opacity-20" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-center px-8">
                Standing by for input.<br/>Awaiting generation execution.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authed/ai/structured')({
  component: StructuredPage,
})
