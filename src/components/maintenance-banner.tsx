"use client";

import { usePublicConfig } from "@/components/public-config-provider";

export function MaintenanceBanner() {
  const { config } = usePublicConfig();
  const message = config.maintenanceMessage.trim();

  if (!message) {
    return null;
  }

  return (
    <div className="status-info rounded-none px-4 py-2 text-center text-sm break-words">
      {message}
    </div>
  );
}
