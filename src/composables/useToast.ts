import { toast } from 'vue3-toastify'

export function useToast() {
  const success = (message: string) => {
    toast.success(message)
  }

  const toastError = (message: string) => {
    toast.error(message)
  }

  return { success, toastError }
}

