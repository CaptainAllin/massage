'use client';

import React from 'react';
import { PackagePurchase } from '@massage/types';
import { PackageCard } from './PackageCard';

export interface PackageListProps {
  packages: PackagePurchase[];
}

export const PackageList: React.FC<PackageListProps> = ({ packages }) => {
  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No packages found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} packagePurchase={pkg} />
      ))}
    </div>
  );
};
