/**
 * Example data for the "Permit Processing Office" unit.
 * Used by the import feature to populate a complete Work Simplification analysis.
 */

export const EXAMPLE_UNIT = {
  name: 'Permit Processing Office [Example]',
  description:
    'A sample unit demonstrating the full Work Simplification workflow. Feel free to explore, edit, or delete this data.',
}

export const EXAMPLE_WDC = {
  name: 'Weekly Distribution — Permit Team',
  employees: [
    { name: 'A. Rivera', role: 'Clerk', fte: '1.0' },
    { name: 'B. Chen', role: 'Senior Clerk', fte: '1.0' },
    { name: 'C. Patel', role: 'Plan Reviewer', fte: '1.0' },
    { name: 'D. Okafor', role: 'Supervisor', fte: '0.5' },
  ],
  activities: [
    { name: 'Application Intake' },
    { name: 'Review & Approval' },
    { name: 'Data Entry' },
    { name: 'Filing & Records' },
    { name: 'Customer Service' },
  ],
  tasks: [
    // Rivera (Clerk)
    { employeeIdx: 0, activityIdx: 0, taskName: 'Receive & log applications', hoursPerWeek: 12 },
    { employeeIdx: 0, activityIdx: 2, taskName: 'Enter permit data into system', hoursPerWeek: 10 },
    { employeeIdx: 0, activityIdx: 3, taskName: 'File physical copies', hoursPerWeek: 6 },
    { employeeIdx: 0, activityIdx: 4, taskName: 'Answer phone inquiries', hoursPerWeek: 8 },
    // Chen (Senior Clerk)
    { employeeIdx: 1, activityIdx: 0, taskName: 'Check application completeness', hoursPerWeek: 8 },
    { employeeIdx: 1, activityIdx: 1, taskName: 'Review simple permits', hoursPerWeek: 14 },
    { employeeIdx: 1, activityIdx: 2, taskName: 'Update permit status', hoursPerWeek: 4 },
    { employeeIdx: 1, activityIdx: 4, taskName: 'Handle complex inquiries', hoursPerWeek: 10 },
    // Patel (Plan Reviewer)
    { employeeIdx: 2, activityIdx: 1, taskName: 'Review building plans', hoursPerWeek: 28 },
    { employeeIdx: 2, activityIdx: 0, taskName: 'Pre-screen submissions', hoursPerWeek: 6 },
    { employeeIdx: 2, activityIdx: 4, taskName: 'Consult with applicants', hoursPerWeek: 4 },
    // Okafor (Supervisor, 0.5 FTE)
    { employeeIdx: 3, activityIdx: 1, taskName: 'Sign off on complex permits', hoursPerWeek: 8 },
    { employeeIdx: 3, activityIdx: 4, taskName: 'Handle escalations', hoursPerWeek: 6 },
    { employeeIdx: 3, activityIdx: 3, taskName: 'Audit records monthly', hoursPerWeek: 4 },
  ],
}

export const EXAMPLE_PROCESS_CHART = {
  name: 'Building Permit Application',
  startPoint: 'Application received at front desk',
  endPoint: 'Permit issued or denied',
  steps: [
    {
      symbol: 'operation' as const,
      description: 'Receive application and supporting documents',
      who: 'Clerk',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'inspection' as const,
      description: 'Check application for completeness',
      who: 'Senior Clerk',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'operation' as const,
      description: 'Log application in tracking system',
      who: 'Clerk',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'transportation' as const,
      description: 'Walk application to review office',
      who: 'Clerk',
      minutes: null,
      feet: 200,
    },
    {
      symbol: 'storage' as const,
      description: 'Application waits in review queue',
      who: null,
      minutes: 2880,
      feet: null,
    },
    {
      symbol: 'operation' as const,
      description: 'Review building plans against code',
      who: 'Plan Reviewer',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'inspection' as const,
      description: 'Verify zoning compliance',
      who: 'Plan Reviewer',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'storage' as const,
      description: 'Wait for supervisor sign-off',
      who: null,
      minutes: 1440,
      feet: null,
    },
    {
      symbol: 'operation' as const,
      description: 'Supervisor reviews and approves/denies',
      who: 'Supervisor',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'operation' as const,
      description: 'Update system with decision',
      who: 'Senior Clerk',
      minutes: null,
      feet: null,
    },
    {
      symbol: 'transportation' as const,
      description: 'Return file to records room',
      who: 'Clerk',
      minutes: null,
      feet: 150,
    },
    {
      symbol: 'operation' as const,
      description: 'File permit and notify applicant',
      who: 'Clerk',
      minutes: null,
      feet: null,
    },
  ],
}

