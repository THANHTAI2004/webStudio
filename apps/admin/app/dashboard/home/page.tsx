"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  EntitySelector,
  type SelectableEntity,
} from "@/components/cms/entity-selector";
import { SingleMediaField } from "@/components/cms/media-field";
import type { MediaChoice } from "@/components/media/media-picker";
import { type AdminAlbum, getAlbums } from "@/lib/api/albums";
import {
  type AdminHome,
  type HomeFeaturedMode,
  type HomeInput,
  type HomeSectionKey,
  getHome,
  updateHome,
} from "@/lib/api/home";
import { type AdminPackage, getPackages } from "@/lib/api/packages";
import { withAuthRefresh } from "@/lib/api/session";

const homeSections: Array<{ key: HomeSectionKey; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "aboutPreview", label: "About preview" },
  { key: "featuredPackages", label: "Featured packages" },
  { key: "featuredAlbums", label: "Featured albums" },
  { key: "usp", label: "USP" },
  { key: "testimonials", label: "Testimonials" },
  { key: "latestPosts", label: "Latest posts" },
  { key: "locations", label: "Locations" },
  { key: "bookingCta", label: "Booking CTA" },
];

const featuredModes: HomeFeaturedMode[] = ["automatic", "manual"];
const maxFeaturedItems = 12;
const maxUspItems = 8;
const maxTestimonials = 12;

