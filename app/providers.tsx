'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import OnboardingController from '@/components/OnboardingController';
import { ClarityProvider } from '@/components/clarity-provider';
import { AmplitudeProvider } from '@/components/amplitude-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ClarityProvider>
          <AmplitudeProvider>
            {children}
            <OnboardingController />
          </AmplitudeProvider>
        </ClarityProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
