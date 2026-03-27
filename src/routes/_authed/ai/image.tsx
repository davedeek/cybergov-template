import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ImageIcon, Loader2, Download } from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setImages([])

    try {
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getImageSrc = (image: GeneratedImage) => {
    if (image.url) return image.url
    if (image.b64Json) return `data:image/png;base64,${image.b64Json}`
    return ''
  }

  const handleDownload = async (image: GeneratedImage, index: number) => {
    const src = getImageSrc(image)
    if (!src) return

    try {
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
    } catch (err) {
      // Failed to download image
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-nd-bg p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b-2 border-nd-ink pb-6 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-nd-accent" />
          <h1 className="text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight">Image Generation</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-none border border-nd-border bg-nd-surface px-4 py-3 text-nd-ink focus:outline-none focus:border-nd-accent font-sans"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
                  Count
                </label>
                <input
                  type="number"
                  value={numberOfImages}
                  onChange={(e) =>
                    setNumberOfImages(
                      Math.max(1, Math.min(4, parseInt(e.target.value) || 1)),
                    )
                  }
                  min={1}
                  max={4}
                  disabled={isLoading}
                  className="w-full rounded-none border border-nd-border bg-nd-surface px-4 py-3 text-nd-ink focus:outline-none focus:border-nd-accent font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-nd-ink-muted mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                rows={6}
                className="w-full rounded-none border border-nd-border bg-nd-surface px-4 py-3 text-nd-ink focus:outline-none focus:border-nd-accent resize-none font-sans"
                placeholder="Describe the image you want to generate..."
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full px-6 py-4 bg-nd-ink hover:bg-nd-ink/90 disabled:opacity-50 text-nd-bg font-serif font-bold tracking-wide uppercase rounded-none transition-colors border-2 border-nd-ink flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-2 bg-nd-surface rounded-none border-2 border-nd-ink p-8 shadow-[4px_4px_0px_#1A1A18]">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-nd-accent mb-6">
              Generated Artifacts
            </h2>

            {error && (
              <div className="p-4 bg-white border-2 border-[#C94A1E] text-[#C94A1E] font-mono text-sm mb-6">
                <strong>Error:</strong> {error}
              </div>
            )}

            {images.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="p-2 border border-[#C8C3B4] bg-[#FAF9F5] shadow-sm">
                        <img
                          src={getImageSrc(image)}
                          alt={`Generated image ${index + 1}`}
                          className="w-full rounded-none mix-blend-multiply"
                        />
                      </div>
                      <button
                        onClick={() => handleDownload(image, index)}
                        className="absolute top-4 right-4 p-2 bg-nd-ink hover:bg-nd-accent shadow-md rounded-none opacity-0 group-hover:opacity-100 transition-all text-nd-bg flex items-center justify-center"
                        title="Download image"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      {image.revisedPrompt && (
                        <p className="mt-4 text-xs font-serif text-nd-ink-muted italic border-l-2 border-nd-accent pl-3">
                          Revised: {image.revisedPrompt}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : !error && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-nd-ink-muted border-2 border-dashed border-[#C8C3B4] bg-[#FAF9F5] m-4">
                <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-mono text-xs uppercase tracking-widest text-center px-4">
                  Enter a prompt and click generate<br/>to create an artifact.
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
})
