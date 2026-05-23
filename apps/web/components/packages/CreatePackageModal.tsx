'use client';

import { Modal, Button } from '@massage/ui';
import { CreatePackagePurchaseDto } from '@massage/types';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreatePackagePurchaseDto) => Promise<void>;
  businessId: string | undefined;
}

export function CreatePackageModal({ isOpen, onClose }: CreatePackageModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Package">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Package creation coming soon.</p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
