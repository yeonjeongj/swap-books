"use client";

import { useEffect } from "react";

export function ClarityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId) return;
    import("@microsoft/clarity").then((mod) => {
      mod.default.init(projectId);
    });
  }, []);

  return <>{children}</>;
}
