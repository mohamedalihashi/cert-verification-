"use client";

import { compressImage } from "@/lib/photo";
import { PHOTO_ACCEPT, validateUpload } from "@/lib/utils";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";

export function PhotoUpload({
  value,
  onChange,
  maxMb,
  name,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  maxMb: number;
  name?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    const problem = validateUpload(file, "photo", maxMb);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      const data = await compressImage(file);
      onChange(data);
      setError("");
    } catch {
      setError("Could not process this photo.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-36 w-36 overflow-hidden rounded-2xl border border-dashed border-line bg-cream"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={name ?? "Student photo"} className="h-full w-full object-cover" />
        ) : (
          <span className="m-auto flex flex-col items-center gap-2 text-xs text-muted">
            <Camera className="h-6 w-6" />
            Upload photo
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <p className="text-xs text-muted">JPG, JPEG, PNG or WEBP. Large photos are compressed automatically.</p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
