import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Send, Square } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useAIChat } from '@/lib/ai-chat-hook'
import type { ChatMessages } from '@/lib/ai-chat-hook'
import { Button } from '@/components/ui/button'

import './chat.css'

function InitialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-3xl mx-auto w-full">
        <h1 className="text-6xl font-serif font-black mb-6 text-nd-ink uppercase tracking-tight">
          <span className="text-nd-accent">AI</span> Chat
        </h1>
        <p className="text-nd-ink-muted mb-8 w-2/3 mx-auto text-lg font-sans">
          Ask me anything. Powered by TanStack AI with multi-provider support.
        </p>
        {children}
      </div>
    </div>
  )
}

function ChattingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-nd-surface border-t-2 border-nd-ink z-10 p-4">
      <div className="max-w-3xl mx-auto w-full">{children}</div>
    </div>
  )
}

function Messages({ messages }: { messages: ChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (!messages.length) {
    return null
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto min-h-0 bg-nd-bg"
    >
      <div className="max-w-3xl mx-auto w-full pb-8 pt-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-6 border-b border-nd-border ${
              message.role === 'assistant'
                ? 'bg-nd-surface-alt'
                : 'bg-nd-surface'
            }`}
          >
            <div className="flex items-start gap-4 w-full">
              {message.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-none border border-nd-ink bg-nd-ink mt-1 flex items-center justify-center text-sm font-bold font-mono text-nd-bg flex-shrink-0">
                  AI
                </div>
              ) : (
                <div className="w-8 h-8 rounded-none border border-nd-border bg-nd-surface-alt flex items-center justify-center text-sm font-bold font-mono text-nd-ink flex-shrink-0">
                  Y
                </div>
              )}
              <div className="flex-1 min-w-0">
                {message.parts.map((part: { type: string; content?: string }, index: number) => {
                  if (part.type === 'text' && part.content) {
                    return (
                      <div
                        className="flex-1 min-w-0 prose max-w-none prose-sm text-nd-ink font-sans"
                        key={index}
                      >
                        <Streamdown>{part.content}</Streamdown>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatPage() {
  const [input, setInput] = useState('')

  const { messages, sendMessage, isLoading, stop } = useAIChat()

  const Layout = messages.length ? ChattingLayout : InitialLayout

  return (
    <div className="relative flex flex-col h-[calc(100vh-80px)] bg-nd-surface font-sans">
      <div className="flex-1 flex flex-col min-h-0">
        <Messages messages={messages} />

        <Layout>
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center mb-4">
                <Button
                  variant="outline"
                  onClick={stop}
                  className="px-6 h-10 border-2 border-nd-accent text-nd-accent rounded-none text-xs tracking-widest uppercase font-mono transition-colors flex items-center gap-2 font-bold shadow-[2px_2px_0px_#C94A1E]"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Halt Execution
                </Button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (input.trim()) {
                  sendMessage(input)
                  setInput('')
                }
              }}
            >
              <div className="relative max-w-xl mx-auto flex items-center gap-2">
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full rounded-none border-2 border-nd-ink bg-nd-bg pl-4 pr-14 py-4 text-sm text-nd-ink font-serif font-medium placeholder:text-nd-ink-muted focus:outline-none transition-colors focus:border-nd-accent focus:bg-nd-surface resize-none overflow-hidden shadow-[4px_4px_0px_#1A1A18]"
                    rows={1}
                    style={{ minHeight: '56px', maxHeight: '200px' }}
                    disabled={isLoading}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height =
                        Math.min(target.scrollHeight, 200) + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                        e.preventDefault()
                        sendMessage(input)
                        setInput('')
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-nd-ink hover:bg-nd-accent text-nd-bg transition-colors rounded-none"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Layout>
      </div>
    </div>
  )
}


export const Route = createFileRoute('/_authed/ai/chat')({
  component: ChatPage,
})
