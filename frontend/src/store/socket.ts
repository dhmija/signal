import { create } from "zustand"
import { WS_BASE } from "@/lib/constants"
import type { Message } from "@/types"

type Listener<T> = (data: T) => void

interface SocketState {
  socket: WebSocket | null
  isConnected: boolean
  typingUsers: Record<number, Set<number>>
  connect: (userId: number) => void
  disconnect: () => void
  sendTyping: (conversationId: number, recipientId: number, isTyping: boolean) => void
  
  // Multi-listener sets
  messageReceivedListeners: Set<Listener<Message>>
  statusUpdatedListeners: Set<Listener<{ conversation_id: number; message_ids: number[]; status: string }>>
  reactionUpdatedListeners: Set<Listener<{ conversation_id: number; message_id: number; updated_message: Message }>>
  
  subscribeMessageReceived: (cb: Listener<Message>) => () => void
  subscribeStatusUpdated: (cb: Listener<{ conversation_id: number; message_ids: number[]; status: string }>) => () => void
  subscribeReactionUpdated: (cb: Listener<{ conversation_id: number; message_id: number; updated_message: Message }>) => () => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  typingUsers: {},

  messageReceivedListeners: new Set(),
  statusUpdatedListeners: new Set(),
  reactionUpdatedListeners: new Set(),

  connect: (userId: number) => {
    const existingSocket = get().socket
    if (existingSocket && (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)) {
      return
    }

    const wsUrl = `${WS_BASE}/ws/${userId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      set({ isConnected: true })
    }

    ws.onclose = () => {
      set({ isConnected: false, socket: null })
      setTimeout(() => {
        if (get().socket === null) {
          get().connect(userId)
        }
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        const { type, payload } = data

        if (type === "new_message") {
          get().messageReceivedListeners.forEach((cb) => cb(payload))
        } else if (type === "message_status") {
          get().statusUpdatedListeners.forEach((cb) => cb(payload))
        } else if (type === "reaction") {
          get().reactionUpdatedListeners.forEach((cb) => cb(payload))
        } else if (type === "typing_start" || type === "typing_stop") {
          const { conversation_id, user_id } = payload
          set((state) => {
            const currentSet = new Set(state.typingUsers[conversation_id] || [])
            if (type === "typing_start") {
              currentSet.add(user_id)
            } else {
              currentSet.delete(user_id)
            }
            return {
              typingUsers: {
                ...state.typingUsers,
                [conversation_id]: currentSet,
              },
            }
          })
        }
      } catch (e) {
        console.error("Error parsing WebSocket event:", e)
      }
    }

    set({ socket: ws })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null, isConnected: false })
    }
  },

  sendTyping: (conversationId: number, recipientId: number, isTyping: boolean) => {
    const { socket, isConnected } = get()
    if (socket && isConnected) {
      socket.send(
        JSON.stringify({
          type: isTyping ? "typing_start" : "typing_stop",
          payload: { conversation_id: conversationId, recipient_id: recipientId },
        })
      )
    }
  },

  subscribeMessageReceived: (cb) => {
    const listeners = get().messageReceivedListeners
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },

  subscribeStatusUpdated: (cb) => {
    const listeners = get().statusUpdatedListeners
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },

  subscribeReactionUpdated: (cb) => {
    const listeners = get().reactionUpdatedListeners
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },
}))
