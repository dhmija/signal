import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/RegisterForm"

export const metadata: Metadata = {
  title: "Create account — Signal",
}

export default function RegisterPage() {
  return <RegisterForm />
}
