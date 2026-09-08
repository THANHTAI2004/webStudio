"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  MultiMediaField,
  SingleMediaField,
} from "@/components/cms/media-field";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  type AboutInput,
  type AdminAbout,
  getAbout,
  updateAbout,
} from "@/lib/api/about";
import {
  getAdminErrorMessage,
  loadErrorMessage,
  saveErrorMessage,
} from "@/lib/admin-labels";
import { withAuthRefresh } from "@/lib/api/session";
import { getPublicUrl } from "@/lib/site-url";

const maxPhilosophyItems = 8;
const maxTeamMembers = 20;
const maxMetrics = 12;
const maxGalleryItems = 30;

export default function AboutCmsPage() {
  const router = useRouter();
  const [about, setAbout] = useState<AdminAbout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadAbout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(getAbout, redirectToLogin);

      if (response) {
        setAbout(response.data);
      }
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, loadErrorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAbout();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAbout]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!about) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await withAuthRefresh(
        () => updateAbout(buildPayload(about)),
        redirectToLogin,
      );

      if (response) {
        setAbout(response.data);
        setNotice("Đã lưu trang giới thiệu.");
      }
    } catch (caughtError) {
      setError(getAdminErrorMessage(caughtError, saveErrorMessage));
    } finally {
      setIsSaving(false);
    }
  }

  function buildPayload(currentAbout: AdminAbout): AboutInput {
    return {
      hero: {
        eyebrow: currentAbout.hero.eyebrow,
        title: currentAbout.hero.title,
        subtitle: currentAbout.hero.subtitle,
        mediaId: currentAbout.hero.mediaId,
      },
      story: {
        heading: currentAbout.story.heading,
        contentHtml: currentAbout.story.contentHtml,
        mediaId: currentAbout.story.mediaId,
      },
      philosophy: currentAbout.philosophy,
      team: {
        enabled: currentAbout.team.enabled,
        heading: currentAbout.team.heading,
        members: currentAbout.team.members.map((member) => ({
          name: member.name,
          role: member.role,
          bio: member.bio,
          mediaId: member.mediaId,
        })),
      },
      metrics: currentAbout.metrics,
      galleryMediaIds: currentAbout.galleryMediaIds,
      bookingCta: currentAbout.bookingCta,
      seo: {
        title: currentAbout.seo.title,
        description: currentAbout.seo.description,
        ogImageMediaId: currentAbout.seo.ogImageMediaId,
      },
    };
  }

  function patchAbout(patcher: (currentAbout: AdminAbout) => AdminAbout) {
    setAbout((current) => (current ? patcher(current) : current));
  }

  if (isLoading || !about) {
    return (
      <main className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-zinc-600">Đang tải trang giới thiệu...</p>
      </main>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            Nội dung website
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Giới thiệu
          </h1>
        </div>
        <Link
          href={getPublicUrl("/gioi-thieu")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-zinc-50"
        >
          Xem trang
        </Link>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <FormSection title="Ảnh đầu trang">
          <TextField
            label="Dòng giới thiệu nhỏ"
            value={about.hero.eyebrow}
            onChange={(eyebrow) =>
              patchAbout((current) => ({
                ...current,
                hero: { ...current.hero, eyebrow },
              }))
            }
            maxLength={120}
          />
          <TextField
            label="Tiêu đề"
            value={about.hero.title}
            onChange={(title) =>
              patchAbout((current) => ({
                ...current,
                hero: { ...current.hero, title },
              }))
            }
            maxLength={180}
            required
          />
          <TextArea
            label="Mô tả"
            value={about.hero.subtitle}
            onChange={(subtitle) =>
              patchAbout((current) => ({
                ...current,
                hero: { ...current.hero, subtitle },
              }))
            }
            maxLength={500}
            rows={3}
          />
          <SingleMediaField
            label="Ảnh đầu trang"
            pickerTitle="Chọn ảnh đầu trang"
            value={about.hero.media ? [about.hero.media] : []}
            onChange={(items) =>
              patchAbout((current) => ({
                ...current,
                hero: {
                  ...current.hero,
                  mediaId: items[0]?.id ?? null,
                  media: items[0] ?? null,
                },
              }))
            }
          />
        </FormSection>

        <FormSection title="Câu chuyện Studio">
          <TextField
            label="Tiêu đề"
            value={about.story.heading}
            onChange={(heading) =>
              patchAbout((current) => ({
                ...current,
                story: { ...current.story, heading },
              }))
            }
            maxLength={180}
          />
          <RichTextEditor
            value={about.story.contentHtml}
            onChange={(contentHtml) =>
              patchAbout((current) => ({
                ...current,
                story: { ...current.story, contentHtml },
              }))
            }
          />
          <SingleMediaField
            label="Ảnh câu chuyện"
            pickerTitle="Chọn ảnh câu chuyện"
            value={about.story.media ? [about.story.media] : []}
            onChange={(items) =>
              patchAbout((current) => ({
                ...current,
                story: {
                  ...current.story,
                  mediaId: items[0]?.id ?? null,
                  media: items[0] ?? null,
                },
              }))
            }
          />
        </FormSection>

        <FormSection title="Giá trị / Phong cách">
          <TextField
            label="Tiêu đề"
            value={about.philosophy.heading}
            onChange={(heading) =>
              patchAbout((current) => ({
                ...current,
                philosophy: { ...current.philosophy, heading },
              }))
            }
            maxLength={180}
          />
          <EditableItems
            addLabel="Thêm mục"
            canAdd={about.philosophy.items.length < maxPhilosophyItems}
            onAdd={() =>
              patchAbout((current) => ({
                ...current,
                philosophy: {
                  ...current.philosophy,
                  items: [
                    ...current.philosophy.items,
                    { title: "", description: "" },
                  ],
                },
              }))
            }
          >
            {about.philosophy.items.map((item, index) => (
              <EditableItem key={`philosophy-${index}`} index={index}>
                <TextField
                  label="Tiêu đề"
                  value={item.title}
                  onChange={(title) =>
                    patchAbout((current) => ({
                      ...current,
                      philosophy: {
                        ...current.philosophy,
                        items: current.philosophy.items.map(
                          (entry, itemIndex) =>
                            itemIndex === index ? { ...entry, title } : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={120}
                />
                <TextArea
                  label="Mô tả"
                  value={item.description}
                  onChange={(description) =>
                    patchAbout((current) => ({
                      ...current,
                      philosophy: {
                        ...current.philosophy,
                        items: current.philosophy.items.map(
                          (entry, itemIndex) =>
                            itemIndex === index
                              ? { ...entry, description }
                              : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={500}
                  rows={3}
                />
                <ItemActions
                  index={index}
                  count={about.philosophy.items.length}
                  onMove={(direction) =>
                    patchAbout((current) => ({
                      ...current,
                      philosophy: {
                        ...current.philosophy,
                        items: moveArrayItem(
                          current.philosophy.items,
                          index,
                          direction,
                        ),
                      },
                    }))
                  }
                  onRemove={() =>
                    patchAbout((current) => ({
                      ...current,
                      philosophy: {
                        ...current.philosophy,
                        items: current.philosophy.items.filter(
                          (_entry, itemIndex) => itemIndex !== index,
                        ),
                      },
                    }))
                  }
                />
              </EditableItem>
            ))}
          </EditableItems>
        </FormSection>

        <FormSection title="Đội ngũ">
          <ToggleField
            label="Hiển thị mục này"
            checked={about.team.enabled}
            onChange={(enabled) =>
              patchAbout((current) => ({
                ...current,
                team: { ...current.team, enabled },
              }))
            }
          />
          <TextField
            label="Tiêu đề"
            value={about.team.heading}
            onChange={(heading) =>
              patchAbout((current) => ({
                ...current,
                team: { ...current.team, heading },
              }))
            }
            maxLength={180}
          />
          <EditableItems
            addLabel="Thêm thành viên"
            canAdd={about.team.members.length < maxTeamMembers}
            onAdd={() =>
              patchAbout((current) => ({
                ...current,
                team: {
                  ...current.team,
                  members: [
                    ...current.team.members,
                    { name: "", role: "", bio: "", mediaId: null, media: null },
                  ],
                },
              }))
            }
          >
            {about.team.members.map((member, index) => (
              <EditableItem key={`team-${index}`} index={index}>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Tên"
                    value={member.name}
                    onChange={(name) =>
                      patchAbout((current) => ({
                        ...current,
                        team: {
                          ...current.team,
                          members: current.team.members.map(
                            (entry, itemIndex) =>
                              itemIndex === index ? { ...entry, name } : entry,
                          ),
                        },
                      }))
                    }
                    maxLength={120}
                  />
                  <TextField
                    label="Vai trò"
                    value={member.role}
                    onChange={(role) =>
                      patchAbout((current) => ({
                        ...current,
                        team: {
                          ...current.team,
                          members: current.team.members.map(
                            (entry, itemIndex) =>
                              itemIndex === index ? { ...entry, role } : entry,
                          ),
                        },
                      }))
                    }
                    maxLength={120}
                  />
                </div>
                <TextArea
                  label="Giới thiệu"
                  value={member.bio}
                  onChange={(bio) =>
                    patchAbout((current) => ({
                      ...current,
                      team: {
                        ...current.team,
                        members: current.team.members.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, bio } : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={1000}
                  rows={4}
                />
                <SingleMediaField
                  label="Hình ảnh"
                  pickerTitle="Chọn ảnh thành viên"
                  value={member.media ? [member.media] : []}
                  onChange={(items) =>
                    patchAbout((current) => ({
                      ...current,
                      team: {
                        ...current.team,
                        members: current.team.members.map(
                          (entry, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...entry,
                                  mediaId: items[0]?.id ?? null,
                                  media: items[0] ?? null,
                                }
                              : entry,
                        ),
                      },
                    }))
                  }
                />
                <ItemActions
                  index={index}
                  count={about.team.members.length}
                  onMove={(direction) =>
                    patchAbout((current) => ({
                      ...current,
                      team: {
                        ...current.team,
                        members: moveArrayItem(
                          current.team.members,
                          index,
                          direction,
                        ),
                      },
                    }))
                  }
                  onRemove={() =>
                    patchAbout((current) => ({
                      ...current,
                      team: {
                        ...current.team,
                        members: current.team.members.filter(
                          (_entry, itemIndex) => itemIndex !== index,
                        ),
                      },
                    }))
                  }
                />
              </EditableItem>
            ))}
          </EditableItems>
        </FormSection>

        <FormSection title="Các con số nổi bật">
          <EditableItems
            addLabel="Thêm con số"
            canAdd={about.metrics.length < maxMetrics}
            onAdd={() =>
              patchAbout((current) => ({
                ...current,
                metrics: [...current.metrics, { value: "", label: "" }],
              }))
            }
          >
            {about.metrics.map((metric, index) => (
              <EditableItem key={`metric-${index}`} index={index}>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Số liệu"
                    value={metric.value}
                    onChange={(value) =>
                      patchAbout((current) => ({
                        ...current,
                        metrics: current.metrics.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, value } : entry,
                        ),
                      }))
                    }
                    maxLength={50}
                  />
                  <TextField
                    label="Nhãn hiển thị"
                    value={metric.label}
                    onChange={(label) =>
                      patchAbout((current) => ({
                        ...current,
                        metrics: current.metrics.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, label } : entry,
                        ),
                      }))
                    }
                    maxLength={120}
                  />
                </div>
                <ItemActions
                  index={index}
                  count={about.metrics.length}
                  onMove={(direction) =>
                    patchAbout((current) => ({
                      ...current,
                      metrics: moveArrayItem(current.metrics, index, direction),
                    }))
                  }
                  onRemove={() =>
                    patchAbout((current) => ({
                      ...current,
                      metrics: current.metrics.filter(
                        (_entry, itemIndex) => itemIndex !== index,
                      ),
                    }))
                  }
                />
              </EditableItem>
            ))}
          </EditableItems>
        </FormSection>

        <FormSection title="Hình ảnh Studio">
          <MultiMediaField
            label="Hình ảnh"
            pickerTitle="Chọn hình ảnh"
            value={about.gallery}
            onChange={(items) =>
              patchAbout((current) => ({
                ...current,
                gallery: items,
                galleryMediaIds: items.map((item) => item.id),
              }))
            }
            maxSelection={maxGalleryItems}
          />
        </FormSection>

        <FormSection title="Khu vực đặt lịch">
          <TextField
            label="Tiêu đề"
            value={about.bookingCta.heading}
            onChange={(heading) =>
              patchAbout((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, heading },
              }))
            }
            maxLength={180}
          />
          <TextArea
            label="Mô tả"
            value={about.bookingCta.description}
            onChange={(description) =>
              patchAbout((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, description },
              }))
            }
            maxLength={500}
            rows={3}
          />
          <TextField
            label="Chữ trên nút"
            value={about.bookingCta.buttonLabel}
            onChange={(buttonLabel) =>
              patchAbout((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, buttonLabel },
              }))
            }
            maxLength={80}
          />
        </FormSection>

        <FormSection title="SEO">
          <TextField
            label="Tiêu đề SEO"
            value={about.seo.title}
            onChange={(title) =>
              patchAbout((current) => ({
                ...current,
                seo: { ...current.seo, title },
              }))
            }
            maxLength={70}
          />
          <TextArea
            label="Mô tả SEO"
            value={about.seo.description}
            onChange={(description) =>
              patchAbout((current) => ({
                ...current,
                seo: { ...current.seo, description },
              }))
            }
            maxLength={180}
            rows={3}
          />
          <SingleMediaField
            label="Ảnh chia sẻ"
            pickerTitle="Chọn ảnh chia sẻ trang giới thiệu"
            value={about.seo.ogImage ? [about.seo.ogImage] : []}
            onChange={(items) =>
              patchAbout((current) => ({
                ...current,
                seo: {
                  ...current.seo,
                  ogImageMediaId: items[0]?.id ?? null,
                  ogImage: items[0] ?? null,
                },
              }))
            }
          />
        </FormSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? "Đang lưu..." : "Lưu giới thiệu"}
          </button>
        </div>
      </form>
    </section>
  );
}

function EditableItems({
  addLabel,
  canAdd,
  onAdd,
  children,
}: {
  addLabel: string;
  canAdd: boolean;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EditableItem({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-zinc-500">
        Mục {index + 1}
      </p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ItemActions({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        Di chuyển lên
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        Di chuyển xuống
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
      >
        Gỡ bỏ
      </button>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-[240px_1fr]">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
      />
      {label}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required={required}
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  maxLength,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows: number;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={rows}
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function moveArrayItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(index, 1);

  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}
