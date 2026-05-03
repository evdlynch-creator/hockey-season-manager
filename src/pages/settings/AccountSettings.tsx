import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Field,
  FieldLabel,
  FieldDescription,
  Button,
  toast,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@blinkdotnew/ui'
import { LogOut, Upload, X, UserCircle } from 'lucide-react'
import { blink } from '../../blink/client'
import { useState } from 'react'
import { useUpdateUser } from '../../hooks/useAuth'
import type { BlinkUser } from '@blinkdotnew/sdk'

export function AccountSettings({ user }: { user: BlinkUser | null }) {
  const updateUser = useUpdateUser()
  const [isUploading, setIsUploading] = useState(false)

  const handleLogout = async () => {
    try {
      await blink.auth.logout()
    } catch {
      toast.error('Could not log out')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    try {
      setIsUploading(true)
      const path = `avatars/${user.id}-${Date.now()}.${file.name.split('.').pop()}`
      const { publicUrl } = await blink.storage.upload(file, path)
      await updateUser.mutateAsync({ avatarUrl: publicUrl })
      toast.success('Profile picture updated')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      await updateUser.mutateAsync({ avatarUrl: null })
      toast.success('Profile picture removed')
    } catch {
      toast.error('Failed to remove profile picture')
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 rounded-[2rem]">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your personal profile and sign-in details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 p-4 rounded-[2rem] border border-border/50 bg-secondary/10">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-border shadow-lg">
                <AvatarImage src={user?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer bg-background/80 backdrop-blur-sm border border-border p-1.5 rounded-full shadow-lg hover:bg-background transition-colors">
                  <Upload className="w-4 h-4 text-foreground" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground">Profile Picture</p>
              <p className="text-xs text-muted-foreground">Upload a square image (max 2MB).</p>
              {user?.avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-1.5 rounded-full"
                  onClick={handleRemoveAvatar}
                >
                  <X className="w-3 h-3" /> Remove
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user?.email ?? ''} disabled className="rounded-full" />
              <FieldDescription>Managed by your sign-in provider.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Button variant="outline" disabled className="justify-start rounded-full">
                Change password (managed by sign-in)
              </Button>
              <FieldDescription>Use your identity provider to change your password.</FieldDescription>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out</p>
            <p className="text-xs text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="outline" className="gap-2 rounded-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}