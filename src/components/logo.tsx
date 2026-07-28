import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl bg-gradient-to-br from-indigo via-indigo/90 to-emerald/70 shadow-elegant",
          box,
        )}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
          <circle cx="12" cy="7" r="2.2" fill="currentColor" />
          <circle cx="6" cy="15" r="2.2" fill="currentColor" opacity="0.75" />
          <circle cx="18" cy="15" r="2.2" fill="currentColor" opacity="0.55" />
          <path
            d="M12 9.2v3.6M9.9 13.7 7.6 15M14.1 13.7 16.4 15"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-semibold tracking-tight", text)}>Conclave</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            AI Council
          </span>
        </div>
      )}
    </Link>
  );
}
