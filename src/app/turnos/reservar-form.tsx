"use client";

import { useActionState } from "react";
import { reservarTurno, type ReservarState } from "./actions";

type Props = {
  slotId: string;
  fecha: string;
  disabled?: boolean;
};

export function ReservarForm({ slotId, fecha, disabled }: Props) {
  const [state, action, pending] = useActionState<ReservarState, FormData>(
    reservarTurno,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="slot_id" value={slotId} />
      <input type="hidden" name="fecha" value={fecha} />
      <div className="flex gap-2">
        <input
          name="plate"
          required
          placeholder="ABC-123"
          maxLength={8}
          aria-label="Placa del vehículo"
          disabled={disabled || pending}
          className="h-8 w-28 rounded-md border bg-background px-2 text-sm uppercase"
        />
        <button
          type="submit"
          disabled={disabled || pending}
          className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Reservando..." : "Reservar"}
        </button>
      </div>
      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "text-sm text-green-700" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
