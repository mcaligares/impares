'use client';

import { useState, type ReactNode } from 'react';

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
  const [shining, setShining] = useState(false);
  const base =
    'group relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-0.5 active:scale-[0.98]';
  const styles =
    variant === 'primary'
      ? 'bg-cyan text-black shadow-[0_0_30px_-10px_var(--color-cyan)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_40px_-8px_var(--color-cyan)]'
      : 'border border-line bg-surface/50 text-muted hover:-translate-y-0.5 hover:border-cyan hover:text-white';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={variant === 'primary' ? () => setShining(true) : undefined}
      onFocus={variant === 'primary' ? () => setShining(true) : undefined}
      className={`${base} ${styles} ${full ? 'w-full' : ''}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {variant === 'primary' ? (
        <span
          aria-hidden
          onAnimationEnd={() => setShining(false)}
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[130%] skew-x-[-20deg] bg-white/40 ${shining ? 'a-shine' : ''}`}
        />
      ) : null}
    </button>
  );
}
