import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useParams } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@/hooks/useOrganization'
import { useTRPC } from '@/integrations/trpc/react'
import {
  FileBarChart,
  LayoutList,
  Share2,
  Hammer,
  Info,
  Flag,
  HelpCircle,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProcessChart } from '@/components/ws/pc/useProcessChart'
import { ProcessChartLedger } from '@/components/ws/pc/ProcessChartLedger'
import { ProcessChartListView } from '@/components/ws/pc/ProcessChartListView'
import { ProcessChartMermaidView } from '@/components/ws/pc/ProcessChartMermaidView'
import { ProcessChartSidebar } from '@/components/ws/pc/ProcessChartSidebar'
import { AnalysisSummary } from '@/components/ws/pc/AnalysisSummary'
import { ShareDialog } from '@/components/ws/shared/ShareDialog'
import { AddStepForm } from '@/components/forms/AddStepForm'
import { FlagList } from '@/components/ws/shared/FlagList'
import { SixQuestionsWorkspace } from '@/components/ws/pc/SixQuestionsWorkspace'
import { WorkCountTab } from '@/components/ws/wc/WorkCountTab'
import { useProcessFlags } from '@/components/ws/pc/useProcessFlags'
import { InlineError } from '@/components/ui/inline-error'
import { TAB_TRIGGER_CLASS } from '@/components/ws/shared/table-styles'

export const Route = createFileRoute('/_authed/ws/$unitId/pc/$pcId')({
  component: ProcessChartPageComponent,
  head: () => ({
    meta: [{ title: 'Process Chart — CyberGov' }],
  }),
})

