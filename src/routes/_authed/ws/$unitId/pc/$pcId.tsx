import { createFileRoute } from '@tanstack/react-router'
import { useParams } from '@tanstack/react-router'
import { useOrganization } from '@/hooks/useOrganization'
import { FileBarChart, LayoutList, Share2, Hammer, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProcessChart } from '@/hooks/useProcessChart'
import { ProcessChartLedger } from '@/components/ws/ProcessChartLedger'
import { ProcessChartListView } from '@/components/ws/ProcessChartListView'
import { ProcessChartMermaidView } from '@/components/ws/ProcessChartMermaidView'
import { ProcessChartSidebar } from '@/components/ws/ProcessChartSidebar'
import { AddStepForm } from '@/components/ws/AddStepForm'

export const Route = createFileRoute('/_authed/ws/$unitId/pc/$pcId')({
  component: ProcessChartPageComponent,
})

function ProcessChartPageComponent() {
  const { pcId } = useParams({ from: '/_authed/ws/$unitId/pc/$pcId' })
  const pPcId = Number(pcId)
  const { organization } = useOrganization()
  const orgId = organization?.id

  const {
    chart, steps, isLoading,
    activeTab, setActiveTab,
    newStep, setNewStep,
    editingId, setEditingId,
    editVals, setEditVals,
    copiedCsv, setCopiedCsv,
    copiedMermaid, setCopiedMermaid,
    mermaidSvg, mermaidSrc,
    dragId, setDragId,
    dropIdx, setDropIdx,
    handleReorder, handleAddStep, startEdit, commitEdit, handleRemoveStep,
  } = useProcessChart(orgId, pPcId)

  if (isLoading) return (
    <div className="flex items-center justify-center p-24">
      <div className="w-12 h-12 border-4 border-nd-border border-t-nd-accent rounded-sm animate-spin" />
    </div>
  )

  if (!chart) return <div className="p-12 text-center font-mono text-nd-ink-muted uppercase tracking-[0.2em]">Process Chart Not Found</div>

  const storageWarn = 30
  const distWarn = 50

  const copyCSV = () => {
    const header = 'Step,Type,Description,Who,Wait (min),Distance (ft)'
    const rows = steps.map((s, i) => `${i + 1},${s.symbol},"${s.description}","${s.who || ''}",${s.minutes ?? ''},${s.feet ?? ''}`)
    navigator.clipboard.writeText([header, ...rows].join('\n'))
    setCopiedCsv(true)
    setTimeout(() => setCopiedCsv(false), 2000)
  }

  const copyMermaid = () => {
    navigator.clipboard.writeText(mermaidSrc)
    setCopiedMermaid(true)
    setTimeout(() => setCopiedMermaid(false), 2000)
  }

  return (
    <div className="min-h-screen bg-nd-bg">
      <header className="border-b-2 border-nd-ink bg-white sticky top-0 z-40 px-8 py-6 print:hidden flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-nd-ink p-1.5 rounded-sm">
              <FileBarChart className="w-5 h-5 text-nd-bg" />
            </div>
            <h1 className="text-3xl font-nd-display uppercase tracking-tight text-nd-ink">{chart.name}</h1>
          </div>
          <p className="text-sm font-mono text-nd-ink-muted uppercase tracking-widest pl-11">Work Simplification · Process Chart</p>
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-none border-2 border-nd-ink font-mono text-[10px] uppercase tracking-widest"><Share2 className="w-3 h-3 mr-2" /> Share</Button>
          <Button variant="outline" onClick={() => window.print()} className="rounded-none border-2 border-nd-ink bg-nd-ink text-nd-bg hover:bg-nd-ink/90 font-mono text-[10px] uppercase tracking-widest">Generate PDF</Button>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
            <AddStepForm newStep={newStep} setNewStep={setNewStep} handleAddStep={handleAddStep} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-0 border-none">
              <div className="flex items-center justify-between mb-8 border-b-2 border-nd-ink print:hidden">
                <TabsList className="bg-transparent h-auto p-0 gap-8 rounded-none">
                  <TabsTrigger value="ledger" className="rounded-none border-none bg-none p-0 pb-3 text-sm font-nd-display uppercase tracking-widest text-nd-ink-muted data-[state=active]:text-nd-ink data-[state=active]:border-b-4 data-[state=active]:border-nd-accent transition-none">
                    <LayoutList className="w-4 h-4 mr-2" /> Ledger View
                  </TabsTrigger>
                  <TabsTrigger value="flow" className="rounded-none border-none bg-none p-0 pb-3 text-sm font-nd-display uppercase tracking-widest text-nd-ink-muted data-[state=active]:text-nd-ink data-[state=active]:border-b-4 data-[state=active]:border-nd-accent transition-none">
                    <Hammer className="w-4 h-4 mr-2" /> Flow View
                  </TabsTrigger>
                  <TabsTrigger value="mermaid" className="rounded-none border-none bg-none p-0 pb-3 text-sm font-nd-display uppercase tracking-widest text-nd-ink-muted data-[state=active]:text-nd-ink data-[state=active]:border-b-4 data-[state=active]:border-nd-accent transition-none">
                    <Info className="w-4 h-4 mr-2" /> Diagram Map
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="ledger" className="m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0">
                <ProcessChartLedger 
                  steps={steps} editingId={editingId} editVals={editVals} setEditVals={setEditVals} 
                  startEdit={startEdit} commitEdit={commitEdit} setEditingId={setEditingId} 
                  handleRemoveStep={handleRemoveStep} storageWarn={storageWarn} distWarn={distWarn}
                  copyCSV={copyCSV} copiedCsv={copiedCsv}
                />
              </TabsContent>

              <TabsContent value="flow" className="m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0">
                <ProcessChartListView 
                  steps={steps} dragId={dragId} setDragId={setDragId} dropIdx={dropIdx} setDropIdx={setDropIdx}
                  handleReorder={handleReorder} handleRemoveStep={handleRemoveStep} 
                  storageWarn={storageWarn} distWarn={distWarn} endPoint={chart.endPoint}
                />
              </TabsContent>

              <TabsContent value="mermaid" className="m-0 border-none mt-0 p-0 ring-offset-transparent focus-visible:ring-0">
                <ProcessChartMermaidView 
                  mermaidSvg={mermaidSvg} mermaidSrc={mermaidSrc} copyMermaid={copyMermaid} 
                  copiedMermaid={copiedMermaid} stepsCount={steps.length}
                />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="w-full lg:w-[400px] shrink-0 print:hidden">
            <ProcessChartSidebar chart={chart} steps={steps} storageWarn={storageWarn} distWarn={distWarn} />
          </aside>
        </div>
      </div>
    </div>
  )
}
