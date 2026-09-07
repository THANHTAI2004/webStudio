"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getMediaAssetUrl } from "@/lib/api/client";
import type { PublicGalleryImage } from "@/lib/api/albums";

interface AlbumLightboxProps {
  images: PublicGalleryImage[];
  albumTitle: string;
}

export function AlbumLightbox({ images, albumTitle }: AlbumLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const activePosition = activeIndex === null ? 0 : activeIndex + 1;

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => getPreviousIndex(current, images.length));
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => getNextIndex(current, images.length));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg bg-zinc-100 text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            <Image
              src={getMediaAssetUrl(image.medium.url)}
              alt={image.alt || albumTitle}
              width={image.medium.width}
              height={image.medium.height}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-auto w-full object-cover"
            />
          </button>
        ))}
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 px-4 py-6"
          onClick={() => setActiveIndex(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${albumTitle} gallery preview`}
            className="relative flex h-full w-full max-w-6xl flex-col items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close album gallery"
              className="absolute right-0 top-0 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveIndex((current) =>
                  getPreviousIndex(current, images.length),
                )
              }
              aria-label="Previous image"
              className="absolute left-0 top-1/2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Prev
            </button>

            <Image
              src={getMediaAssetUrl(activeImage.large.url)}
              alt={activeImage.alt || albumTitle}
              width={activeImage.large.width}
              height={activeImage.large.height}
              sizes="100vw"
              className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
              priority
            />

            <button
              type="button"
              onClick={() =>
                setActiveIndex((current) =>
                  getNextIndex(current, images.length),
                )
              }
              aria-label="Next image"
              className="absolute right-0 top-1/2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Next
            </button>

            <p className="mt-4 text-sm font-medium text-white">
              {activePosition} / {images.length}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getPreviousIndex(
  current: number | null,
  total: number,
): number | null {
  if (current === null || total === 0) {
    return current;
  }

  return current === 0 ? total - 1 : current - 1;
}

function getNextIndex(current: number | null, total: number): number | null {
  if (current === null || total === 0) {
    return current;
  }

  return current === total - 1 ? 0 : current + 1;
}
