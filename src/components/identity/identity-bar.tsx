'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Voter } from '@/entities/voter/voter.entity';

type IdentityBarProps = {
  voter: Voter | null;
  onIdentify: (name: string) => void;
  busy?: boolean;
};

export function IdentityBar({ voter, onIdentify, busy = false }: IdentityBarProps) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);

  if (voter && !editing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Sos</span>
        <span className="font-display uppercase tracking-wide text-cyan">{voter.name}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="cursor-pointer text-xs uppercase tracking-wide text-muted underline-offset-2 transition hover:text-white hover:underline"
        >
          cambiar
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) {
          onIdentify(name.trim());
          setEditing(false);
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={voter ? voter.name : 'Tu nombre'}
        maxLength={40}
        className="w-36 rounded-lg border border-line bg-surface/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-muted/60 focus:border-cyan"
      />
      <Button type="submit" disabled={busy}>
        {busy ? '…' : 'Listo'}
      </Button>
    </form>
  );
}
