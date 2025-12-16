export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export type LoginResponse = {
  message: string
}

export type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  createdAt: string
  updatedAt: string
}

export type MeResponse = {
  user: User
}

export type RegisterResponse = {
  message: string
  data: User
}

export type LogoutResponse = {
  message: string
}

export type RefreshResponse = {
  message: string
}
