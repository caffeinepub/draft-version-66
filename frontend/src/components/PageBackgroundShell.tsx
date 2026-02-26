import { ReactNode } from 'react';
import LotusCanvas from './LotusCanvas';

interface PageBackgroundShellProps {
  children: ReactNode;
  variant?: 'default' | 'enhanced' | 'premed';
  intensity?: number;
}

export default function PageBackgroundShell({ 
  children, 
  variant = 'enhanced',
  intensity = 1.0 
}: PageBackgroundShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      <LotusCanvas variant={variant} intensity={intensity} />
      {children}
    </div>
  );
}
