import { useState } from 'react'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareToken: string | null
  onRegenerate: () => Promise<void>
  isRegenerating?: boolean
}

export function ShareDialog({
  open,
  onOpenChange,
  shareToken,
  onRegenerate,
  isRegenerating,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`
    : null

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-2 border-nd-ink rounded-none bg-nd-surface p-0 overflow-hidden shadow-[8px_8px_0px_rgba(26,26,24,0.1)]">
        <div className="p-6">
          <h3 className="text-lg font-serif font-bold text-nd-ink mb-1">Share This Chart</h3>
          <p className="text-xs font-mono text-nd-ink-muted mb-6">
            Anyone with this link can view the chart (read-only). They do not need an account.
          </p>

          {shareUrl ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-nd-bg border border-nd-border p-2.5 font-mono text-xs text-nd-ink break-all select-all">
                  {shareUrl}
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="rounded-none border-2 border-nd-ink shrink-0 px-4"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-nd-border">
                <span className="text-[10px] font-mono text-nd-ink-muted uppercase tracking-widest">
                  Need a new link?
                </span>
                <Button
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  variant="outline"
                  className="rounded-none border border-nd-border text-xs font-mono hover:border-nd-accent hover:text-nd-accent"
                >
                  <RefreshCw className={`w-3 h-3 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate Link'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-nd-border bg-nd-surface-alt font-mono text-sm text-nd-ink-muted">
              No share token available. Try regenerating.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
