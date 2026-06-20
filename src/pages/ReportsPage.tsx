import { useMemo, useState } from 'react'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { exportToExcel, exportToPdf } from '@/services/exports'
import { formatDateShort } from '@/lib/utils'

type Range = 'daily' | 'weekly' | 'monthly' | 'custom'

function rangeBounds(range: Range, customStart?: string, customEnd?: string) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setHours(0, 0, 0, 0)

  if (range === 'daily') {
    // already start of day → end of day
  } else if (range === 'weekly') {
    start.setDate(end.getDate() - 6)
  } else if (range === 'monthly') {
    start.setDate(end.getDate() - 29)
  } else if (range === 'custom') {
    if (customStart) start.setTime(new Date(customStart).getTime())
    if (customEnd) {
      const d = new Date(customEnd)
      d.setHours(23, 59, 59, 999)
      end.setTime(d.getTime())
    }
  }
  return { startDate: start.getTime(), endDate: end.getTime() }
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('weekly')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const { startDate, endDate } = useMemo(
    () => rangeBounds(range, customStart, customEnd),
    [range, customStart, customEnd],
  )

  const { isAuthenticated } = useConvexAuth()
  const report = useQuery(
    api.reports.range,
    isAuthenticated ? { startDate, endDate } : 'skip',
  )

  const title = `${range[0].toUpperCase()}${range.slice(1)} report — ${formatDateShort(startDate)} → ${formatDateShort(endDate)}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate daily, weekly, monthly, or custom reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Range</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">Last 7 days</SelectItem>
                <SelectItem value="monthly">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {range === 'custom' && (
              <>
                <input
                  type="date"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </>
            )}
            <div className="flex justify-end gap-2 sm:col-span-1 sm:ml-auto">
              <Button
                variant="outline"
                onClick={() => report && exportToPdf(report.rows, title)}
                disabled={!report || report.rows.length === 0}
              >
                <FileText className="h-4 w-4" /> PDF
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (report) await exportToExcel(report.rows, title)
                }}
                disabled={!report || report.rows.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total in range</CardTitle>
          </CardHeader>
          <CardContent>
            {!report ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{report.total}</div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daily trend</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {!report ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.series}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    allowDecimals={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Download className="mr-2 inline h-4 w-4" />
            Records ({report?.rows.length ?? '…'})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Dimensions</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {!report ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3" colSpan={6}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : report.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No measurements in this range.
                    </td>
                  </tr>
                ) : (
                  report.rows.map((m) => (
                    <tr key={m._id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{m.code}</td>
                      <td className="px-4 py-3">{m.customerName}</td>
                      <td className="px-4 py-3">{m.productType}</td>
                      <td className="px-4 py-3">
                        {m.length} × {m.width} × {m.height} {m.unit}
                      </td>
                      <td className="px-4 py-3">{m.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateShort(m.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
