import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

type Props = {
  delay?: number;
  className?: string;
  children: ReactNode;
};

export function Reveal({ delay = 0, className = '', children }: Props) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
