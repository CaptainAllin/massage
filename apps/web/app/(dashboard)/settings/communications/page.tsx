'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
} from '@massage/ui';
import { Check, X, Loader2 } from 'lucide-react';
import {
  useCommunicationSettings,
  useUpdateCommunicationSettings,
  useTestProviderConnection,
} from '@/lib/hooks';

function CommunicationSettingsPageContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams?.get('businessId') || '';

  const { data: settings, isLoading } = useCommunicationSettings(businessId);
  const updateSettingsMutation = useUpdateCommunicationSettings(businessId);
  const testConnectionMutation = useTestProviderConnection(businessId);

  const [formData, setFormData] = useState({
    // Twilio
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    smsEnabled: false,

    // SendGrid
    sendGridApiKey: '',
    sendGridFromEmail: '',
    sendGridFromName: '',
    emailEnabled: false,

    // WhatsApp
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappEnabled: false,

    // General
    defaultReminderHours: 24,
    autoSendReminders: false,
    emailSignature: '',
  });

  const [testResults, setTestResults] = useState<{
    twilio?: { success: boolean; message: string };
    sendgrid?: { success: boolean; message: string };
    whatsapp?: { success: boolean; message: string };
  }>({});

  // Update form when settings load
  useState(() => {
    if (settings) {
      setFormData({
        twilioAccountSid: settings.twilioAccountSid || '',
        twilioAuthToken: settings.twilioAuthToken || '',
        twilioPhoneNumber: settings.twilioPhoneNumber || '',
        smsEnabled: settings.smsEnabled,
        sendGridApiKey: settings.sendGridApiKey || '',
        sendGridFromEmail: settings.sendGridFromEmail || '',
        sendGridFromName: settings.sendGridFromName || '',
        emailEnabled: settings.emailEnabled,
        whatsappPhoneNumberId: settings.whatsappPhoneNumberId || '',
        whatsappAccessToken: settings.whatsappAccessToken || '',
        whatsappEnabled: settings.whatsappEnabled,
        defaultReminderHours: settings.defaultReminderHours,
        autoSendReminders: settings.autoSendReminders,
        emailSignature: settings.emailSignature || '',
      });
    }
  });

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync(formData);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  const handleTestConnection = async (provider: 'twilio' | 'sendgrid' | 'whatsapp') => {
    try {
      const result = await testConnectionMutation.mutateAsync(provider);
      setTestResults({ ...testResults, [provider]: result });
    } catch (error) {
      setTestResults({
        ...testResults,
        [provider]: { success: false, message: 'Connection failed' },
      });
    }
  };

  if (!businessId) {
    return <div>Please select a business first</div>;
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
          Communication Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure SMS, email, and WhatsApp providers
        </p>
      </div>

      {/* Twilio SMS Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Twilio SMS Settings</CardTitle>
          <CardDescription>
            Configure Twilio for sending SMS messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Account SID</label>
            <Input
              value={formData.twilioAccountSid}
              onChange={(e) =>
                setFormData({ ...formData, twilioAccountSid: e.target.value })
              }
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Auth Token</label>
            <Input
              type="password"
              value={formData.twilioAuthToken}
              onChange={(e) =>
                setFormData({ ...formData, twilioAuthToken: e.target.value })
              }
              placeholder="Your Twilio auth token"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <Input
              value={formData.twilioPhoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, twilioPhoneNumber: e.target.value })
              }
              placeholder="+1234567890"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smsEnabled"
                checked={formData.smsEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, smsEnabled: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="smsEnabled" className="text-sm font-medium">
                Enable SMS
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleTestConnection('twilio')}
                disabled={testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test Connection'
                )}
              </Button>
              {testResults.twilio && (
                <span className="flex items-center gap-1 text-sm">
                  {testResults.twilio.success ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Failed</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          {testResults.twilio?.message && (
            <p className="text-sm text-muted-foreground">{testResults.twilio.message}</p>
          )}
        </CardContent>
      </Card>

      {/* SendGrid Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SendGrid Email Settings</CardTitle>
          <CardDescription>
            Configure SendGrid for sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <Input
              type="password"
              value={formData.sendGridApiKey}
              onChange={(e) =>
                setFormData({ ...formData, sendGridApiKey: e.target.value })
              }
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">From Email</label>
            <Input
              type="email"
              value={formData.sendGridFromEmail}
              onChange={(e) =>
                setFormData({ ...formData, sendGridFromEmail: e.target.value })
              }
              placeholder="noreply@yourbusiness.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">From Name</label>
            <Input
              value={formData.sendGridFromName}
              onChange={(e) =>
                setFormData({ ...formData, sendGridFromName: e.target.value })
              }
              placeholder="Your Business Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email Signature</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              value={formData.emailSignature}
              onChange={(e) =>
                setFormData({ ...formData, emailSignature: e.target.value })
              }
              placeholder="Best regards,\nYour Team"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailEnabled"
                checked={formData.emailEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, emailEnabled: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="emailEnabled" className="text-sm font-medium">
                Enable Email
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleTestConnection('sendgrid')}
                disabled={testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test Connection'
                )}
              </Button>
              {testResults.sendgrid && (
                <span className="flex items-center gap-1 text-sm">
                  {testResults.sendgrid.success ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Failed</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          {testResults.sendgrid?.message && (
            <p className="text-sm text-muted-foreground">{testResults.sendgrid.message}</p>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Settings */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business API Settings</CardTitle>
          <CardDescription>
            Configure WhatsApp Business API for messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number ID</label>
            <Input
              value={formData.whatsappPhoneNumberId}
              onChange={(e) =>
                setFormData({ ...formData, whatsappPhoneNumberId: e.target.value })
              }
              placeholder="Your WhatsApp phone number ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Access Token</label>
            <Input
              type="password"
              value={formData.whatsappAccessToken}
              onChange={(e) =>
                setFormData({ ...formData, whatsappAccessToken: e.target.value })
              }
              placeholder="Your WhatsApp access token"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="whatsappEnabled"
                checked={formData.whatsappEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappEnabled: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="whatsappEnabled" className="text-sm font-medium">
                Enable WhatsApp
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleTestConnection('whatsapp')}
                disabled={testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test Connection'
                )}
              </Button>
              {testResults.whatsapp && (
                <span className="flex items-center gap-1 text-sm">
                  {testResults.whatsapp.success ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Failed</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          {testResults.whatsapp?.message && (
            <p className="text-sm text-muted-foreground">{testResults.whatsapp.message}</p>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure reminder and automation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Reminder Hours Before Appointment
            </label>
            <Input
              type="number"
              value={formData.defaultReminderHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultReminderHours: parseInt(e.target.value) || 24,
                })
              }
              min="1"
              max="168"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Send reminders this many hours before the appointment (1-168)
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoSendReminders"
              checked={formData.autoSendReminders}
              onChange={(e) =>
                setFormData({ ...formData, autoSendReminders: e.target.checked })
              }
              className="mr-2"
            />
            <label htmlFor="autoSendReminders" className="text-sm">
              Automatically send reminders for new appointments
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          size="lg"
        >
          {updateSettingsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}

export default function CommunicationSettingsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-500">Loading settings...</div>}>
      <CommunicationSettingsPageContent />
    </Suspense>
  );
}
