'use client';

import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  full?: boolean;
};

export function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  full = false,
}: ButtonProps) {
  const base =
    'relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40';
  const styles =
    variant === 'primary'
      ? 'bg-cyan text-black shadow-[0_0_30px_-10px_var(--color-cyan)] hover:brightness-110'
      : 'border border-line bg-surface/50 text-muted hover:border-cyan hover:text-white';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${full ? 'w-full' : ''}`}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
