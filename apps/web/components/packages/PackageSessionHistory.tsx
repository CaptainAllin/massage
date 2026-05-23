'use client';

import { Card, CardContent } from '@massage/ui';

interface PackageSessionHistoryProps {
  packageId: string;
  businessId: string | undefined;
}

export function PackageSessionHistory({ packageId }: PackageSessionHistoryProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-gray-500">Session history for package {packageId} will appear here.</p>
      </CardContent>
    </Card>
  );
}
