import Link from "next/link";

export default function NotFound() {
  return (
    <main className="public-section">
      <div className="site-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">404</p>
          <h1 className="display-heading">Không tìm thấy trang</h1>
          <p className="page-hero__lead mx-auto">
            Trang bạn đang tìm có thể đã được di chuyển hoặc không còn tồn tại.
            Bạn có thể quay về trang chủ để tiếp tục khám phá Studio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="theme-button-primary">
              Về trang chủ
            </Link>
            <Link href="/goi-chup" className="theme-button-secondary">
              Xem gói chụp
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
