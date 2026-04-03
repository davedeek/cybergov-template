import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, ImageIcon, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutationHandler } from '@/hooks/use-mutation-handler'

const SIZES = ['1024x1024', '1536x1024', '1024x1536', 'auto']

interface GeneratedImage {
  url?: string
  b64Json?: string
  revisedPrompt?: string
}

function ImagePage() {
  const [prompt, setPrompt] = useState(
    'A cute baby sea otter wearing a beret and glasses, sitting at a small cafe table, sipping a cappuccino',
  )
  const [size, setSize] = useState('1024x1024')
  const [numberOfImages, setNumberOfImages] = useState(1)
  const [images, setImages] = useState<Array<GeneratedImage>>([])

  const { handleMutation, isPending: isLoading, error: mutationError } = useMutationHandler()

  const handleGenerate = async () => {
    setImages([])

    await handleMutation(
      async () => {
        const response = await fetch('/api/ai/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, size, numberOfImages }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate image')
        }

        setImages(data.images)
        return data
      },
      { label: 'AI Image Synthesis', successToast: 'Image generated' },
    )
  }

  const getImageSrc = (image: GeneratedImage) => {
    if (image.url) return image.url
    if (image.b64Json) return `data:image/png;base64,${image.b64Json}`
    return ''
  }

  const handleDownload = async (image: GeneratedImage, index: number) => {
    const src = getImageSrc(image)
    if (!src) return

    await handleMutation(
      async () => {
        const response = await fetch(src)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `generated-image-${index + 1}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },
      { label: 'Artifact Download', successToast: 'Image downloaded' },
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-nd-bg p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b-2 border-nd-ink pb-6 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-nd-accent" />
          <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight">
            Image Generation
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <Card className="bg-nd-surface border-2 border-nd-ink shadow-stamp h-fit">
            <CardHeader className="bg-nd-surface-alt border-b-2 border-nd-ink py-4">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-nd-ink">
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted">
                    Size
                  </Label>
                  <Select value={size} onValueChange={setSize} disabled={isLoading}>
                    <SelectTrigger className="w-full h-10 border border-nd-border bg-nd-bg px-3 text-nd-ink focus:ring-nd-accent font-sans text-xs">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-nd-ink">
                      {SIZES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs font-mono">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="image-count"
                    className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted"
                  >
                    Count
                  </Label>
                  <Input
                    id="image-count"
                    type="number"
                    value={numberOfImages}
                    onChange={(e) =>
                      setNumberOfImages(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))
                    }
                    min={1}
                    max={4}
                    disabled={isLoading}
                    className="w-full h-10 border border-nd-border bg-nd-bg px-3 text-nd-ink focus-visible:ring-nd-accent font-mono text-xs shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="prompt"
                  className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-ink-muted"
                >
                  Prompt
                </Label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  className="w-full border border-nd-border bg-nd-bg px-4 py-3 text-sm text-nd-ink focus:outline-none focus:border-nd-accent focus:ring-1 focus:ring-nd-accent resize-none font-serif shadow-inner"
                  placeholder="Describe the image you want to generate..."
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full h-12 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif font-bold tracking-widest uppercase transition-all border-2 border-nd-ink flex items-center justify-center gap-3 shadow-stamp-accent"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  'Generate Result'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <div className="lg:col-span-2 bg-nd-surface border-2 border-nd-ink p-8 shadow-stamp">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-accent mb-6">
              Generated Artifacts
            </h2>

            {mutationError && (
              <Alert
                variant="destructive"
                className="border-2 border-nd-flag-red bg-nd-flag-red/5 mb-6"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                <AlertDescription className="font-mono text-sm">
                  <strong>Error:</strong> {mutationError}
                </AlertDescription>
              </Alert>
            )}

            {images.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="p-2 border border-nd-border bg-nd-surface-alt shadow-sm">
                        <img
                          src={getImageSrc(image)}
                          alt={`Generated image ${index + 1}`}
                          className="w-full mix-blend-multiply"
                        />
                      </div>
                      <Button
                        onClick={() => handleDownload(image, index)}
                        size="icon"
                        className="absolute top-4 right-4 bg-nd-ink hover:bg-nd-accent shadow-md opacity-0 group-hover:opacity-100 transition-all text-nd-bg"
                        title="Download image"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      {image.revisedPrompt && (
                        <p className="mt-4 text-xs font-serif text-nd-ink-muted italic border-l-2 border-nd-accent pl-3">
                          Revised: {image.revisedPrompt}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : !mutationError && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-nd-ink-muted border-2 border-dashed border-nd-border bg-nd-surface-alt m-4">
                <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-mono text-xs uppercase tracking-widest text-center px-4">
                  Enter a prompt and click generate
                  <br />
                  to create an artifact.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authed/ai/image')({
  component: ImagePage,
  head: () => ({
    meta: [{ title: 'AI Image — CyberGov' }],
  }),
})
