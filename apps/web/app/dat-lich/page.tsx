import type { Metadata } from "next";
import { PageHero } from "@/components/ui/public-ui";
import { getLocations } from "@/lib/api/locations";
import { getPackages } from "@/lib/api/packages";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = {
  title: "Đặt lịch | Studio",
  description:
    "Gửi yêu cầu đặt lịch chụp ảnh với Studio để được liên hệ xác nhận lịch.",
};

interface BookingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const packageSlug = getFirstParam(resolvedSearchParams.package);
  const locationSlug = getFirstParam(resolvedSearchParams.location);
  const [packageResponse, locations] = await Promise.all([
    getPackages(
      {
        page: 1,
        limit: 100,
      },
      {
        cache: "no-store",
      },
    ),
    getLocations({
      cache: "no-store",
    }),
  ]);

  return (
    <main>
      <PageHero
        eyebrow="Đặt lịch"
        title="Đặt lịch chụp"
        description="Gửi thông tin, Studio sẽ liên hệ xác nhận lịch và tư vấn cách chuẩn bị trước buổi chụp."
      />

      <section className="public-section">
        <div className="site-container grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <div className="border-t border-[var(--color-border)] pt-6">
              <p className="section-eyebrow">Quy trình</p>
              <ol className="mt-6 grid gap-5 text-sm leading-7 text-[var(--color-muted)]">
                {[
                  "Chọn gói chụp phù hợp",
                  "Đề xuất ngày và giờ mong muốn",
                  "Để lại thông tin liên hệ",
                  "Studio liên hệ xác nhận lịch",
                ].map((item, index) => (
                  <li key={item} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-extrabold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-7 text-sm leading-7 text-[var(--color-muted)]">
                Yêu cầu đặt lịch chưa phải lịch đã xác nhận. Studio sẽ kiểm tra
                lịch trống và phản hồi lại bạn.
              </p>
            </div>
          </aside>

          <BookingForm
            packages={packageResponse?.data ?? []}
            locations={locations}
            preselectedPackageSlug={packageSlug}
            preselectedLocationSlug={locationSlug}
          />
        </div>
      </section>
    </main>
  );
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
