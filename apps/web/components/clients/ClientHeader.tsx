'use client';

import React from 'react';
import { Avatar, Button, Badge } from '@massage/ui';
import { Client } from '@massage/types';

export interface ClientHeaderProps {
  client: Client;
  onEdit?: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ client, onEdit }) => {
  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" name={fullName} />

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <Badge variant={client.isActive ? 'success' : 'default'}>
                {client.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="mt-2 space-y-1">
              {client.email && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {client.email}
                </p>
              )}
              {client.phoneNumber && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {client.phoneNumber}
                </p>
              )}
              {client.dateOfBirth && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">DOB:</span>{' '}
                  {new Date(client.dateOfBirth).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            Edit Client
          </Button>
        )}
      </div>
    </div>
  );
};