export const EXAMPLE_ANNOTATIONS = [
  {
    stepIdx: 1,
    question: 'why' as const,
    note: 'This completeness check catches missing documents about 40% of the time — it is necessary, but could be done at intake to prevent a second handling.',
    proposedAction: 'reorder' as const,
  },
  {
    stepIdx: 3,
    question: 'where' as const,
    note: 'The review office is 200 feet away. If the reviewer had a workstation near intake, this trip would be eliminated.',
    proposedAction: 'eliminate' as const,
  },
  {
    stepIdx: 4,
    question: 'when' as const,
    note: 'Applications wait an average of 2 days in the queue. Batching arrivals by type could reduce this to same-day for simple permits.',
    proposedAction: 'simplify' as const,
  },
  {
    stepIdx: 5,
    question: 'who' as const,
    note: 'Senior Clerk could handle simple code checks, freeing the Plan Reviewer for complex cases only.',
    proposedAction: 'delegate' as const,
  },
  {
    stepIdx: 7,
    question: 'why' as const,
    note: "Supervisor sign-off adds a 1-day wait. For routine permits, the reviewer's approval should suffice.",
    proposedAction: 'eliminate' as const,
  },
  {
    stepIdx: 10,
    question: 'where' as const,
    note: 'Physical filing is redundant — all records are already digital. The trip to the records room could be eliminated.',
    proposedAction: 'eliminate' as const,
  },
  {
    stepIdx: 0,
    question: 'how' as const,
    note: 'Applicants fill paper forms that staff re-key. An online submission portal would eliminate manual data entry.',
    proposedAction: 'simplify' as const,
  },
  {
    stepIdx: 11,
    question: 'how' as const,
    note: 'Applicant notification is done by phone. Email with a tracking link would be faster and self-service.',
    proposedAction: 'simplify' as const,
  },
]

export const EXAMPLE_WORK_COUNT = {
  name: 'March 2026 Weekly Count',
  period: 'weekly' as const,
  entries: [
    { stepIdx: 0, description: 'Receive application and supporting documents', count: 45 },
    { stepIdx: 1, description: 'Check application for completeness', count: 45 },
    { stepIdx: 2, description: 'Log application in tracking system', count: 42 },
    { stepIdx: 3, description: 'Walk application to review office', count: 42 },
    { stepIdx: 4, description: 'Application waits in review queue', count: 42 },
    { stepIdx: 5, description: 'Review building plans against code', count: 38 },
    { stepIdx: 6, description: 'Verify zoning compliance', count: 38 },
    { stepIdx: 7, description: 'Wait for supervisor sign-off', count: 35 },
    { stepIdx: 8, description: 'Supervisor reviews and approves/denies', count: 35 },
    { stepIdx: 9, description: 'Update system with decision', count: 35 },
    { stepIdx: 10, description: 'Return file to records room', count: 35 },
    { stepIdx: 11, description: 'File permit and notify applicant', count: 35 },
  ],
}

export const EXAMPLE_PROPOSED_CHANGE = {
  chartType: 'process_chart' as const,
  description:
    'Eliminate physical file transport and records room filing. All records are already digital — the 200ft trip and physical filing add no value.',
  beforeState:
    'Application is walked to review office (200 ft) and later returned to records room (150 ft).',
  afterState: 'Digital workflow routes application electronically. Physical filing eliminated.',
}
