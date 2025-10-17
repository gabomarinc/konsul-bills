import { useQuery, useQueryClient } from "@tanstack/react-query"

type Invoice = {
  id: string
  client: string
  clientEmail?: string | null
  title: string
  issueDate: string
  dueDate: string | null
  currency: "EUR" | "USD"
  tax: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  createdAt: string
}

async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch("/api/invoices", {
    cache: "no-store",
    credentials: "include",
  })
  const json = await response.json()
  return json.data || []
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  })
}

export function useInvalidateInvoices() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] })
  }
}

