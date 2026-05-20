import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@massage/ui';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and practice settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>
              Configure your clinic or practice information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Manage email and SMS notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>
              Manage your subscription and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
