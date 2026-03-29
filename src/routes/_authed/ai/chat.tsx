import { useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Square } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useAIChat } from '@/lib/ai-chat-hook'
import type { ChatMessages } from '@/lib/ai-chat-hook'
import { Button } from '@/components/ui/button'
import { ChatForm } from '@/components/forms/ChatForm'

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
  const { messages, sendMessage, isLoading, stop } = useAIChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
            <ChatForm 
              onSubmit={sendMessage} 
              isLoading={isLoading} 
            />
          </div>
        </Layout>
      </div>
    </div>
  )
}


export const Route = createFileRoute('/_authed/ai/chat')({
  component: ChatPage,
})
