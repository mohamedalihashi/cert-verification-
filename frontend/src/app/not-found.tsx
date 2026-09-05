import { Crest } from "@/components/brand";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4 text-center">
      <div>
        <Crest className="mx-auto h-14 w-14" />
        <h1 className="mt-4 font-display text-3xl text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">This page is not part of the certificate registry.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-teal hover:underline">
          Return home
        </Link>
      </div>
    </div>
  );
}
