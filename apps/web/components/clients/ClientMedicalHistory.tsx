'use client';

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal, Input, Textarea, Select } from '@massage/ui';
import { useMedicalConditions, useCreateMedicalCondition, useUpdateMedicalCondition } from '@/lib/hooks';
import { MedicalCondition, MedicalConditionStatus, MedicalConditionSeverity } from '@massage/types';

export interface ClientMedicalHistoryProps {
  clientId: string;
  businessId: string;
}

export const ClientMedicalHistory: React.FC<ClientMedicalHistoryProps> = ({
  clientId,
  businessId,
}) => {
  const { data: conditionsData } = useMedicalConditions(businessId, { clientId });
  const createCondition = useCreateMedicalCondition(businessId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    diagnosisDate: '',
    status: 'active',
    severity: '',
    notes: '',
    treatmentPlan: '',
  });

  const conditions = conditionsData?.data || [];

  const handleAdd = async () => {
    await createCondition.mutateAsync({
      clientId,
      ...formData,
    });
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      diagnosisDate: '',
      status: 'active',
      severity: '',
      notes: '',
      treatmentPlan: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      active: 'warning',
      resolved: 'success',
      managed: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medical History</h3>
        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          Add Condition
        </Button>
      </div>

      <div className="space-y-3">
        {conditions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No medical conditions recorded.
            </CardContent>
          </Card>
        ) : (
          conditions.map((condition: MedicalCondition) => (
            <Card key={condition.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{condition.name}</h4>
                      {getStatusBadge(condition.status)}
                      {condition.severity && (
                        <Badge variant="default">{condition.severity}</Badge>
                      )}
                    </div>

                    {condition.diagnosisDate && (
                      <p className="text-sm text-gray-600 mt-1">
                        Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}
                      </p>
                    )}

                    {condition.notes && (
                      <p className="text-sm text-gray-700 mt-2">{condition.notes}</p>
                    )}

                    {condition.treatmentPlan && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600">Treatment Plan:</p>
                        <p className="text-sm text-gray-700">{condition.treatmentPlan}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Condition Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Medical Condition"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chronic lower back pain"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis Date
            </label>
            <Input
              type="date"
              value={formData.diagnosisDate}
              onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'managed', label: 'Managed' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <Select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                options={[
                  { value: '', label: 'Not specified' },
                  { value: 'mild', label: 'Mild' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'severe', label: 'Severe' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about the condition..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treatment Plan
            </label>
            <Textarea
              value={formData.treatmentPlan}
              onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
              placeholder="Recommended treatment approach..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              isLoading={createCondition.isPending}
              disabled={!formData.name}
            >
              Add Condition
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
