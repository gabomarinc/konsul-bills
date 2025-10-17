import { Card } from "@/components/ui/card"

export function StatCard({
  title,
  value,
  hint,
}: {
  title: string
  value: string | number
  hint?: string
}) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint ? <div className="text-xs text-slate-400 mt-1">{hint}</div> : null}
    </Card>
  )
}
