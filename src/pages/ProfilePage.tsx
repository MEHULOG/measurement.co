import { UserProfile } from '@clerk/clerk-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ProfilePage() {
  const { user } = useCurrentUser()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information and security.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace details</CardTitle>
          <CardDescription>
            Information from your Convex user record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{user.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <Badge
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                  >
                    {user.role}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Joined</dt>
                <dd className="font-medium">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Powered by Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <UserProfile routing="hash" />
        </CardContent>
      </Card>
    </div>
  )
}
