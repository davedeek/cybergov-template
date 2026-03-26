import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'

const chatOptions = createChatClientOptions({
  connection: fetchServerSentEvents('/api/ai/chat'),
})

export const useAIChat = () => useChat(chatOptions)

export type ChatMessages = ReturnType<typeof useChat>['messages']

