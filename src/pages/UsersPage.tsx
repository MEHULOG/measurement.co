import { useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Trash2 } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { User } from '@/types'

export default function UsersPage() {
  const { isAuthenticated } = useConvexAuth()
  const users = useQuery(api.users.list, isAuthenticated ? {} : 'skip')
  const updateRole = useMutation(api.users.updateRole)
  const remove = useMutation(api.users.remove)
  const { user: me } = useCurrentUser()
  const [removing, setRemoving] = useState<User | null>(null)

  async function setRole(u: User, role: 'admin' | 'employee') {
    try {
      await updateRole({ userId: u._id, role })
      toast.success(`${u.name} is now ${role}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update role')
    }
  }

  async function handleRemove() {
    if (!removing) return
    try {
      await remove({ userId: removing._id })
      toast.success(`Removed ${removing.name}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to remove user')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage roles and access for everyone in your workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!users &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={5} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))}
                {users?.map((u) => {
                  const isMe = u._id === me?._id
                  return (
                    <tr key={u._id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.imageUrl ? (
                            <img
                              src={u.imageUrl}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-medium">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">
                            {u.name} {isMe && <Badge variant="secondary">you</Badge>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            setRole(u, v as 'admin' | 'employee')
                          }
                          disabled={isMe}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateShort(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemoving(u)}
                          disabled={isMe}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove user?"
        description={
          removing
            ? `${removing.name} will lose access. Their measurements remain.`
            : ''
        }
        destructive
        confirmText="Remove"
        onConfirm={handleRemove}
      />
    </div>
  )
}
