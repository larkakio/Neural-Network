import {
  http,
  createConfig,
  createStorage,
  cookieStorage
} from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';
function buildConnectors() {
  return [
    injected(),
    baseAccount({ appName: 'Neural Network' }),
  ] as const;
}

export const config = createConfig({
  chains: [base, mainnet],
  connectors: buildConnectors(),
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module '@wagmi/core' {
  interface Register {
    config: typeof config;
  }
}
