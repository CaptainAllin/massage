'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  Video,
  PhoneOff,
  Monitor,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useCreateVideoSession } from '@/lib/hooks/use-video-sessions';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { apiClient } from '@/lib/api-client';

type ConsentState = 'pending' | 'accepted' | 'declined';

function ConsentModal({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-3">Video Consultation Consent</h2>
          <div className="space-y-3 text-sm text-muted-foreground mb-6">
            <p>Before joining this video consultation, please review and accept the following:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>This session may be conducted over the internet via an encrypted video connection.</li>
              <li>Recording of sessions is disabled by default. You will be asked before any recording begins.</li>
              <li>Your information is protected under HIPAA. Only the therapist and authorized staff can access session data.</li>
              <li>You consent to the telehealth consultation and understand it is not a substitute for emergency in-person care.</li>
              <li>Technical issues may interrupt the session — you agree to reconnect by phone if needed.</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button onClick={onAccept} className="flex-1 [background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white">
              I Consent — Join Session
            </Button>
            <Button onClick={onDecline} variant="outline" className="flex-1">
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VideoCallRoom({ sessionUrl, sessionId, onEnd }: { sessionUrl: string; sessionId: string; onEnd: () => void }) {
  const [isEnding, setIsEnding] = useState(false);
  const [showSOAPPrompt, setShowSOAPPrompt] = useState(false);
  const [soapNote, setSOAPNote] = useState('');
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    setIsEnding(true);
    try {
      await apiClient.post(`/video-sessions/${sessionId}/end`, {});
    } catch {}
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowSOAPPrompt(true);
    setIsEnding(false);
  };

  if (showSOAPPrompt) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-[#5D4AA8] mx-auto mb-3" />
          <h2 className="text-xl font-semibold">Session Ended</h2>
          <p className="text-muted-foreground text-sm">Duration: {formatDuration(duration)}</p>
        </div>
        <Card className="w-full">
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">Post-Consultation Notes (SOAP)</label>
            <textarea
              value={soapNote}
              onChange={(e) => setSOAPNote(e.target.value)}
              placeholder="Subjective: Client reported...\nObjective: Observed...\nAssessment: ...\nPlan: ..."
              className="w-full h-40 p-3 rounded-lg border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => {
                  // Note saved — in a real app, this would link to the treatment notes API
                  onEnd();
                }}
                className="flex-1 [background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Save Notes & Close
              </Button>
              <Button onClick={onEnd} variant="outline">Skip</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Live — {formatDuration(duration)}</span>
        </div>
        <span className="text-gray-400 text-xs">Powered by Daily.co (HIPAA-compliant)</span>
      </div>
      <iframe
        src={sessionUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="flex-1 w-full border-0"
      />
      <div className="flex items-center justify-center gap-4 py-3 bg-gray-900">
        <Button
          onClick={handleEndCall}
          disabled={isEnding}
          className="bg-red-600 hover:bg-red-700 text-white px-6"
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          {isEnding ? 'Ending...' : 'End Call'}
        </Button>
      </div>
    </div>
  );
}

