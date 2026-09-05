"use client";

import { Button } from "@/components/ui";
import { downloadDataUrl } from "@/lib/utils";
import { Download, Printer } from "lucide-react";
import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

export function QrPanel({
  url,
  filename,
  size = 200,
}: {
  url: string;
  filename: string;
  size?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  function canvas() {
    return boxRef.current?.querySelector("canvas") ?? null;
  }

  function download() {
    const el = canvas();
    if (!el) return;
    downloadDataUrl(el.toDataURL("image/png"), filename);
  }

  function printQr() {
    const el = canvas();
    if (!el) return;
    const src = el.toDataURL("image/png");
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    win.document.write(`<!doctype html><title>QR Code</title>
      <body style="font-family:'Segoe UI',sans-serif;text-align:center;padding:32px">
        <p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#0099e5">Certificate verification</p>
        <img src="${src}" width="280" height="280" alt="QR" />
        <p style="font-family:ui-monospace,monospace;font-size:13px;word-break:break-all">${url}</p>
        <script>window.onload=()=>{window.print();}</script>
      </body>`);
    win.document.close();
  }

  return (
    <div className="space-y-4">
      <div
        ref={boxRef}
        className="mx-auto w-fit rounded-xl border border-line bg-white p-4"
      >
        <QRCodeCanvas value={url} size={size} marginSize={2} level="M" />
      </div>
      <p className="break-all text-center font-mono text-xs text-muted">{url}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={download}>
          <Download className="h-4 w-4" />
          Download QR
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={printQr}>
          <Printer className="h-4 w-4" />
          Print QR
        </Button>
      </div>
    </div>
  );
}