export default function HomeCmsPage() {
  const router = useRouter();
  const [home, setHome] = useState<AdminHome | null>(null);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [albums, setAlbums] = useState<AdminAlbum[]>([]);
  const [heroBackground, setHeroBackground] = useState<MediaChoice[]>([]);
  const [aboutMedia, setAboutMedia] = useState<MediaChoice[]>([]);
  const [bookingBackground, setBookingBackground] = useState<MediaChoice[]>([]);
  const [seoImage, setSeoImage] = useState<MediaChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const applyMediaState = useCallback((nextHome: AdminHome) => {
    setHeroBackground(
      nextHome.hero.background ? [nextHome.hero.background] : [],
    );
    setAboutMedia(
      nextHome.aboutPreview.media ? [nextHome.aboutPreview.media] : [],
    );
    setBookingBackground(
      nextHome.bookingCta.background ? [nextHome.bookingCta.background] : [],
    );
    setSeoImage(nextHome.seo.ogImage ? [nextHome.seo.ogImage] : []);
  }, []);

  const packageOptions = useMemo(
    () =>
      packages.map<SelectableEntity>((item) => ({
        id: item.id,
        label: item.name,
        detail: [item.category?.name, item.status, item.isFeatured ? "featured" : ""]
          .filter(Boolean)
          .join(" / "),
      })),
    [packages],
  );
  const albumOptions = useMemo(
    () =>
      albums.map<SelectableEntity>((item) => ({
        id: item.id,
        label: item.title,
        detail: [item.category?.name, item.status, item.isFeatured ? "featured" : ""]
          .filter(Boolean)
          .join(" / "),
      })),
    [albums],
  );

  const loadHome = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(
        () =>
          Promise.all([
            getHome(),
            getPackages({ page: 1, limit: 100, sort: "sortOrder:asc" }),
            getAlbums({ page: 1, limit: 100, sort: "sortOrder:asc" }),
          ]),
        redirectToLogin,
      );

      if (!response) {
        return;
      }

      const [homeResponse, packagesResponse, albumsResponse] = response;

      setHome(homeResponse.data);
      setPackages(packagesResponse.data);
      setAlbums(albumsResponse.data);
      applyMediaState(homeResponse.data);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to load homepage CMS."));
    } finally {
      setIsLoading(false);
    }
  }, [applyMediaState, redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHome();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadHome]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!home) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await withAuthRefresh(
        () => updateHome(buildPayload(home)),
        redirectToLogin,
      );

      if (response) {
        setHome(response.data);
        applyMediaState(response.data);
        setNotice("Homepage saved.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save homepage."));
    } finally {
      setIsSaving(false);
    }
  }

  function buildPayload(currentHome: AdminHome): HomeInput {
    return {
      hero: {
        enabled: currentHome.hero.enabled,
        eyebrow: currentHome.hero.eyebrow,
        title: currentHome.hero.title,
        subtitle: currentHome.hero.subtitle,
        backgroundMediaId: heroBackground[0]?.id ?? null,
        primaryCta: currentHome.hero.primaryCta,
        secondaryCta: currentHome.hero.secondaryCta,
      },
      aboutPreview: {
        enabled: currentHome.aboutPreview.enabled,
        heading: currentHome.aboutPreview.heading,
        description: currentHome.aboutPreview.description,
        mediaId: aboutMedia[0]?.id ?? null,
        buttonLabel: currentHome.aboutPreview.buttonLabel,
      },
      featuredPackages: {
        enabled: currentHome.featuredPackages.enabled,
        heading: currentHome.featuredPackages.heading,
        description: currentHome.featuredPackages.description,
        mode: currentHome.featuredPackages.mode,
        packageIds: currentHome.featuredPackages.packageIds,
        limit: currentHome.featuredPackages.limit,
      },
      featuredAlbums: {
        enabled: currentHome.featuredAlbums.enabled,
        heading: currentHome.featuredAlbums.heading,
        description: currentHome.featuredAlbums.description,
        mode: currentHome.featuredAlbums.mode,
        albumIds: currentHome.featuredAlbums.albumIds,
        limit: currentHome.featuredAlbums.limit,
      },
      usp: currentHome.usp,
      testimonials: currentHome.testimonials,
      latestPosts: currentHome.latestPosts,
      locations: currentHome.locations,
      bookingCta: {
        enabled: currentHome.bookingCta.enabled,
        heading: currentHome.bookingCta.heading,
        description: currentHome.bookingCta.description,
        buttonLabel: currentHome.bookingCta.buttonLabel,
        backgroundMediaId: bookingBackground[0]?.id ?? null,
      },
      sectionOrder: currentHome.sectionOrder,
      seo: {
        title: currentHome.seo.title,
        description: currentHome.seo.description,
        ogImageMediaId: seoImage[0]?.id ?? null,
      },
    };
  }

  function patchHome(patcher: (currentHome: AdminHome) => AdminHome) {
    setHome((current) => (current ? patcher(current) : current));
  }

  function moveSection(index: number, direction: -1 | 1) {
    patchHome((current) => ({
      ...current,
      sectionOrder: moveArrayItem(current.sectionOrder, index, direction),
    }));
  }

  if (isLoading || !home) {
    return (
      <main className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-zinc-600">Loading homepage CMS...</p>
      </main>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-700">
            CMS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Homepage
          </h1>
        </div>
        <Link
          href={getPublicUrl("/")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-zinc-50"
        >
          View page
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
        <FormSection title="Section order">
          <div className="space-y-3">
            {home.sectionOrder.map((sectionKey, index) => (
              <div
                key={sectionKey}
                className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3"
              >
                <p className="min-w-0 flex-1 text-sm font-semibold">
                  {getSectionLabel(sectionKey)}
                </p>
                <button
                  type="button"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === home.sectionOrder.length - 1}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
                >
                  Move Down
                </button>
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection title="Hero">
          <ToggleField
            label="Enabled"
            checked={home.hero.enabled}
            onChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                hero: { ...current.hero, enabled },
              }))
            }
          />
          <TextField
            label="Eyebrow"
            value={home.hero.eyebrow}
            onChange={(eyebrow) =>
              patchHome((current) => ({
                ...current,
                hero: { ...current.hero, eyebrow },
              }))
            }
            maxLength={120}
          />
          <TextField
            label="Title"
            value={home.hero.title}
            onChange={(title) =>
              patchHome((current) => ({
                ...current,
                hero: { ...current.hero, title },
              }))
            }
            maxLength={180}
            required
          />
          <TextArea
            label="Subtitle"
            value={home.hero.subtitle}
            onChange={(subtitle) =>
              patchHome((current) => ({
                ...current,
                hero: { ...current.hero, subtitle },
              }))
            }
            maxLength={500}
            rows={4}
          />
          <SingleMediaField
            label="Background"
            pickerTitle="Choose hero background"
            value={heroBackground}
            onChange={setHeroBackground}
          />
          <CtaFields
            title="Primary CTA"
            value={home.hero.primaryCta}
            onChange={(primaryCta) =>
              patchHome((current) => ({
                ...current,
                hero: { ...current.hero, primaryCta },
              }))
            }
          />
          <CtaFields
            title="Secondary CTA"
            value={home.hero.secondaryCta}
            onChange={(secondaryCta) =>
              patchHome((current) => ({
                ...current,
                hero: { ...current.hero, secondaryCta },
              }))
            }
          />
        </FormSection>

        <FormSection title="About preview">
          <ToggleField
            label="Enabled"
            checked={home.aboutPreview.enabled}
            onChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                aboutPreview: { ...current.aboutPreview, enabled },
              }))
            }
          />
          <TextField
            label="Heading"
            value={home.aboutPreview.heading}
            onChange={(heading) =>
              patchHome((current) => ({
                ...current,
                aboutPreview: { ...current.aboutPreview, heading },
              }))
            }
            maxLength={180}
          />
          <TextArea
            label="Description"
            value={home.aboutPreview.description}
            onChange={(description) =>
              patchHome((current) => ({
                ...current,
                aboutPreview: { ...current.aboutPreview, description },
              }))
            }
            maxLength={700}
            rows={4}
          />
          <SingleMediaField
            label="Image"
            pickerTitle="Choose about image"
            value={aboutMedia}
            onChange={setAboutMedia}
          />
          <TextField
            label="Button label"
            value={home.aboutPreview.buttonLabel}
            onChange={(buttonLabel) =>
              patchHome((current) => ({
                ...current,
                aboutPreview: { ...current.aboutPreview, buttonLabel },
              }))
            }
            maxLength={80}
          />
        </FormSection>

        <FormSection title="Featured packages">
          <FeaturedFields
            enabled={home.featuredPackages.enabled}
            heading={home.featuredPackages.heading}
            description={home.featuredPackages.description}
            mode={home.featuredPackages.mode}
            limit={home.featuredPackages.limit}
            onEnabledChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                featuredPackages: { ...current.featuredPackages, enabled },
              }))
            }
            onHeadingChange={(heading) =>
              patchHome((current) => ({
                ...current,
                featuredPackages: { ...current.featuredPackages, heading },
              }))
            }
            onDescriptionChange={(description) =>
              patchHome((current) => ({
                ...current,
                featuredPackages: {
                  ...current.featuredPackages,
                  description,
                },
              }))
            }
            onModeChange={(mode) =>
              patchHome((current) => ({
                ...current,
                featuredPackages: { ...current.featuredPackages, mode },
              }))
            }
            onLimitChange={(limit) =>
              patchHome((current) => ({
                ...current,
                featuredPackages: { ...current.featuredPackages, limit },
              }))
            }
          />
          {home.featuredPackages.mode === "manual" ? (
            <EntitySelector
              title="Packages"
              items={packageOptions}
              selectedIds={home.featuredPackages.packageIds}
              onChange={(packageIds) =>
                patchHome((current) => ({
                  ...current,
                  featuredPackages: {
                    ...current.featuredPackages,
                    packageIds,
                  },
                }))
              }
              maxSelection={maxFeaturedItems}
            />
          ) : null}
        </FormSection>

        <FormSection title="Featured albums">
          <FeaturedFields
            enabled={home.featuredAlbums.enabled}
            heading={home.featuredAlbums.heading}
            description={home.featuredAlbums.description}
            mode={home.featuredAlbums.mode}
            limit={home.featuredAlbums.limit}
            onEnabledChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                featuredAlbums: { ...current.featuredAlbums, enabled },
              }))
            }
            onHeadingChange={(heading) =>
              patchHome((current) => ({
                ...current,
                featuredAlbums: { ...current.featuredAlbums, heading },
              }))
            }
            onDescriptionChange={(description) =>
              patchHome((current) => ({
                ...current,
                featuredAlbums: {
                  ...current.featuredAlbums,
                  description,
                },
              }))
            }
            onModeChange={(mode) =>
              patchHome((current) => ({
                ...current,
                featuredAlbums: { ...current.featuredAlbums, mode },
              }))
            }
            onLimitChange={(limit) =>
              patchHome((current) => ({
                ...current,
                featuredAlbums: { ...current.featuredAlbums, limit },
              }))
            }
          />
          {home.featuredAlbums.mode === "manual" ? (
            <EntitySelector
              title="Albums"
              items={albumOptions}
              selectedIds={home.featuredAlbums.albumIds}
              onChange={(albumIds) =>
                patchHome((current) => ({
                  ...current,
                  featuredAlbums: {
                    ...current.featuredAlbums,
                    albumIds,
                  },
                }))
              }
              maxSelection={maxFeaturedItems}
            />
          ) : null}
        </FormSection>

        <FormSection title="USP">
          <ToggleField
            label="Enabled"
            checked={home.usp.enabled}
            onChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                usp: { ...current.usp, enabled },
              }))
            }
          />
          <TextField
            label="Heading"
            value={home.usp.heading}
            onChange={(heading) =>
              patchHome((current) => ({
                ...current,
                usp: { ...current.usp, heading },
              }))
            }
            maxLength={180}
          />
          <EditableItems
            addLabel="Add USP"
            canAdd={home.usp.items.length < maxUspItems}
            onAdd={() =>
              patchHome((current) => ({
                ...current,
                usp: {
                  ...current.usp,
                  items: [
                    ...current.usp.items,
                    { title: "", description: "" },
                  ],
                },
              }))
            }
          >
            {home.usp.items.map((item, index) => (
              <EditableItem key={`usp-${index}`} index={index}>
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) =>
                    patchHome((current) => ({
                      ...current,
                      usp: {
                        ...current.usp,
                        items: current.usp.items.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, title } : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={120}
                />
                <TextArea
                  label="Description"
                  value={item.description}
                  onChange={(description) =>
                    patchHome((current) => ({
                      ...current,
                      usp: {
                        ...current.usp,
                        items: current.usp.items.map((entry, itemIndex) =>
                          itemIndex === index
                            ? { ...entry, description }
                            : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={300}
                  rows={3}
                />
                <ItemActions
                  index={index}
                  count={home.usp.items.length}
                  onMove={(direction) =>
                    patchHome((current) => ({
                      ...current,
                      usp: {
                        ...current.usp,
                        items: moveArrayItem(current.usp.items, index, direction),
                      },
                    }))
                  }
                  onRemove={() =>
                    patchHome((current) => ({
                      ...current,
                      usp: {
                        ...current.usp,
                        items: current.usp.items.filter(
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

        <FormSection title="Testimonials">
          <ToggleField
            label="Enabled"
            checked={home.testimonials.enabled}
            onChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                testimonials: { ...current.testimonials, enabled },
              }))
            }
          />
          <TextField
            label="Heading"
            value={home.testimonials.heading}
            onChange={(heading) =>
              patchHome((current) => ({
                ...current,
                testimonials: { ...current.testimonials, heading },
              }))
            }
            maxLength={180}
          />
          <EditableItems
            addLabel="Add testimonial"
            canAdd={home.testimonials.items.length < maxTestimonials}
            onAdd={() =>
              patchHome((current) => ({
                ...current,
                testimonials: {
                  ...current.testimonials,
                  items: [
                    ...current.testimonials.items,
                    { customerName: "", content: "" },
                  ],
                },
              }))
            }
          >
            {home.testimonials.items.map((item, index) => (
              <EditableItem key={`testimonial-${index}`} index={index}>
                <TextField
                  label="Customer name"
                  value={item.customerName}
                  onChange={(customerName) =>
                    patchHome((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        items: current.testimonials.items.map(
                          (entry, itemIndex) =>
                            itemIndex === index
                              ? { ...entry, customerName }
                              : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={120}
                />
                <TextArea
                  label="Content"
                  value={item.content}
                  onChange={(content) =>
                    patchHome((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        items: current.testimonials.items.map(
                          (entry, itemIndex) =>
                            itemIndex === index ? { ...entry, content } : entry,
                        ),
                      },
                    }))
                  }
                  maxLength={600}
                  rows={4}
                />
                <ItemActions
                  index={index}
                  count={home.testimonials.items.length}
                  onMove={(direction) =>
                    patchHome((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        items: moveArrayItem(
                          current.testimonials.items,
                          index,
                          direction,
                        ),
                      },
                    }))
                  }
                  onRemove={() =>
                    patchHome((current) => ({
                      ...current,
                      testimonials: {
                        ...current.testimonials,
                        items: current.testimonials.items.filter(
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

        <FormSection title="Latest posts">
          <SectionListFields
            enabled={home.latestPosts.enabled}
            heading={home.latestPosts.heading}
            description={home.latestPosts.description}
            limit={home.latestPosts.limit}
            onEnabledChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                latestPosts: { ...current.latestPosts, enabled },
              }))
            }
            onHeadingChange={(heading) =>
              patchHome((current) => ({
                ...current,
                latestPosts: { ...current.latestPosts, heading },
              }))
            }
            onDescriptionChange={(description) =>
              patchHome((current) => ({
                ...current,
                latestPosts: { ...current.latestPosts, description },
              }))
            }
            onLimitChange={(limit) =>
              patchHome((current) => ({
                ...current,
                latestPosts: { ...current.latestPosts, limit },
              }))
            }
          />
        </FormSection>

        <FormSection title="Locations">
          <SectionListFields
            enabled={home.locations.enabled}
            heading={home.locations.heading}
            description={home.locations.description}
            limit={home.locations.limit}
            onEnabledChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                locations: { ...current.locations, enabled },
              }))
            }
            onHeadingChange={(heading) =>
              patchHome((current) => ({
                ...current,
                locations: { ...current.locations, heading },
              }))
            }
            onDescriptionChange={(description) =>
              patchHome((current) => ({
                ...current,
                locations: { ...current.locations, description },
              }))
            }
            onLimitChange={(limit) =>
              patchHome((current) => ({
                ...current,
                locations: { ...current.locations, limit },
              }))
            }
          />
        </FormSection>

        <FormSection title="Booking CTA">
          <ToggleField
            label="Enabled"
            checked={home.bookingCta.enabled}
            onChange={(enabled) =>
              patchHome((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, enabled },
              }))
            }
          />
          <TextField
            label="Heading"
            value={home.bookingCta.heading}
            onChange={(heading) =>
              patchHome((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, heading },
              }))
            }
            maxLength={180}
          />
          <TextArea
            label="Description"
            value={home.bookingCta.description}
            onChange={(description) =>
              patchHome((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, description },
              }))
            }
            maxLength={500}
            rows={3}
          />
          <TextField
            label="Button label"
            value={home.bookingCta.buttonLabel}
            onChange={(buttonLabel) =>
              patchHome((current) => ({
                ...current,
                bookingCta: { ...current.bookingCta, buttonLabel },
              }))
            }
            maxLength={80}
          />
          <SingleMediaField
            label="Background"
            pickerTitle="Choose booking CTA background"
            value={bookingBackground}
            onChange={setBookingBackground}
          />
        </FormSection>

        <FormSection title="SEO">
          <TextField
            label="SEO Title"
            value={home.seo.title}
            onChange={(title) =>
              patchHome((current) => ({
                ...current,
                seo: { ...current.seo, title },
              }))
            }
            maxLength={70}
          />
          <TextArea
            label="SEO Description"
            value={home.seo.description}
            onChange={(description) =>
              patchHome((current) => ({
                ...current,
                seo: { ...current.seo, description },
              }))
            }
            maxLength={180}
            rows={3}
          />
          <SingleMediaField
            label="OG Image"
            pickerTitle="Choose homepage OG image"
            value={seoImage}
            onChange={setSeoImage}
          />
        </FormSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? "Saving..." : "Save Homepage"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FeaturedFields({
  enabled,
  heading,
  description,
  mode,
  limit,
  onEnabledChange,
  onHeadingChange,
  onDescriptionChange,
  onModeChange,
  onLimitChange,
}: {
  enabled: boolean;
  heading: string;
  description: string;
  mode: HomeFeaturedMode;
  limit: number;
  onEnabledChange: (value: boolean) => void;
  onHeadingChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onModeChange: (value: HomeFeaturedMode) => void;
  onLimitChange: (value: number) => void;
}) {
  return (
    <>
      <ToggleField label="Enabled" checked={enabled} onChange={onEnabledChange} />
      <TextField
        label="Heading"
        value={heading}
        onChange={onHeadingChange}
        maxLength={180}
      />
      <TextArea
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        maxLength={500}
        rows={3}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700">
          Mode
          <select
            value={mode}
            onChange={(event) =>
              onModeChange(event.target.value as HomeFeaturedMode)
            }
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            {featuredModes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <NumberInput
          label="Limit"
          value={limit}
          min={1}
          max={12}
          onChange={onLimitChange}
        />
      </div>
    </>
  );
}

function SectionListFields({
  enabled,
  heading,
  description,
  limit,
  onEnabledChange,
  onHeadingChange,
  onDescriptionChange,
  onLimitChange,
}: {
  enabled: boolean;
  heading: string;
  description: string;
  limit: number;
  onEnabledChange: (value: boolean) => void;
  onHeadingChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLimitChange: (value: number) => void;
}) {
  return (
    <>
      <ToggleField label="Enabled" checked={enabled} onChange={onEnabledChange} />
      <TextField
        label="Heading"
        value={heading}
        onChange={onHeadingChange}
        maxLength={180}
      />
      <TextArea
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        maxLength={500}
        rows={3}
      />
      <NumberInput
        label="Limit"
        value={limit}
        min={1}
        max={12}
        onChange={onLimitChange}
      />
    </>
  );
}

function CtaFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { label: string; href: string };
  onChange: (value: { label: string; href: string }) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField
        label={`${title} label`}
        value={value.label}
        onChange={(label) => onChange({ ...value, label })}
        maxLength={80}
      />
      <TextField
        label={`${title} href`}
        value={value.href}
        onChange={(href) => onChange({ ...value, href })}
        maxLength={500}
      />
    </div>
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
        Item {index + 1}
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
        Move Up
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        Move Down
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
      >
        Remove
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

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
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

function getSectionLabel(key: HomeSectionKey): string {
  return homeSections.find((item) => item.key === key)?.label ?? key;
}

function getPublicUrl(path: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return new URL(path, siteUrl).toString();
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
