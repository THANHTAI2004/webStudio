"use client";

export interface SelectableEntity {
  id: string;
  label: string;
  detail?: string;
}

interface EntitySelectorProps {
  title: string;
  items: SelectableEntity[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelection: number;
}

export function EntitySelector({
  title,
  items,
  selectedIds,
  onChange,
  maxSelection,
}: EntitySelectorProps) {
  const selectedItems = selectedIds.map(
    (id) =>
      items.find((item) => item.id === id) ?? {
        id,
        label: id,
        detail: "Saved item is not in the loaded list.",
      },
  );
  const availableItems = items.filter((item) => !selectedIds.includes(item.id));

  function addItem(id: string) {
    if (!id || selectedIds.includes(id) || selectedIds.length >= maxSelection) {
      return;
    }

    onChange([...selectedIds, id]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= selectedIds.length) {
      return;
    }

    const nextIds = [...selectedIds];
    const [item] = nextIds.splice(index, 1);

    nextIds.splice(nextIndex, 0, item);
    onChange(nextIds);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">
        {title}
        <select
          value=""
          onChange={(event) => addItem(event.target.value)}
          disabled={selectedIds.length >= maxSelection}
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
        >
          <option value="">Add item</option>
          {availableItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {selectedItems.length === 0 ? (
        <p className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
          No manual items selected.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {selectedItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.label}</p>
                {item.detail ? (
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {item.detail}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === selectedItems.length - 1}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
              >
                Down
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(selectedIds.filter((id) => id !== item.id))
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
