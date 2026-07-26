import { create } from "zustand"
import { WS_BASE } from "@/lib/constants"
import type { Message } from "@/types"

interface SocketState {
  socket: WebSocket | null
  isConnected: boolean
  typingUsers: Record<number, Set<number>> // conversation_id -> Set of user_ids typing
  connect: (userId: number) => void
  disconnect: () => void
  sendTyping: (conversationId: number, recipientId: number, isTyping: boolean) => void
  onMessageReceived?: (message: Message) => void
  onStatusUpdated?: (payload: { conversation_id: number; message_ids: number[]; status: string }) => void
  setOnMessageReceived: (cb: (message: Message) => void) => void
  setOnStatusUpdated: (cb: (payload: { conversation_id: number; message_ids: number[]; status: string }) => void) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  typingUsers: {},

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
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (get().socket === null) {
          get().connect(userId)
        }
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const { type, payload } = data

        if (type === "new_message") {
          const { onMessageReceived } = get()
          if (onMessageReceived) {
            onMessageReceived(payload)
          }
        } else if (type === "message_status") {
          const { onStatusUpdated } = get()
          if (onStatusUpdated) {
            onStatusUpdated(payload)
          }
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

  setOnMessageReceived: (cb) => set({ onMessageReceived: cb }),
  setOnStatusUpdated: (cb) => set({ onStatusUpdated: cb }),
}))
