import { useState } from 'react'
import {
  X,
  ArrowRight,
  FileSpreadsheet,
  GitBranch,
  BarChart3,
  HelpCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingWizardProps {
  onDismiss: () => void
  onImportExample: () => void
  isImporting: boolean
}

const STEPS = [
  {
    title: 'Welcome to Work Simplification',
    description:
      "CyberGov digitizes the Bureau of Budget's proven method for improving workplace procedures. This guide will walk you through the three tools and the analysis workflow.",
    icon: BookOpen,
  },
  {
    title: 'Tool I: Work Distribution Chart',
    description:
      'Start by mapping who does what and how long it takes. The WDC reveals overloaded employees, misdirected effort, and activities that consume too much time.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Tool II: Process Chart',
    description:
      'Chart each procedure step by step using four symbols: Operations (work created), Transportation (work moved), Storage (work waiting), and Inspection (work checked).',
    icon: GitBranch,
  },
  {
    title: 'Tool III: Work Count',
    description:
      'Track volume and frequency at each step. Work counts reveal whether delays come from volume surges or poor methods, and help decide when to specialize.',
    icon: BarChart3,
  },
  {
    title: 'The Six Questions',
    description:
      'Apply What, Why, Where, When, Who, and How to every process step. This is where insights become action — flag steps to eliminate, combine, reorder, delegate, or simplify.',
    icon: HelpCircle,
  },
]

export function OnboardingWizard({
  onDismiss,
  onImportExample,
  isImporting,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  return (
    <div className="mb-8 bg-nd-ink text-nd-bg border-2 border-nd-ink shadow-stamp-hover animate-in slide-in-from-top-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-nd-bg/10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-nd-accent font-bold">
            Getting Started
          </span>
          <span className="text-[10px] font-mono text-nd-bg/40">
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-nd-bg/40 hover:text-nd-bg transition-colors"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-nd-bg/10">
        <div
          className="h-full bg-nd-accent transition-all duration-300"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-nd-accent flex items-center justify-center shrink-0">
            <step.icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif font-bold mb-2">{step.title}</h3>
            <p className="text-sm font-serif leading-relaxed text-nd-bg/80">{step.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-nd-bg/10">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-[10px] font-mono uppercase tracking-widest text-nd-bg/50 hover:text-nd-bg transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLast && (
              <Button
                onClick={onImportExample}
                disabled={isImporting}
                className="bg-nd-accent hover:bg-nd-accent/80 text-white font-mono text-xs uppercase tracking-widest"
              >
                <BookOpen className="w-3 h-3 mr-2" />
                {isImporting ? 'Importing...' : 'Load Example Data'}
              </Button>
            )}
            {!isLast ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-nd-bg text-nd-ink hover:bg-nd-bg/90 font-mono text-xs uppercase tracking-widest"
              >
                Next <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={onDismiss}
                variant="outline"
                className="border-nd-bg/30 text-nd-bg/70 hover:text-nd-bg hover:border-nd-bg font-mono text-xs uppercase tracking-widest bg-transparent"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
