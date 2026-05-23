"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CommandCenter } from "@/components/command-center";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEmployerModule = pathname === "/employer" || pathname.startsWith("/employer/");

  if (isEmployerModule) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="no-print">
        <SiteNav />
        <CommandCenter />
      </div>
      <div className="pb-24 md:pb-8 print:pb-0">{children}</div>
      <div className="no-print">
        <SiteFooter />
      </div>
    </>
  );
}
