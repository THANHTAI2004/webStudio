"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMedia, getMediaAssetUrl, type MediaItem } from "@/lib/api/media";
import { withAuthRefresh } from "@/lib/api/session";

export interface MediaChoice {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName?: string;
}

interface MediaPickerProps {
  title: string;
  mode: "single" | "multiple";
  selected: MediaChoice[];
  onChange: (items: MediaChoice[]) => void;
  disabled?: boolean;
}

const PAGE_SIZE = 12;

export function MediaPicker({
  title,
  mode,
  selected,
  onChange,
  disabled = false,
}: MediaPickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [draftSelection, setDraftSelection] = useState<MediaChoice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadMedia = useCallback(
    async (nextPage: number, nextSearch: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await withAuthRefresh(
          () =>
            getMedia({
              page: nextPage,
              limit: PAGE_SIZE,
              search: nextSearch.trim(),
            }),
          redirectToLogin,
        );

        if (!response) {
          return;
        }

        setItems(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, "Unable to load media."));
      } finally {
        setIsLoading(false);
      }
    },
    [redirectToLogin],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadMedia(page, search);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, loadMedia, page, search]);

  function openPicker() {
    setDraftSelection(selected);
    setPage(1);
    setSearch("");
    setIsOpen(true);
  }

  function closePicker() {
    setIsOpen(false);
    setError(null);
  }

  function handleSelect(mediaItem: MediaItem) {
    const choice = toMediaChoice(mediaItem);

    if (mode === "single") {
      onChange([choice]);
      closePicker();
      return;
    }

    setDraftSelection((current) => {
      if (current.some((item) => item.id === choice.id)) {
        return current.filter((item) => item.id !== choice.id);
      }

      return [...current, choice];
    });
  }

  function applyMultipleSelection() {
    onChange(draftSelection);
    closePicker();
  }

  const selectedIds = new Set(draftSelection.map((item) => item.id));

  return (
    <div>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        {title}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white text-zinc-950 shadow-xl">
            <header className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Media Library</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {mode === "multiple"
                    ? `${draftSelection.length} selected`
                    : "Choose one image"}
                </p>
              </div>
              <div className="flex gap-2">
                {mode === "multiple" ? (
                  <button
                    type="button"
                    onClick={applyMultipleSelection}
                    className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Done
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closePicker}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="border-b border-zinc-200 px-5 py-4">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search media"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:max-w-sm"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {isLoading ? (
                <p className="text-sm text-zinc-600">Loading media...</p>
              ) : null}

              {!isLoading && items.length === 0 ? (
                <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-600">
                  No images found.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`overflow-hidden rounded-lg border bg-white text-left shadow-sm transition ${
                        isSelected
                          ? "border-emerald-600 ring-2 ring-emerald-100"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <span className="relative block aspect-[4/3] bg-zinc-100">
                        <Image
                          src={getMediaAssetUrl(item.variants.thumb.url)}
                          alt={item.alt || item.originalName}
                          fill
                          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </span>
                      <span className="block p-3">
                        <span className="line-clamp-2 block text-sm font-semibold">
                          {item.originalName}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <footer className="flex items-center justify-between border-t border-zinc-200 px-5 py-4">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600">
                {page} / {Math.max(totalPages, 1)}
              </span>
              <button
                type="button"
                disabled={totalPages === 0 || page >= totalPages || isLoading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                Next
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toMediaChoice(mediaItem: MediaItem): MediaChoice {
  return {
    id: mediaItem.id,
    url: mediaItem.variants.medium.url,
    width: mediaItem.variants.medium.width,
    height: mediaItem.variants.medium.height,
    alt: mediaItem.alt,
    originalName: mediaItem.originalName,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
