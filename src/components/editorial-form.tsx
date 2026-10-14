import { cn } from '@kit/ui/utils';

// Editorial form vocabulary — borrowed from the navbar: JetBrains Mono
// uppercase labels at 0.18em tracking, ink hairlines, square corners, and a
// vermillion rule that appears on focus (like the nav link underline).
// Pass these as className overrides to the @kit/ui primitives.

export const FIELD_LABEL =
  'font-jetbrains text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-editorial-ink/60';

export const FIELD_INPUT =
  'h-11 rounded-none border-0 border-b border-editorial-border/30 bg-transparent px-0 font-serif text-base md:text-base text-editorial-ink shadow-none transition-colors placeholder:text-editorial-ink/35 hover:border-editorial-border/60 focus-visible:border-b-vermillion focus-visible:ring-0 focus-visible:shadow-[0_1px_0_0_var(--vermillion)]';

export const FIELD_TEXTAREA =
  'min-h-[96px] resize-none rounded-none border border-editorial-border/25 bg-cream/50 px-3.5 py-3 font-serif text-base md:text-base text-editorial-ink shadow-none transition-colors placeholder:text-editorial-ink/35 hover:border-editorial-border/50 focus-visible:border-vermillion focus-visible:ring-0';

export const FIELD_HINT = 'font-serif text-xs text-editorial-ink/50';

const BUTTON_BASE =
  'h-11 rounded-none px-5 font-jetbrains text-[11px] font-medium uppercase tracking-[0.18em] shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-vermillion/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bone';

export const BUTTON_PRIMARY = cn(
  BUTTON_BASE,
  'bg-editorial-ink text-bone hover:bg-editorial-ink/85',
);

export const BUTTON_SECONDARY = cn(
  BUTTON_BASE,
  'border border-editorial-border/30 bg-transparent text-editorial-ink hover:border-editorial-border hover:bg-editorial-ink/[0.04]',
);

/** Numbered section rule: `01 ── PROPOSED CHANGES ─────────` */
export function FieldSection({
  index,
  title,
  className,
}: {
  index: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="font-jetbrains text-[10px] font-medium tracking-[0.18em] text-vermillion">
        {index}
      </span>
      <h3 className="font-jetbrains text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-editorial-ink">
        {title}
      </h3>
      <span aria-hidden className="h-px flex-1 bg-editorial-border/20" />
    </div>
  );
}
