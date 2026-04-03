export const SIX_QUESTIONS = [
  {
    q: 'What' as const,
    key: 'what' as const,
    prompt: 'What are the steps? Do I have them all? What does each task actually do?',
    lookFor: 'Missing steps, vague descriptions, steps that bundle multiple actions',
    example:
      'Step 4 bundles both verification and data entry — these should be separate steps so we can see where time is spent.',
  },
  {
    q: 'Why' as const,
    key: 'why' as const,
    prompt:
      "Is this task necessary? Can a good result be obtained without it? Don't be misled by an excuse when you're looking for a reason.",
    lookFor:
      "Steps done 'because we always have', duplicate checks, approvals that never catch anything",
    example:
      'This approval catches errors less than 1% of the time — it may be unnecessary overhead that delays every application.',
  },
  {
    q: 'Where' as const,
    key: 'where' as const,
    prompt:
      'Can this be done closer to where the output is needed? Can we reduce transportation by changing location of employees or equipment?',
    lookFor: "Backtracking, long transportation, work done far from where it's needed",
    example:
      'Forms are walked to Building B for filing, but the scanner is in this office — scanning here would eliminate the trip.',
  },
  {
    q: 'When' as const,
    key: 'when' as const,
    prompt:
      'Is this done in the right sequence? Can steps be combined or simplified by moving them earlier or later?',
    lookFor: 'Steps that could happen earlier or in parallel, batching opportunities',
    example:
      'Completeness check happens after routing — moving it before would prevent rework when applications are returned incomplete.',
  },
  {
    q: 'Who' as const,
    key: 'who' as const,
    prompt:
      'Is the right person doing this? Is there someone better placed — or should it be delegated?',
    lookFor: 'Senior staff doing routine work, wrong department, single points of failure',
    example:
      'Senior reviewer handles routine renewals that a clerk could process, freeing the reviewer for complex cases.',
  },
  {
    q: 'How' as const,
    key: 'how' as const,
    prompt:
      'Can it be done better with different equipment, a form, or a different layout? Can we make the job easier for everyone involved?',
    lookFor: 'Manual work that could use a form/template, outdated tools, unnecessary complexity',
    example:
      'Applicants fill paper forms that staff re-key into the system — an online form would eliminate this entire step.',
  },
] as const

export type QuestionKey = (typeof SIX_QUESTIONS)[number]['key']

export const PROPOSED_ACTIONS = [
  { value: 'none' as const, label: 'No change' },
  { value: 'eliminate' as const, label: 'Eliminate' },
  { value: 'combine' as const, label: 'Combine' },
  { value: 'reorder' as const, label: 'Reorder' },
  { value: 'delegate' as const, label: 'Delegate' },
  { value: 'simplify' as const, label: 'Simplify' },
] as const

export type ProposedAction = (typeof PROPOSED_ACTIONS)[number]['value']

export const ACTION_COLORS: Record<ProposedAction, string> = {
  none: '',
  eliminate: 'border-l-[#C94A1E]',
  combine: 'border-l-[#D4A017]',
  reorder: 'border-l-[#2B5EA7]',
  delegate: 'border-l-[#6B46A7]',
  simplify: 'border-l-[#2E8B57]',
}
