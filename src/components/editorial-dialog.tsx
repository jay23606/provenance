'use client';

import type { ComponentProps } from 'react';
import { X } from 'lucide-react';
import { DialogClose, DialogContent } from '@kit/ui/dialog';
import { cn } from '@kit/ui/utils';

/**
 * Drop-in replacement for <DialogContent> for long forms.
 *
 * - Phone: bottom sheet. sm+: centred card.
 * - The content scrolls, but <DialogHeader> (and the close button) pin to the
 *   top and <DialogFooter> pins to the bottom, so neither can scroll away.
 * - Fields, labels and footer buttons pick up the editorial look from the
 *   `.editorial-dialog` rules in globals.css — no per-field classes needed.
 */
export function EditorialDialogContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: Omit<ComponentProps<typeof DialogContent>, 'hideCloseButton'>) {
  return (
    <DialogContent
      {...props}
      hideCloseButton
      onOpenAutoFocus={(e) => {
        // Auto-focusing the first field raises the iOS keyboard the moment
        // the sheet opens and shoves the layout around.
        e.preventDefault();
        onOpenAutoFocus?.(e);
      }}
      className={cn(
        'editorial-dialog',
        'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-none',
        'max-sm:data-[state=open]:slide-in-from-bottom-8 max-sm:data-[state=open]:zoom-in-100',
        'flex flex-col gap-5 overflow-y-auto overscroll-contain rounded-none sm:rounded-none',
        'max-h-[calc(100dvh-2.5rem)] sm:max-h-[88dvh]',
        'bg-bone text-editorial-ink border-0 border-t border-editorial-border sm:border shadow-editorial font-serif',
        className,
      )}
    >
      <div className="editorial-dialog__close-bar">
        <DialogClose className="editorial-dialog__close" aria-label="Close">
          <X className="h-4 w-4" />
        </DialogClose>
      </div>
      {children}
    </DialogContent>
  );
}
