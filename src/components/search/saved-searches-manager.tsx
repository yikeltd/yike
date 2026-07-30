"use client";

import { useEffect, useState } from "react";
import { Bookmark, Bell, Trash2, Search, X, CheckCircle2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SavedSearchItem {
  id: string;
  title: string;
  queryUrl: string;
  createdAt: string;
  alertsEnabled: boolean;
}

const LOCAL_SAVED_SEARCHES_KEY = "yike_saved_searches_v1";

export function getSavedSearches(): SavedSearchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as SavedSearchItem[]) : [];
  } catch {
    return [];
  }
}

export function saveSearchItem(item: Omit<SavedSearchItem, "id" | "createdAt">): SavedSearchItem[] {
  const current = getSavedSearches();
  const newItem: SavedSearchItem = {
    ...item,
    id: `search_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...current.filter((x) => x.queryUrl !== item.queryUrl)].slice(0, 20);
  try {
    localStorage.setItem(LOCAL_SAVED_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function removeSavedSearchItem(id: string): SavedSearchItem[] {
  const current = getSavedSearches();
  const updated = current.filter((x) => x.id !== id);
  try {
    localStorage.setItem(LOCAL_SAVED_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function toggleSavedSearchAlert(id: string): SavedSearchItem[] {
  const current = getSavedSearches();
  const updated = current.map((x) => (x.id === id ? { ...x, alertsEnabled: !x.alertsEnabled } : x));
  try {
    localStorage.setItem(LOCAL_SAVED_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function SavedSearchesManager({
  currentSearchHref,
  currentSearchTitle,
  isOpen,
  onClose,
}: {
  currentSearchHref?: string;
  currentSearchTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearches(getSavedSearches());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCurrentSaved = Boolean(
    currentSearchHref && searches.some((s) => s.queryUrl === currentSearchHref)
  );

  function handleSaveCurrent() {
    if (!currentSearchHref || !currentSearchTitle) return;
    const updated = saveSearchItem({
      title: currentSearchTitle,
      queryUrl: currentSearchHref,
      alertsEnabled: true,
    });
    setSearches(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function handleRemove(id: string) {
    const updated = removeSavedSearchItem(id);
    setSearches(updated);
  }

  function handleToggleAlert(id: string) {
    const updated = toggleSavedSearchAlert(id);
    setSearches(updated);
  }

  function handleRun(url: string) {
    onClose();
    router.push(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in slide-in-from-bottom-6 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-gold" />
            <h2 className="text-base font-black">Saved Searches & Alerts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SAVE CURRENT SEARCH BANNER */}
        {currentSearchHref && currentSearchTitle && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-gold block">
                Current Active Search
              </span>
              <p className="font-extrabold text-navy dark:text-white truncate mt-0.5">
                {currentSearchTitle}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={isCurrentSaved || justSaved}
              className={cn(
                "pressable shrink-0 flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm",
                isCurrentSaved || justSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-[#031B4E] dark:bg-gold text-white dark:text-navy hover:bg-navy/90"
              )}
            >
              {isCurrentSaved || justSaved ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Save Search</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* SAVED SEARCHES LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {searches.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-navy/50 dark:text-white/50">
              <Bookmark className="h-8 w-8 mx-auto opacity-40 text-gold" />
              <p className="text-xs font-bold">No saved searches yet</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Save your favorite location, budget, or vehicle queries to receive instant notifications when matching items are listed.
              </p>
            </div>
          ) : (
            searches.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs hover:border-gold/40 transition-all"
              >
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleRun(item.queryUrl)}>
                  <p className="font-black text-navy dark:text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-[10px] font-medium text-navy/50 dark:text-white/50 mt-0.5">
                    Saved {new Date(item.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleAlert(item.id)}
                    className={cn(
                      "p-2 rounded-xl border transition-all",
                      item.alertsEnabled
                        ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-gold dark:border-amber-800"
                        : "bg-white dark:bg-navy-light text-navy/40 dark:text-white/40 border-slate-200 dark:border-white/10"
                    )}
                    title={item.alertsEnabled ? "Notifications ON" : "Notifications OFF"}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRun(item.queryUrl)}
                    className="p-2 rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy hover:opacity-90"
                    title="Run search"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-xl text-navy/40 dark:text-white/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete saved search"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
