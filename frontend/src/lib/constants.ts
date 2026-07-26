export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export const WS_BASE = API_BASE.replace(/^http/, "ws")

// Kept server-side so swapping to real SMS later only changes the backend
export const MOCK_OTP_HINT = "123456"

export const ROUTES = {
  login: "/login",
  register: "/register",
  conversations: "/conversations",
} as const
