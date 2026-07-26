import { z } from "zod"

export const loginSchema = z.object({
  username: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(30, "Max 30 characters")
      .regex(/^[a-z0-9_.]+$/, "Only lowercase letters, numbers, underscores and dots"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
    otp: z.string().length(6, "Must be exactly 6 digits").regex(/^\d+$/, "Digits only"),
    display_name: z
      .string()
      .min(1, "Required")
      .max(50, "Max 50 characters")
      .transform((v) => v.trim()),
    avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
