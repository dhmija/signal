import { z } from "zod"
import { MOCK_OTP_HINT } from "@/lib/constants"

export const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, "Please choose a username.")
      .min(3, "Username must be at least 3 characters.")
      .max(30, "Username cannot exceed 30 characters.")
      .regex(/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, underscores, and dots."),
    password: z
      .string()
      .min(1, "Please enter a password.")
      .min(8, "Password must contain at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    otp: z
      .string()
      .min(1, "Verification code is required.")
      .length(6, "Verification code must be 6 digits.")
      .regex(/^\d+$/, "Verification code must contain digits only.")
      .refine((val): val is string => val === MOCK_OTP_HINT, {
        message: "Invalid verification code.",
      }),
    display_name: z
      .string()
      .min(1, "Please enter your display name.")
      .max(50, "Display name cannot exceed 50 characters.")
      .transform((v) => v.trim()),
    avatar_url: z.string().url("Please enter a valid image URL.").optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z
  .object({
    username: z.string().min(1, "Please enter your username."),
    otp: z
      .string()
      .min(1, "Verification code is required.")
      .length(6, "Verification code must be 6 digits.")
      .regex(/^\d+$/, "Verification code must contain digits only.")
      .refine((val): val is string => val === MOCK_OTP_HINT, {
        message: "Invalid verification code.",
      }),
    newPassword: z
      .string()
      .min(1, "Please enter a new password.")
      .min(8, "Password must contain at least 8 characters."),
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
