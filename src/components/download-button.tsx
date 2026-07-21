"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DownloadButton({
  token,
  fileName,
}: {
  token: string;
  fileName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/download/${token}`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "No se pudo generar la descarga.");
        setPending(false);
        router.refresh();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      router.refresh();
    } catch {
      setError("Error de red al descargar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleDownload}
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? "Preparando archivo…" : "Descargar PDF"}
      </button>
      {error ? (
        <p className="text-sm text-[var(--coral)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