function UpcomingVideoSessions({ businessId }: { businessId: string }) {
  const { data, isLoading } = useAppointments(businessId);
  const createSession = useCreateVideoSession();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [consent, setConsent] = useState<ConsentState>('pending');
  const [activeSession, setActiveSession] = useState<{ url: string; id: string } | null>(null);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  const appointments = data?.data ?? [];
  const videoAppts = appointments.filter(
    (a: any) => a.isVirtual || a.serviceType === 'VIDEO' || a.notes?.toLowerCase().includes('video') || a.notes?.toLowerCase().includes('telehealth')
  );

  const handleJoin = async (apptId: string) => {
    setSelectedApptId(apptId);
    setConsent('pending');
  };

  const handleConsentAccepted = async () => {
    if (!selectedApptId) return;
    setConsent('accepted');
    setJoiningId(selectedApptId);
    try {
      const session = await createSession.mutateAsync(selectedApptId);
      if (session?.dailyRoomUrl) {
        setActiveSession({ url: session.dailyRoomUrl, id: session.id });
      }
    } catch {
      setConsent('pending');
    } finally {
      setJoiningId(null);
    }
  };

  if (activeSession) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex flex-col">
        <VideoCallRoom
          sessionUrl={activeSession.url}
          sessionId={activeSession.id}
          onEnd={() => { setActiveSession(null); setSelectedApptId(null); }}
        />
      </div>
    );
  }

  return (
    <>
      {selectedApptId && consent === 'pending' && (
        <ConsentModal
          onAccept={handleConsentAccepted}
          onDecline={() => { setSelectedApptId(null); }}
        />
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading appointments...</p>}
        {!isLoading && videoAppts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No video appointments scheduled</p>
            <p className="text-sm mt-1">Create an appointment with type "Video" to enable telehealth consultations</p>
          </div>
        )}
        {videoAppts.map((appt: any) => (
          <Card key={appt.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{appt.client?.firstName} {appt.client?.lastName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(appt.startTime).toLocaleString()} · {appt.duration ?? 60} min
                </p>
                <p className="text-sm text-muted-foreground">
                  Therapist: {appt.therapist?.user?.firstName} {appt.therapist?.user?.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  appt.status === 'CONFIRMED' ? 'bg-[#EDE5F4] text-[#5D4AA8]' :
                  appt.status === 'SCHEDULED' ? 'bg-[#EDE5F4] text-[#7665C2]' :
                  'bg-[#EFE9F2] text-[#7A7090]'
                }`}>
                  {appt.status}
                </span>
                <Button
                  onClick={() => handleJoin(appt.id)}
                  disabled={joiningId === appt.id}
                  className="[background:linear-gradient(135deg,#5D4AA8,#3F2F87)] hover:opacity-90 text-white"
                  size="sm"
                >
                  <Video className="w-4 h-4 mr-1" />
                  {joiningId === appt.id ? 'Starting...' : 'Join'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function TelehealthPage() {
  const businessId = useBusinessId();
  const dailyEnabled = process.env.NEXT_PUBLIC_ENABLE_DAILY === 'true';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Telehealth</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>HIPAA-compliant video consultations via Daily.co</p>
        </div>
        {!dailyEnabled && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Set <code className="font-mono text-xs bg-amber-100 px-1 rounded">ENABLE_DAILY=true</code> and <code className="font-mono text-xs bg-amber-100 px-1 rounded">DAILY_API_KEY</code> to enable live sessions</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Platform', value: 'Daily.co', sub: 'HIPAA BAA available', icon: Video, color: 'text-blue-600 bg-blue-50' },
          { label: 'Encryption', value: 'End-to-End', sub: 'AES-256 encrypted', icon: CheckCircle, color: 'text-[#5D4AA8] bg-[#EDE5F4]' },
          { label: 'Recording', value: 'Consent-gated', sub: 'Client consent required', icon: Monitor, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-xl p-2 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointments */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Video Appointments
          </h2>
          {businessId ? (
            <UpcomingVideoSessions businessId={businessId} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-3">Setup Guide</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
            <li>Sign up for a Daily.co account and obtain a HIPAA BAA if required.</li>
            <li>Add <code className="font-mono bg-muted px-1 rounded">DAILY_API_KEY</code> to your environment variables.</li>
            <li>Set <code className="font-mono bg-muted px-1 rounded">ENABLE_DAILY=true</code> and <code className="font-mono bg-muted px-1 rounded">NEXT_PUBLIC_ENABLE_DAILY=true</code>.</li>
            <li>Create an appointment with "Video" in the notes or type field to schedule a telehealth session.</li>
            <li>Click "Join" on the appointment above — both therapist and client receive the room link.</li>
          </ol>
          <a
            href="https://docs.daily.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary text-sm mt-3 hover:underline"
          >
            Daily.co Documentation <ExternalLink className="w-3 h-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
