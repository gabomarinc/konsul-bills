import { useQuery, useQueryClient } from "@tanstack/react-query"

type Quote = {
  id: string
  client: string
  clientEmail?: string | null
  title: string
  issueDate: string
  dueDate: string | null
  currency: "EUR" | "USD"
  tax: number
  total: number
  status: "draft" | "sent" | "accepted" | "rejected"
  createdAt: string
}

async function fetchQuotes(): Promise<Quote[]> {
  const response = await fetch("/api/quotes", {
    cache: "no-store",
    credentials: "include",
  })
  const json = await response.json()
  return json.data || []
}

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes,
  })
}

export function useInvalidateQuotes() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ["quotes"] })
  }
}

