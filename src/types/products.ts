export type Product = {
  id: number
  name: string
  price: number
  description: string | null
  createdAt: string
  updatedAt: string
}

export type ProductPayload = {
  name: string
  price: number
  description: string | null
}