function ProcessChartPageComponent() {
  const { unitId, pcId } = useParams({ from: '/_authed/ws/$unitId/pc/$pcId' })
  const pPcId = Number(pcId)
  const { organization } = useOrganization()
  const orgId = organization?.id
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {
    chart,
    steps,
    annotations,
    annotationsCollection,
    isLoading,
    activeTab,
    setActiveTab,
    addStepForm,
    editStepForm,
    editingId,
    setEditingId,
    mermaidSvg,
    mermaidSrc,
    dragId,
    setDragId,
    dropIdx,
    setDropIdx,
    handleReorder,
    startEdit,
    commitEdit,
    handleRemoveStep,
    mutationError,
    mutationPending,
  } = useProcessChart(orgId, pPcId)

  const processFlags = useProcessFlags({ steps, storageWarnMinutes: 30, distanceWarnFeet: 50 })

  const [shareOpen, setShareOpen] = useState(false)
  const regenerateTokenMutation = useMutation(
    trpc.ws.processChart.regenerateShareToken.mutationOptions(),
  )
  const duplicateAsProposalMutation = useMutation(
    trpc.ws.processChart.duplicateAsProposal.mutationOptions(),
  )

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-24">
        <div className="w-12 h-12 border-4 border-nd-border border-t-nd-accent rounded-sm animate-spin" />
      </div>
    )

  if (!chart)
    return (
      <div className="p-12 text-center font-mono text-nd-ink-muted uppercase tracking-[0.2em]">
        Process Chart Not Found
      </div>
    )

  const storageWarn = 30
  const distWarn = 50
  const isProposed = chart.chartState === 'proposed'

  const copyCSV = () => {
    const header = 'Step,Type,Description,Who,Wait (min),Distance (ft)'
    const rows = steps.map(
      (s, i) =>
        `${i + 1},${s.symbol},"${s.description}","${s.who || ''}",${s.minutes ?? ''},${s.feet ?? ''}`,
    )
    navigator.clipboard.writeText([header, ...rows].join('\n'))
    toast.success('Copied to clipboard')
  }

  const copyMermaid = () => {
    navigator.clipboard.writeText(mermaidSrc)
    toast.success('Copied to clipboard')
  }

  const handleStartAnalysis = (_targetQuestion?: string) => {
    setActiveTab('six-questions')
  }

  const handleDuplicateAsProposal = async () => {
    if (!orgId) return
    await duplicateAsProposalMutation.mutateAsync({ organizationId: orgId, processChartId: pPcId })
  }

  return (
    <div className="min-h-screen bg-nd-bg">
      {/* Dark header matching WDC */}
      <header className="bg-nd-ink text-nd-bg sticky top-0 z-40 px-8 py-6 print:py-0 print:bg-nd-surface print:text-black print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-2">
              Work Simplification — Tool II
              {isProposed && (
                <span className="ml-3 px-2 py-0.5 bg-nd-accent text-white text-[9px] font-bold uppercase tracking-widest">
                  Proposed
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-nd-bg/10 p-1.5 rounded-sm">
                <FileBarChart className="w-5 h-5 text-nd-bg" />
              </div>
              <h1 className="text-3xl font-bold font-serif tracking-tight">{chart.name}</h1>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="border-2 border-nd-bg/30 text-nd-bg/70 hover:text-white hover:border-white font-mono text-[10px] uppercase tracking-widest bg-transparent"
            >
              <Share2 className="w-3 h-3 mr-2" /> Share
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-2 border-nd-bg/30 text-nd-bg/70 hover:text-white hover:border-white font-mono text-[10px] uppercase tracking-widest bg-transparent"
            >
              Generate PDF
            </Button>
            <Link to="/ws/$unitId" params={{ unitId }} className="text-nd-bg/70 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Proposed chart banner */}
      {isProposed && chart.linkedChartId && (
        <div className="bg-nd-accent/10 border-b-2 border-nd-accent px-8 py-3 flex items-center gap-3">
          <span className="text-xs font-mono text-nd-accent uppercase tracking-widest">
            Proposed version
          </span>
          <Link
            to="/ws/$unitId/pc/$pcId"
            params={{ unitId, pcId: String(chart.linkedChartId) }}
            className="text-xs font-mono text-nd-accent hover:underline"
          >
            View original chart &rarr;
          </Link>
        </div>
      )}

      <div className="p-8 max-w-[1600px] mx-auto">
        {mutationError && (
          <InlineError className="mb-8">Process Error: {mutationError}</InlineError>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
            <AddStepForm form={addStepForm} isPending={mutationPending} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-0 border-none">
              <div className="flex items-center justify-between mb-8 border-b-2 border-nd-ink print:hidden">
                <div className="overflow-x-auto -mx-2 px-2">
                  <TabsList className="bg-transparent h-auto p-0 gap-8 flex-nowrap whitespace-nowrap">
                    <TabsTrigger value="ledger" className={TAB_TRIGGER_CLASS}>
                      <LayoutList className="w-4 h-4 mr-2" />{' '}
                      <span className="hidden sm:inline">Ledger View</span>
                      <span className="sm:hidden">Ledger</span>
                    </TabsTrigger>
                    <TabsTrigger value="flow" className={TAB_TRIGGER_CLASS}>
                      <Hammer className="w-4 h-4 mr-2" />{' '}
                      <span className="hidden sm:inline">Flow View</span>
                      <span className="sm:hidden">Flow</span>
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className={TAB_TRIGGER_CLASS}>
                      <Flag className="w-4 h-4 mr-2" />{' '}
                      <span className="hidden sm:inline">Analysis</span>
                      {processFlags.length > 0 && (
                        <span className="bg-nd-accent text-white rounded-full px-2 py-0.5 text-[10px] ml-2 leading-none font-mono">
                          {processFlags.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="six-questions" className={TAB_TRIGGER_CLASS}>
                      <HelpCircle className="w-4 h-4 mr-2" />{' '}
                      <span className="hidden sm:inline">Six Questions</span>
                      <span className="sm:hidden">6Q</span>
                    </TabsTrigger>
                    <TabsTrigger value="workcount" className={TAB_TRIGGER_CLASS}>
                      <BarChart3 className="w-4 h-4 mr-2" />{' '}
                      <span className="hidden sm:inline">Work Count</span>
                      <span className="sm:hidden">Count</span>
                    </TabsTrigger>
                    <TabsTrigger value="mermaid" className={TAB_TRIGGER_CLASS}>
                      <Info className="w-4 h-4 mr-2" />{' '}
                      <span className="hidden sm:inline">Diagram Map</span>
                      <span className="sm:hidden">Map</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent
                value="ledger"
                className="animate-fade-in-tab m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0"
              >
                <ProcessChartLedger
                  steps={steps}
                  editingId={editingId}
                  editForm={editStepForm}
                  startEdit={startEdit}
                  commitEdit={commitEdit}
                  setEditingId={setEditingId}
                  handleRemoveStep={handleRemoveStep}
                  storageWarn={storageWarn}
                  distWarn={distWarn}
                  copyCSV={copyCSV}
                />
              </TabsContent>

              <TabsContent
                value="flow"
                className="animate-fade-in-tab m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0"
              >
                <ProcessChartListView
                  steps={steps}
                  dragId={dragId}
                  setDragId={setDragId}
                  dropIdx={dropIdx}
                  setDropIdx={setDropIdx}
                  handleReorder={handleReorder}
                  handleRemoveStep={handleRemoveStep}
                  storageWarn={storageWarn}
                  distWarn={distWarn}
                  endPoint={chart.endPoint}
                />
              </TabsContent>

              <TabsContent
                value="analysis"
                className="animate-fade-in-tab m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0"
              >
                <FlagList
                  flags={processFlags}
                  emptyMessage="No active flags. Add steps to your process chart to see pattern analysis."
                  action={{ label: 'Start Analysis', onClick: (f) => handleStartAnalysis(f.targetQuestion) }}
                />
              </TabsContent>

              <TabsContent
                value="six-questions"
                className="animate-fade-in-tab m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0"
              >
                <SixQuestionsWorkspace
                  steps={steps}
                  annotations={annotations}
                  annotationsCollection={annotationsCollection}
                  orgId={orgId!}
                  processChartId={pPcId}
                  onStepInserted={() =>
                    queryClient.invalidateQueries(
                      trpc.ws.processChart.listSteps.queryFilter({ processChartId: pPcId }),
                    )
                  }
                  onAnnotationSaved={() =>
                    queryClient.invalidateQueries(
                      trpc.ws.processChart.listAnnotations.queryFilter({ processChartId: pPcId }),
                    )
                  }
                  onDuplicateAsProposal={!isProposed ? handleDuplicateAsProposal : undefined}
                  isDuplicating={duplicateAsProposalMutation.isPending}
                />
              </TabsContent>

              <TabsContent
                value="workcount"
                className="animate-fade-in-tab m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0"
              >
                {orgId && <WorkCountTab orgId={orgId} unitId={parseInt(unitId)} />}
              </TabsContent>

              <TabsContent
                value="mermaid"
                className="animate-fade-in-tab m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0"
              >
                <ProcessChartMermaidView
                  mermaidSvg={mermaidSvg}
                  mermaidSrc={mermaidSrc}
                  copyMermaid={copyMermaid}
                  stepsCount={steps.length}
                />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="w-full lg:w-[400px] shrink-0 print:hidden space-y-6">
            <ProcessChartSidebar
              chart={chart}
              steps={steps}
              storageWarn={storageWarn}
              distWarn={distWarn}
            />
            <AnalysisSummary steps={steps} annotations={annotations} />
          </aside>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        shareToken={chart.shareToken}
        onRegenerate={async () => {
          if (!orgId) return
          await regenerateTokenMutation.mutateAsync({
            organizationId: orgId,
            processChartId: pPcId,
          })
        }}
        isRegenerating={regenerateTokenMutation.isPending}
      />
    </div>
  )
}
