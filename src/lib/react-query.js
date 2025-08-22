import { QueryClient, useQueryClient } from '@tanstack/react-query'

let client
export function getQueryClient() {
  try {
    return useQueryClient()
  } catch {
    if (!client) client = new QueryClient()
    return client
  }
}
