"use client";

import Image from "next/image";
import { MediaPicker, type MediaChoice } from "@/components/media/media-picker";
import { getMediaAssetUrl } from "@/lib/api/media";

interface SingleMediaFieldProps {
  label: string;
  pickerTitle: string;
  value: MediaChoice[];
  onChange: (items: MediaChoice[]) => void;
}

interface MultiMediaFieldProps extends SingleMediaFieldProps {
  maxSelection?: number;
}

export function SingleMediaField({
  label,
  pickerTitle,
  value,
  onChange,
}: SingleMediaFieldProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{label}</h3>
      {value[0] ? (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-2">
          <MediaThumb item={value[0]} />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">
            {value[0].originalName || value[0].alt || value[0].id}
          </p>
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="mb-3 rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
          No image selected.
        </p>
      )}
      <MediaPicker
        title={pickerTitle}
        mode="single"
        selected={value}
        onChange={onChange}
      />
    </div>
  );
}

export function MultiMediaField({
  label,
  pickerTitle,
  value,
  onChange,
  maxSelection,
}: MultiMediaFieldProps) {
  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= value.length) {
      return;
    }

    const nextItems = [...value];
    const [item] = nextItems.splice(index, 1);

    nextItems.splice(nextIndex, 0, item);
    onChange(nextItems);
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          {label}
          {maxSelection ? ` (${value.length}/${maxSelection})` : null}
        </h3>
        <MediaPicker
          title={pickerTitle}
          mode="multiple"
          selected={value}
          onChange={onChange}
          maxSelection={maxSelection}
          maxSelectionMessage={`Selection can contain up to ${maxSelection} images.`}
        />
      </div>
      {value.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
          No images selected.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-2"
            >
              <MediaThumb item={item} />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                {item.originalName || item.alt || item.id}
              </p>
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                Move Up
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === value.length - 1}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                Move Down
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((entry) => entry.id !== item.id))
                }
                className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaThumb({ item }: { item: MediaChoice }) {
  return (
    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
      <Image
        src={getMediaAssetUrl(item.url)}
        alt={item.alt || item.originalName || ""}
        fill
        sizes="80px"
        className="object-cover"
      />
    </div>
  );
}

