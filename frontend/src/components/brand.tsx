import { ACADEMY_MOTTO, ACADEMY_NAME, ACADEMY_SHORT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Crest({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/horseed-logo.jpg" alt={ACADEMY_NAME} className="h-full w-full object-contain" />
    </span>
  );
}

export function PublicBrand({
  center = false,
  compact = false,
}: {
  center?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", center && "justify-center")}>
      <Crest className={cn("rounded-full", compact ? "h-12 w-12" : "h-[4.25rem] w-[4.25rem]")} />
      <div className={center ? "text-left" : ""}>
        <p className="text-[15px] font-extrabold uppercase leading-tight tracking-[0.04em] text-ink sm:text-base">
          Horseed Academy
        </p>
        <p className="text-[10px] font-semibold uppercase leading-snug tracking-[0.06em] text-ink/75 sm:text-[11px]">
          Model for Science and Languages
        </p>
        <p className="mt-1 text-[11px] font-medium text-teal-dark">{ACADEMY_MOTTO}</p>
      </div>
    </div>
  );
}

export function BrandMark({
  compact = false,
  light = false,
  sidebar = false,
}: {
  compact?: boolean;
  light?: boolean;
  sidebar?: boolean;
}) {
  const name = sidebar || !compact ? ACADEMY_NAME : ACADEMY_SHORT_NAME;
  return (
    <div className="flex items-center gap-3">
      <Crest className={sidebar ? "h-11 w-11" : compact ? "h-10 w-10" : "h-14 w-14"} />
      <p
        className={`font-bold tracking-tight leading-snug ${
          sidebar
            ? "text-[11px] uppercase"
            : compact
              ? "max-w-[10rem] text-sm"
              : "max-w-[16rem] text-[15px] sm:max-w-xs sm:text-base"
        } ${light ? "text-white" : "text-ink"}`}
      >
        {name}
      </p>
    </div>
  );
}
