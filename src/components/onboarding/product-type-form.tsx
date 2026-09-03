"use client";

import { useActionState, useState } from "react";
import { saveProductTypesAction } from "@/lib/onboarding-actions";
import { WizardNav } from "@/components/onboarding/wizard-nav";
import type { ActionResult } from "@/lib/actions";
import type { ProductType } from "@/lib/types";

const initial: ActionResult | null = null;

export function ProductTypeForm({
  defaultTypes,
}: {
  defaultTypes: ProductType[];
}) {
  const [state, formAction] = useActionState(saveProductTypesAction, initial);
  const [selected, setSelected] = useState<Set<ProductType>>(
    () => new Set(defaultTypes),
  );

  function toggle(type: ProductType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      {Array.from(selected).map((type) => (
        <input key={type} type="hidden" name="productType" value={type} />
      ))}
      <div className="grid gap-4 sm:grid-cols-2">
        <TypeCard
          selected={selected.has("digital")}
          onClick={() => toggle("digital")}
          title="Productos digitales"
          description="Presets, ebooks, archivos descargables, recetarios, PDFs, etc."
          icon="download"
        />
        <TypeCard
          selected={selected.has("session")}
          onClick={() => toggle("session")}
          title="Reuniones online"
          description="Llamadas 1:1, consultorías, sesiones de coaching, etc."
          note="Requiere Google Calendar"
          icon="video"
        />
      </div>
      <WizardNav
        backHref="/onboarding/handle"
        submitLabel="Siguiente →"
        skipAsSubmit="Configurar después"
        error={state && !state.ok ? state.error : null}
      />
    </form>
  );
}

function TypeCard({
  selected,
  onClick,
  title,
  description,
  note,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  note?: string;
  icon: "download" | "video";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.4rem] border bg-white/85 p-5 text-left shadow-sm transition ${
        selected
          ? "border-[var(--teal)] ring-2 ring-[var(--teal)]/25"
          : "border-[var(--line)] hover:border-[var(--teal)]/50"
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--fog)] text-[var(--teal)]">
        {icon === "download" ? "↓" : "◎"}
      </span>
      <p className="mt-4 font-display text-xl text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        {description}
      </p>
      {note ? (
        <p className="mt-3 text-xs italic text-[var(--ink-muted)]">{note}</p>
      ) : null}
    </button>
  );
}
