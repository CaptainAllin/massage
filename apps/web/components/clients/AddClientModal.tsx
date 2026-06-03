'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, DatePicker, Textarea } from '@massage/ui';
import { useCreateClient } from '@/lib/hooks';
import { useBusiness } from '@/lib/hooks/use-business';
import { getCountryFormat } from '@/lib/countryFormats';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { PostcodeInput } from '@/components/ui/PostcodeInput';

export interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string | undefined;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  occupation: '',
  primaryPhysician: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  goals: '',
  healthNotes: '',
};

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  businessId,
}) => {
  const createClient = useCreateClient(businessId);
  const { data: business } = useBusiness(businessId);
  const countryCode = business?.country || 'AU';
  const countryFmt = getCountryFormat(countryCode);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { healthNotes, ...rest } = formData;
      await createClient.mutateAsync({
        ...rest,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        ...(healthNotes ? { medicalHistory: { notes: healthNotes } } : {}),
      });
      onClose();
      setFormData({ ...EMPTY_FORM });
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Client" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="John"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <PhoneInput
              value={formData.phoneNumber}
              onChange={(v) => handleChange('phoneNumber', v)}
              countryCode={countryCode}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <DatePicker
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <Input
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. Melbourne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {countryFmt.stateLabel}
            </label>
            {countryFmt.states.length > 0 ? (
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full rounded-xl border border-[#E5DEEC] bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D4AA8]"
              >
                <option value="">Select…</option>
                {countryFmt.states.map((s) => (
                  <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                ))}
              </select>
            ) : (
              <Input
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="e.g. VIC"
              />
            )}
          </div>

          <PostcodeInput
            value={formData.postalCode}
            onChange={(v) => handleChange('postalCode', v)}
            countryCode={countryCode}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Emergency Contact
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <Input
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                placeholder="e.g. Spouse, Parent, Friend"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <PhoneInput
              value={formData.emergencyContactPhone}
              onChange={(v) => handleChange('emergencyContactPhone', v)}
              countryCode={countryCode}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Additional Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <Input
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Physician
              </label>
              <Input
                value={formData.primaryPhysician}
                onChange={(e) => handleChange('primaryPhysician', e.target.value)}
                placeholder="Dr. Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider
                </label>
                <Input
                  value={formData.insuranceProvider}
                  onChange={(e) => handleChange('insuranceProvider', e.target.value)}
                  placeholder="e.g. Medibank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Number
                </label>
                <Input
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => handleChange('insurancePolicyNumber', e.target.value)}
                  placeholder="ABC123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wellness Goals
              </label>
              <Textarea
                value={formData.goals}
                onChange={(e) => handleChange('goals', e.target.value)}
                placeholder="Pain management, stress relief, improved mobility..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Health Notes
              </label>
              <Textarea
                value={formData.healthNotes}
                onChange={(e) => handleChange('healthNotes', e.target.value)}
                placeholder="Recent injuries, surgeries, pregnancy, blood pressure concerns, contraindications…"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createClient.isPending}
            disabled={!formData.firstName || !formData.lastName}
          >
            Add Client
          </Button>
        </div>
      </div>
    </Modal>
  );
};
