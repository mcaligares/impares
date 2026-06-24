'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type RegisterFormProps = {
  onSubmit: (raw: string) => void;
  busy?: boolean;
  error?: string;
};

export function RegisterForm({ onSubmit, busy = false, error }: RegisterFormProps) {
  const [raw, setRaw] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(raw);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className="mb-1.5 block font-display text-lg uppercase tracking-wide text-white">Pegá la lista</label>
        <p className="text-xs leading-relaxed text-muted">
          El mensaje del grupo, una línea por jugador:{' '}
          <span className="font-mono text-cyan">número- nombre, movilidad, resistencia</span> (1–5, opcionales). Ej:{' '}
          <span className="font-mono text-celeste">11- Migue,3,4</span>
        </p>
      </div>
      <textarea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        rows={11}
        placeholder={'Futbol Lujan - 10/06 20:30hs\n1- Mati,3,4\n2- Gonza\n3- JP,5,1'}
        className="w-full resize-y rounded-xl border border-line bg-black/40 p-4 font-mono text-sm text-white shadow-inner outline-none transition placeholder:text-muted/50 focus:border-cyan focus:shadow-[0_0_0_3px_rgba(45,212,255,0.12)]"
      />
      {error ? <p className="a-fade text-sm font-medium text-magenta">{error}</p> : null}
      <Button type="submit" disabled={busy} full>
        {busy ? 'Creando partido…' : 'Crear partido'}
      </Button>
    </form>
  );
}
