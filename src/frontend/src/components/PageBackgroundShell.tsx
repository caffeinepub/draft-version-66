import { ReactNode } from 'react';
import LotusCanvas from './LotusCanvas';

interface PageBackgroundShellProps {
  children: ReactNode;
}

export default function PageBackgroundShell({ children }: PageBackgroundShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      <LotusCanvas variant="enhanced" />
      {children}
    </div>
  );
}
