import { QueryClient, useQueryClient } from '@tanstack/react-query'

let client
export function getQueryClient() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryClient()
  } catch {
    if (!client) client = new QueryClient()
    return client
  }
}
