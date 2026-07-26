// Shared TypeScript types mirroring the backend Pydantic schemas.
// Kept in one file until the surface grows large enough to warrant splitting.

export interface User {
  id: number
  username: string
  display_name: string
  avatar_url: string | null
  about: string | null
  is_online: boolean
  last_seen: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

// Conversation and message types — stubs used by Phase 2/3.
// Defined here so imports don't need to change when the bodies are filled in.
export interface Conversation {
  id: number
  type: "direct" | "group"
  name: string | null
  avatar_url: string | null
  created_by: number
  disappearing_timer: number | null
  created_at: string
  updated_at: string
  // Joined fields returned by the API
  last_message: Message | null
  unread_count: number
  participants: User[]
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  body: string
  reply_to_id: number | null
  disappears_at: string | null
  edited_at: string | null
  created_at: string
  status: "sending" | "sent" | "delivered" | "read"
  reactions: Reaction[]
  attachments: Attachment[]
}

export interface Reaction {
  id: number
  message_id: number
  user_id: number
  emoji: string
  created_at: string
}

export interface Attachment {
  id: number
  message_id: number
  file_url: string
  file_name: string
  mime_type: string
  size_bytes: number
  created_at: string
}
