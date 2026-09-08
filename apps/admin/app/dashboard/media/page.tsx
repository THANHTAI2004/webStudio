"use client";

import Image from "next/image";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getMe, refresh } from "@/lib/api/auth";
import {
  deleteMedia,
  getMedia,
  getMediaAssetUrl,
  MediaItem,
  updateMedia,
  uploadMedia,
} from "@/lib/api/media";
import {
  deleteErrorMessage,
  formatAdminDateTime,
  getAdminErrorMessage,
  loadErrorMessage,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const MAX_UPLOAD_MB = 25;
const PAGE_SIZE = 24;

export default function MediaLibraryPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [altDraft, setAltDraft] = useState("");

  const withAuthRetry = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      try {
        return await action();
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          try {
            await refresh();
            return await action();
          } catch {
            router.replace("/login");
            return null;
          }
        }

        throw caughtError;
      }
    },
    [router],
  );

  const loadMedia = useCallback(
    async (nextPage: number, nextSearch: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await withAuthRetry(async () => {
          await getMe();
          return getMedia({
            page: nextPage,
            limit: PAGE_SIZE,
            search: nextSearch.trim(),
          });
        });

        if (!response) {
          return;
        }

        setMedia(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (caughtError) {
        setError(getAdminErrorMessage(caughtError, loadErrorMessage));
      } finally {
        setIsLoading(false);
      }
    },
    [withAuthRetry],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMedia(page, search);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMedia, page, search]);

  async function handleFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await withAuthRetry(() => uploadMedia(files));
      setPage(1);
      await loadMedia(1, search);
    } catch (caughtError) {
      setError(
        getAdminErrorMessage(
          caughtError,
          "Không thể tải ảnh lên. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";
    void handleFiles(files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    void handleFiles(Array.from(event.dataTransfer.files));
  }

  async function handleCopy(mediaItem: MediaItem) {
    const url = getMediaAssetUrl(
      mediaItem.variants.large?.url || mediaItem.variants.medium.url,
    );

    await navigator.clipboard.writeText(url);
    setCopiedId(mediaItem.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  function startEditing(mediaItem: MediaItem) {
    setEditingId(mediaItem.id);
    setAltDraft(mediaItem.alt);
  }

  async function saveAlt(mediaItem: MediaItem) {
    setError(null);

    try {
      const response = await withAuthRetry(() =>
        updateMedia(mediaItem.id, {
          alt: altDraft,
        }),
      );

      if (!response) {
        return;
      }

      setMedia((items) =>
        items.map((item) => (item.id === mediaItem.id ? response.data : item)),
      );
      setEditingId(null);
      setAltDraft("");
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await withAuthRetry(() => deleteMedia(deleteTarget.id));
      setDeleteTarget(null);
      await loadMedia(page, search);
    } catch (caughtError) {
      setError(getMediaDeleteError(caughtError));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Ảnh
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Thư viện ảnh
          </h1>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isUploading ? "Đang tải lên..." : "Tải ảnh lên"}
        </button>
      </header>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-8 rounded-lg border border-dashed bg-white p-6 transition ${
          isDragging ? "border-emerald-500 bg-emerald-50" : "border-zinc-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Chọn ảnh
        </button>
        <p className="mt-4 text-sm text-zinc-600">
          Kéo thả ảnh JPEG, PNG hoặc WebP vào đây. Tối đa {MAX_UPLOAD_MB}
          MB/tệp.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Tìm theo tên hoặc mô tả ảnh"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:max-w-sm"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            Trước
          </button>
          <span className="min-w-20 text-center text-sm text-zinc-600">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            disabled={totalPages === 0 || page >= totalPages || isLoading}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
          >
            Sau
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Đang tải...</p>
      ) : null}

      {!isLoading && media.length === 0 ? (
        <p className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Không tìm thấy kết quả.
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {media.map((mediaItem) => (
          <article
            key={mediaItem.id}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-zinc-100">
              <Image
                src={getMediaAssetUrl(mediaItem.variants.thumb.url)}
                alt={mediaItem.alt || mediaItem.originalName}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="space-y-4 p-4">
              <div>
                <h2 className="line-clamp-2 text-sm font-semibold">
                  {mediaItem.originalName}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {mediaItem.width} x {mediaItem.height} px -{" "}
                  {formatBytes(mediaItem.originalSize)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatAdminDateTime(mediaItem.createdAt)}
                </p>
              </div>

              {editingId === mediaItem.id ? (
                <div className="space-y-2">
                  <textarea
                    value={altDraft}
                    onChange={(event) => setAltDraft(event.target.value)}
                    maxLength={300}
                    aria-label="Mô tả ảnh"
                    className="min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveAlt(mediaItem)}
                      className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold transition hover:bg-zinc-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="min-h-10 text-sm text-zinc-600">
                  {mediaItem.alt || "Chưa có mô tả ảnh"}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy(mediaItem)}
                  className="rounded-md border border-zinc-300 px-2 py-2 text-xs font-semibold transition hover:bg-zinc-50"
                >
                  {copiedId === mediaItem.id
                    ? "Đã sao chép"
                    : "Sao chép đường dẫn ảnh"}
                </button>
                <button
                  type="button"
                  onClick={() => startEditing(mediaItem)}
                  className="rounded-md border border-zinc-300 px-2 py-2 text-xs font-semibold transition hover:bg-zinc-50"
                >
                  Sửa mô tả
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(mediaItem)}
                  className="rounded-md border border-red-200 px-2 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa ảnh?"
        description={
          <>
            Bạn có chắc muốn xóa ảnh{" "}
            <span className="font-semibold text-zinc-900">
              {deleteTarget?.originalName}
            </span>
            ? Thao tác này không thể hoàn tác.
          </>
        }
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </section>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getMediaDeleteError(error: unknown): string {
  if (
    error instanceof ApiError &&
    (error.status === 409 || error.message.includes("MEDIA_IN_USE"))
  ) {
    return "Ảnh này đang được sử dụng và chưa thể xóa.";
  }

  return getAdminErrorMessage(error, deleteErrorMessage);
}
