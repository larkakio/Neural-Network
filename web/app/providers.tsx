'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { cookieToInitialState, WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi/config';

type Props = {
  children: ReactNode;
  initialState?: ReturnType<typeof cookieToInitialState>;
};

export function Providers({ children, initialState }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
