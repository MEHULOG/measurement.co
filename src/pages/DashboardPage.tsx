import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Ruler,
  CalendarDays,
  CalendarRange,
  Activity as ActivityIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth()
  const stats = useQuery(
    api.measurements.stats,
    isAuthenticated ? {} : 'skip',
  )
  const activities = useQuery(
    api.activities.recent,
    isAuthenticated ? { limit: 8 } : 'skip',
  )

  const cards = [
    { title: 'Total Measurements', icon: Ruler, value: stats?.total },
    { title: "Today's Measurements", icon: CalendarDays, value: stats?.today },
    { title: 'This Month', icon: CalendarRange, value: stats?.month },
    {
      title: 'Recent Activities',
      icon: ActivityIcon,
      value: activities?.length ?? 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time overview of measurement activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, icon: Icon, value }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {value === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Last 12 months</CardTitle>
            <CardDescription>Measurements created per month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!stats ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest CRUD operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!activities ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              activities.map((a) => (
                <div key={a._id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.user?.name ?? 'Unknown'} · {formatDate(a.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
