"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import StatusDropdown, { UIStatus } from "@/components/konsul/StatusDropdown"

type Row = {
  id: string
  client: string
  date?: string
  amount?: string
  status: UIStatus
}

export function QuoteTable({
  data,
  editableStatus = true,
  onStatusChange,
}: {
  data: Row[]
  editableStatus?: boolean
  onStatusChange?: (id: string, next: UIStatus) => void
}) {
  const [rows, setRows] = useState<Row[]>(data)

  // Actualizar rows cuando cambia data
  useEffect(() => {
    setRows(data)
  }, [data])

  const setRowStatus = (id: string, next: UIStatus) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status: next } : r)))

  const badgeFor = (s: UIStatus) =>
    (s === "accepted" ? "default" : s === "rejected" ? "destructive" : "secondary") as
      | "default"
      | "destructive"
      | "secondary"

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">
              <Link href={`/quotes/${r.id}`} className="underline underline-offset-2">
                {r.id}
              </Link>
            </TableCell>
            <TableCell>{r.client}</TableCell>
            <TableCell>{r.date ?? "-"}</TableCell>
            <TableCell className="text-right">{r.amount ?? "-"}</TableCell>
            <TableCell>
              {editableStatus ? (
                <StatusDropdown
                  id={r.id}
                  value={r.status}
                  onChange={(s) => {
                    setRowStatus(r.id, s)
                    onStatusChange?.(r.id, s) // << avisa al padre (Dashboard)
                  }}
                />
              ) : (
                <Badge variant={badgeFor(r.status)}>{r.status}</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
