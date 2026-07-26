import { redirect } from "next/navigation"

// The root URL serves no UI — redirect based on auth state is handled
// client-side in AuthProvider. This is a fallback for direct navigation.
export default function Home() {
  redirect("/conversations")
}
