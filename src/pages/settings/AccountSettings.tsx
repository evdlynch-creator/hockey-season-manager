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
} from '@blinkdotnew/ui'
import { LogOut } from 'lucide-react'
import { blink } from '../../blink/client'

export function AccountSettings({ email }: { email: string }) {
  const handleLogout = async () => {
    try {
      await blink.auth.logout()
    } catch {
      toast.error('Could not log out')
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your sign-in details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={email} disabled />
              <FieldDescription>Managed by your sign-in provider.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Button variant="outline" disabled className="justify-start">
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
