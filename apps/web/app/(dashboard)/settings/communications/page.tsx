'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, Button, Input } from '@massage/ui';
import { ArrowLeft, Check, X, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import {
  useCommunicationSettings,
  useUpdateCommunicationSettings,
  useTestProviderConnection,
} from '@/lib/hooks';
import { useBusinessId } from '@/lib/hooks/use-business-id';

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>{title}</h2>
      <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>{description}</p>
    </div>
  );
}

function CommunicationSettingsPageContent() {
  const businessId = useBusinessId() ?? '';

  const { data: settings, isLoading } = useCommunicationSettings(businessId);
  const updateSettingsMutation = useUpdateCommunicationSettings(businessId);
  const testConnectionMutation = useTestProviderConnection(businessId);

  const [formData, setFormData] = useState({
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    sendGridApiKey: '',
    sendGridFromEmail: '',
    sendGridFromName: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
  });

  const [saved, setSaved] = useState(false);

  const [testResults, setTestResults] = useState<{
    twilio?: { success: boolean; message: string };
    sendgrid?: { success: boolean; message: string };
    whatsapp?: { success: boolean; message: string };
  }>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        twilioAccountSid: settings.twilioAccountSid || '',
        twilioAuthToken: settings.twilioAuthToken || '',
        twilioPhoneNumber: settings.twilioPhoneNumber || '',
        sendGridApiKey: settings.sendGridApiKey || '',
        sendGridFromEmail: settings.sendGridFromEmail || '',
        sendGridFromName: settings.sendGridFromName || '',
        whatsappPhoneNumberId: settings.whatsappPhoneNumberId || '',
        whatsappAccessToken: settings.whatsappAccessToken || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettingsMutation.mutateAsync(formData as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async (provider: 'twilio' | 'sendgrid' | 'whatsapp') => {
    try {
      const result = await testConnectionMutation.mutateAsync(provider);
      setTestResults({ ...testResults, [provider]: result });
    } catch {
      setTestResults({
        ...testResults,
        [provider]: { success: false, message: 'Connection failed' },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <Link href="/settings" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Tools</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Communications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            Configure Twilio, SendGrid, and WhatsApp API credentials.
          </p>
        </div>
      </div>

      {/* Info callout */}
      <div
        className="flex items-start gap-2.5 rounded-xl p-3.5"
        style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
      >
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
        <p className="text-xs" style={{ color: '#5D4AA8' }}>
          To toggle email, SMS, or WhatsApp on or off, go to{' '}
          <Link href="/settings" className="underline font-medium">Settings → Notifications</Link>.
          This page is for API credentials only.
        </p>
      </div>

      {/* Twilio SMS */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHeader title="Twilio SMS" description="SMS credentials for sending appointment reminders." />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Account SID</label>
            <Input
              value={formData.twilioAccountSid}
              onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Auth Token</label>
            <Input
              type="password"
              value={formData.twilioAuthToken}
              onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
              placeholder="Your Twilio auth token"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Phone Number</label>
            <Input
              value={formData.twilioPhoneNumber}
              onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('twilio')}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </Button>
            {testResults.twilio && (
              <span className="flex items-center gap-1 text-sm">
                {testResults.twilio.success ? (
                  <><Check className="h-4 w-4 text-green-600" /><span className="text-green-600">Connected</span></>
                ) : (
                  <><X className="h-4 w-4 text-red-600" /><span className="text-red-600">Failed</span></>
                )}
              </span>
            )}
            {testResults.twilio?.message && (
              <span className="text-sm text-muted-foreground">{testResults.twilio.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SendGrid Email */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHeader title="SendGrid Email" description="Email credentials for sending confirmations and reminders." />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>API Key</label>
            <Input
              type="password"
              value={formData.sendGridApiKey}
              onChange={(e) => setFormData({ ...formData, sendGridApiKey: e.target.value })}
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>From Email</label>
            <Input
              type="email"
              value={formData.sendGridFromEmail}
              onChange={(e) => setFormData({ ...formData, sendGridFromEmail: e.target.value })}
              placeholder="noreply@yourbusiness.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>From Name</label>
            <Input
              value={formData.sendGridFromName}
              onChange={(e) => setFormData({ ...formData, sendGridFromName: e.target.value })}
              placeholder="Your Business Name"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('sendgrid')}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </Button>
            {testResults.sendgrid && (
              <span className="flex items-center gap-1 text-sm">
                {testResults.sendgrid.success ? (
                  <><Check className="h-4 w-4 text-green-600" /><span className="text-green-600">Connected</span></>
                ) : (
                  <><X className="h-4 w-4 text-red-600" /><span className="text-red-600">Failed</span></>
                )}
              </span>
            )}
            {testResults.sendgrid?.message && (
              <span className="text-sm text-muted-foreground">{testResults.sendgrid.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <SectionHeader title="WhatsApp Business API" description="WhatsApp credentials for messaging clients." />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Phone Number ID</label>
            <Input
              value={formData.whatsappPhoneNumberId}
              onChange={(e) => setFormData({ ...formData, whatsappPhoneNumberId: e.target.value })}
              placeholder="Your WhatsApp phone number ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3D3450' }}>Access Token</label>
            <Input
              type="password"
              value={formData.whatsappAccessToken}
              onChange={(e) => setFormData({ ...formData, whatsappAccessToken: e.target.value })}
              placeholder="Your WhatsApp access token"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection('whatsapp')}
              disabled={testConnectionMutation.isPending}
            >
              {testConnectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </Button>
            {testResults.whatsapp && (
              <span className="flex items-center gap-1 text-sm">
                {testResults.whatsapp.success ? (
                  <><Check className="h-4 w-4 text-green-600" /><span className="text-green-600">Connected</span></>
                ) : (
                  <><X className="h-4 w-4 text-red-600" /><span className="text-red-600">Failed</span></>
                )}
              </span>
            )}
            {testResults.whatsapp?.message && (
              <span className="text-sm text-muted-foreground">{testResults.whatsapp.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
          ) : saved ? (
            <><Check className="h-4 w-4 mr-2" />Saved</>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}

export default function CommunicationSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />Loading…
      </div>
    }>
      <CommunicationSettingsPageContent />
    </Suspense>
  );
}
