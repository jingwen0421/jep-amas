// Ctrl+K (Cmd+K on Mac) search: jump to any page the signed-in role may open.
// Type to filter, matches are highlighted, Enter opens the page.
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useLanguage } from '../../context/LanguageContext';

export interface PaletteItem {
  to: string;        // route, e.g. /app/students/list
  label: string;     // already translated
  section: string;   // already translated
  parent?: string;   // menu group the page sits under, if any
  icon: ReactNode;
}

// Plain "contains" search (not fuzzy), so typing "pay" finds Payments and not
// every page that happens to contain the letters p, a, y somewhere.
// Page names rank above section names; names that start with the text rank first.
function score(value: string, search: string, keywords?: string[]) {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  const name = value.toLowerCase();
  const words = name.split(/[\s&]+/);
  if (name.startsWith(q)) return 1;
  if (words.some(w => w.startsWith(q))) return 0.8;
  if (name.includes(q)) return 0.6;
  if ((keywords ?? []).some(k => k.toLowerCase().includes(q))) return 0.3;
  return 0;
}

// Wrap the part of the label that matches what was typed.
function highlight(text: string, query: string) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="glass-hl">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function CommandPalette({ open, onOpenChange, items }: {
  open: boolean; onOpenChange: (open: boolean) => void; items: PaletteItem[];
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  // Ctrl+K / Cmd+K opens and closes the palette from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const sections = Array.from(new Set(items.map(i => i.section)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t('glass.searchTitle')}</DialogTitle>
        <DialogDescription>{t('glass.searchHint')}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command
          filter={score}
          className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput value={query} onValueChange={setQuery} placeholder={t('glass.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('glass.noPage')}</CommandEmpty>
            {sections.map(section => (
              <CommandGroup key={section} heading={section}>
                {items.filter(i => i.section === section).map(i => (
                  <CommandItem
                    key={i.to}
                    value={i.label}
                    keywords={[i.parent ?? '', i.section].filter(Boolean)}
                    onSelect={() => { onOpenChange(false); navigate(i.to); }}
                  >
                    {i.icon}
                    <span>{highlight(i.label, query)}</span>
                    {i.parent && <span className="ml-auto text-xs text-muted-foreground">{i.parent}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
