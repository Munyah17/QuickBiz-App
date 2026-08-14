"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, User, Contact, Package, Receipt } from "lucide-react";
import { searchWorkspaceAction } from "@/app/actions/search";
import type { SearchResult } from "@/services/search";

const RESULT_ICON: Record<SearchResult["type"], typeof Building2> = {
  branch: Building2,
  user: User,
  customer: Contact,
  product: Package,
  invoice: Receipt,
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Stale results from a previous, longer query are simply not rendered
    // once the query shrinks below the threshold (see the render guard
    // below) — no need to clear them synchronously here.
    if (query.trim().length < 2) return;

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchWorkspaceAction(query);
        setResults(data);
        setOpen(true);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const queryLongEnough = query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-workspace px-3">
        <Search className="size-4 shrink-0 text-text-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => queryLongEnough && results.length > 0 && setOpen(true)}
          placeholder="Search customers, products, invoices..."
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>

      {open && queryLongEnough && (results.length > 0 || isPending) && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface py-1 shadow-popover">
          {isPending && <p className="px-3 py-2 text-sm text-text-tertiary">Searching...</p>}
          {!isPending &&
            results.map((result) => {
              const Icon = RESULT_ICON[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(result.href);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-workspace"
                >
                  <Icon className="size-4 text-text-tertiary" />
                  <span className="text-text-primary">{result.label}</span>
                  <span className="ml-auto text-xs text-text-tertiary">{result.sublabel}</span>
                </button>
              );
            })}
          {!isPending && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-text-tertiary">No matches</p>
          )}
        </div>
      )}
    </div>
  );
}
