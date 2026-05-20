'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, Tab, Card, CardContent, Skeleton } from '@massage/ui';
import { useClient } from '@/lib/hooks';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { ClientStats } from '@/components/clients/ClientStats';
import { ClientMedicalHistory } from '@/components/clients/ClientMedicalHistory';

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  const businessId = 'temp-business-id'; // TODO: Get from auth context

  const { data: client, isLoading } = useClient(clientId, businessId);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={120} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found</p>
      </div>
    );
  }

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'medical', label: 'Medical History' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'forms', label: 'Intake Forms' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-6">
      <ClientHeader client={client} />

      <div className="px-6">
        <ClientStats client={client} />
      </div>

      <div className="px-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <InfoRow label="Email" value={client.email || '-'} />
                    <InfoRow label="Phone" value={client.phoneNumber || '-'} />
                    <InfoRow
                      label="Address"
                      value={
                        client.address
                          ? `${client.address}, ${client.city}, ${client.state} ${client.postalCode}`
                          : '-'
                      }
                    />
                    <InfoRow label="Occupation" value={client.occupation || '-'} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                  <div className="space-y-3">
                    <InfoRow label="Name" value={client.emergencyContactName || '-'} />
                    <InfoRow label="Phone" value={client.emergencyContactPhone || '-'} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Insurance Information</h3>
                  <div className="space-y-3">
                    <InfoRow label="Provider" value={client.insuranceProvider || '-'} />
                    <InfoRow label="Policy Number" value={client.insurancePolicyNumber || '-'} />
                    <InfoRow label="Primary Physician" value={client.primaryPhysician || '-'} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Wellness Goals</h3>
                  <p className="text-gray-700">{client.goals || 'No goals specified'}</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Medications & Allergies</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                      {client.medications && client.medications.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {client.medications.map((med, idx) => (
                            <li key={idx} className="text-gray-600">
                              {med}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">None recorded</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies</h4>
                      {client.allergies && client.allergies.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {client.allergies.map((allergy, idx) => (
                            <li key={idx} className="text-gray-600">
                              {allergy}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">None recorded</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'medical' && (
            <ClientMedicalHistory clientId={clientId} businessId={businessId} />
          )}

          {activeTab === 'timeline' && (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Timeline feature coming soon
              </CardContent>
            </Card>
          )}

          {activeTab === 'forms' && (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Intake forms feature coming soon
              </CardContent>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Notes feature coming soon
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
