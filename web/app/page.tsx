import { CheckInPanel } from '@/components/CheckInPanel';
import { NeuralGame } from '@/components/game/NeuralGame';
import { WalletBar } from '@/components/WalletBar';

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-dvh flex-col">
      <WalletBar />
      <div className="flex min-h-0 flex-1 flex-col">
        <NeuralGame />
      </div>
      <CheckInPanel />
    </main>
  );
}
