"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  type AdminTheme,
  type ThemeBodyFont,
  type ThemeButtonStyle,
  type ThemeHeadingFont,
  getTheme,
  updateTheme,
} from "@/lib/api/theme";
import { withAuthRefresh } from "@/lib/api/session";
import { getPublicUrl } from "@/lib/site-url";

const colorFields: Array<{
  key: keyof AdminTheme["colors"];
  label: string;
}> = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "mutedText", label: "Muted Text" },
  { key: "border", label: "Border" },
  { key: "accent", label: "Accent" },
];

const headingFonts: ThemeHeadingFont[] = ["serif", "sans", "elegant"];
const bodyFonts: ThemeBodyFont[] = ["sans", "serif"];
const buttonStyles: ThemeButtonStyle[] = ["solid", "outline"];
const hexPattern = /^#[0-9A-Fa-f]{6}$/;

export default function ThemePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<AdminTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const loadTheme = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await withAuthRefresh(getTheme, redirectToLogin);

      if (response) {
        setTheme(response.data);
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to load theme."));
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTheme();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadTheme]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!theme) {
      return;
    }

    if (Object.values(theme.colors).some((value) => !hexPattern.test(value))) {
      setError("Colors must use #RRGGBB hex format.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const response = await withAuthRefresh(
        () =>
          updateTheme({
            colors: theme.colors,
            buttons: theme.buttons,
            cards: theme.cards,
            layout: theme.layout,
            typography: theme.typography,
          }),
        redirectToLogin,
      );

      if (response) {
        setTheme(response.data);
        setNotice("Theme saved.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to save theme."));
    } finally {
      setIsSaving(false);
    }
  }

  function updateColors(
    key: keyof AdminTheme["colors"],
    value: AdminTheme["colors"][keyof AdminTheme["colors"]],
  ) {
    setTheme((current) =>
      current
        ? {
            ...current,
            colors: {
              ...current.colors,
              [key]: value,
            },
          }
        : current,
    );
  }

  if (isLoading || !theme) {
    return (
      <main className="mx-auto w-full max-w-5xl">
        <p className="text-sm text-zinc-600">Loading theme...</p>
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
            Theme
          </h1>
        </div>
        <Link
          href={getPublicUrl("/")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-zinc-50"
        >
          View site
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
        <FormSection title="Colors">
          <div className="grid gap-4 md:grid-cols-2">
            {colorFields.map((field) => (
              <ColorField
                key={field.key}
                label={field.label}
                value={theme.colors[field.key]}
                onChange={(value) => updateColors(field.key, value)}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="Buttons">
          <div className="grid gap-5 md:grid-cols-2">
            <NumberField
              label="Radius"
              value={theme.buttons.radius}
              min={0}
              max={40}
              onChange={(radius) =>
                setTheme({
                  ...theme,
                  buttons: {
                    ...theme.buttons,
                    radius,
                  },
                })
              }
            />
            <SelectField
              label="Style"
              value={theme.buttons.style}
              options={buttonStyles}
              onChange={(style) =>
                setTheme({
                  ...theme,
                  buttons: {
                    ...theme.buttons,
                    style: style as ThemeButtonStyle,
                  },
                })
              }
            />
          </div>
        </FormSection>

        <FormSection title="Cards">
          <NumberField
            label="Radius"
            value={theme.cards.radius}
            min={0}
            max={40}
            onChange={(radius) =>
              setTheme({
                ...theme,
                cards: {
                  ...theme.cards,
                  radius,
                },
              })
            }
          />
        </FormSection>

        <FormSection title="Layout">
          <NumberField
            label="Max width"
            value={theme.layout.maxWidth}
            min={960}
            max={1600}
            onChange={(maxWidth) =>
              setTheme({
                ...theme,
                layout: {
                  maxWidth,
                },
              })
            }
          />
        </FormSection>

        <FormSection title="Typography">
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Heading font"
              value={theme.typography.headingFont}
              options={headingFonts}
              onChange={(headingFont) =>
                setTheme({
                  ...theme,
                  typography: {
                    ...theme.typography,
                    headingFont: headingFont as ThemeHeadingFont,
                  },
                })
              }
            />
            <SelectField
              label="Body font"
              value={theme.typography.bodyFont}
              options={bodyFonts}
              onChange={(bodyFont) =>
                setTheme({
                  ...theme,
                  typography: {
                    ...theme.typography,
                    bodyFont: bodyFont as ThemeBodyFont,
                  },
                })
              }
            />
          </div>
        </FormSection>

        <FormSection title="Preview">
          <ThemePreview theme={theme} />
        </FormSection>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSaving ? "Saving..." : "Save Theme"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ThemePreview({ theme }: { theme: AdminTheme }) {
  const headingFont = getFontStack(theme.typography.headingFont);
  const bodyFont = getFontStack(theme.typography.bodyFont);
  const buttonRadius = `${theme.buttons.radius}px`;
  const cardRadius = `${theme.cards.radius}px`;

  const previewStyle: CSSProperties = {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    fontFamily: bodyFont,
  };
  const cardStyle: CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: cardRadius,
  };
  const primaryButtonStyle: CSSProperties =
    theme.buttons.style === "outline"
      ? {
          borderColor: theme.colors.primary,
          borderRadius: buttonRadius,
          color: theme.colors.primary,
        }
      : {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderRadius: buttonRadius,
          color: theme.colors.surface,
        };
  const secondaryButtonStyle: CSSProperties = {
    borderColor: theme.colors.secondary,
    borderRadius: buttonRadius,
    color: theme.colors.secondary,
  };

  return (
    <div className="rounded-md border p-6" style={previewStyle}>
      <div className="max-w-xl">
        <p
          className="text-sm font-semibold uppercase tracking-normal"
          style={{ color: theme.colors.accent }}
        >
          Preview
        </p>
        <h2
          className="mt-3 text-3xl font-semibold tracking-normal"
          style={{ fontFamily: headingFont }}
        >
          A calm studio visual system
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: theme.colors.mutedText }}>
          This preview uses the same safe CSS values the public site receives
          from the Theme API.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="border px-4 py-2 text-sm font-semibold"
            style={primaryButtonStyle}
          >
            Primary button
          </button>
          <button
            type="button"
            className="border bg-transparent px-4 py-2 text-sm font-semibold"
            style={secondaryButtonStyle}
          >
            Secondary button
          </button>
        </div>
        <div className="mt-6 border p-4" style={cardStyle}>
          <h3
            className="text-base font-semibold"
            style={{ fontFamily: headingFont }}
          >
            Card title
          </h3>
          <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.mutedText }}>
            Surface, border, text, muted text, and radius are applied here.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 border-b border-zinc-200 pb-8 lg:grid-cols-[240px_1fr]">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const pickerValue = hexPattern.test(value) ? value : "#000000";

  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <div className="mt-2 flex gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-12 rounded-md border border-zinc-300 bg-white p-1"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.trim())}
          maxLength={7}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm uppercase outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
    </label>
  );
}

function NumberField({
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
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_120px]">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full"
        />
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function getFontStack(font: ThemeHeadingFont | ThemeBodyFont): string {
  switch (font) {
    case "serif":
      return 'Georgia, "Times New Roman", serif';
    case "elegant":
      return "Georgia, serif";
    case "sans":
    default:
      return "Arial, Helvetica, sans-serif";
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
