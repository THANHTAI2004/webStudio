import { ApiError } from "@/lib/api/client";

export type PublishStatus = "draft" | "published" | "hidden";

export const publishStatusLabels: Record<PublishStatus, string> = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  hidden: "Đã ẩn",
};

export const featuredLabels = {
  all: "Tất cả nổi bật",
  featured: "Nổi bật",
  notFeatured: "Không nổi bật",
};

export const activeLabels = {
  all: "Tất cả trạng thái",
  active: "Đang hiển thị",
  inactive: "Đã ẩn",
};

export const emptyLabel = "Chưa có dữ liệu";
export const unassignedLabel = "Chưa chọn";
export const customLabel = "Tự nhập";
export const defaultErrorMessage = "Có lỗi xảy ra. Vui lòng thử lại.";
export const loadErrorMessage = "Không thể tải dữ liệu. Vui lòng thử lại.";
export const saveErrorMessage = "Không thể lưu thay đổi. Vui lòng thử lại.";
export const deleteErrorMessage = "Không thể xóa dữ liệu. Vui lòng thử lại.";

const technicalErrorMessages: Record<string, string> = {
  ALBUM_CATEGORY_IN_USE: "Danh mục album đang được sử dụng và chưa thể xóa.",
  ALBUM_CATEGORY_SLUG_EXISTS: "Đường dẫn danh mục album đã được sử dụng.",
  ALBUM_NOT_FOUND: "Album không còn tồn tại hoặc đã bị xóa.",
  ALBUM_SLUG_EXISTS: "Đường dẫn album đã được sử dụng.",
  CATEGORY_IN_USE: "Danh mục đang được sử dụng và chưa thể xóa.",
  CATEGORY_SLUG_EXISTS: "Đường dẫn danh mục đã được sử dụng.",
  FILE_TOO_LARGE: "Ảnh vượt quá dung lượng cho phép.",
  IMAGE_TOO_LARGE: "Ảnh vượt quá dung lượng cho phép.",
  INVALID_ALBUM_CATEGORY_SLUG: "Đường dẫn danh mục album không hợp lệ.",
  INVALID_ALBUM_SLUG: "Đường dẫn album không hợp lệ.",
  INVALID_BOOKING_STATUS_TRANSITION:
    "Không thể chuyển sang trạng thái này từ trạng thái hiện tại.",
  INVALID_CATEGORY_SLUG: "Đường dẫn danh mục không hợp lệ.",
  INVALID_HOME_ALBUM_REFERENCE: "Album đã chọn không còn khả dụng.",
  INVALID_HOME_PACKAGE_REFERENCE: "Gói chụp đã chọn không còn khả dụng.",
  INVALID_HOME_SECTION_ORDER: "Thứ tự mục hiển thị không hợp lệ.",
  INVALID_IMAGE: "Tệp đã chọn không phải là ảnh hợp lệ.",
  INVALID_LOCATION_SLUG: "Đường dẫn cơ sở không hợp lệ.",
  INVALID_MEDIA_ID: "Ảnh đã chọn không hợp lệ hoặc không còn tồn tại.",
  INVALID_PACKAGE_SLUG: "Đường dẫn gói chụp không hợp lệ.",
  INVALID_POST_CATEGORY_SLUG: "Đường dẫn danh mục bài viết không hợp lệ.",
  INVALID_POST_SLUG: "Đường dẫn bài viết không hợp lệ.",
  INVALID_SLUG: "Đường dẫn không hợp lệ.",
  LOCATION_NOT_FOUND: "Cơ sở không còn tồn tại hoặc đã bị xóa.",
  LOCATION_SLUG_EXISTS: "Đường dẫn cơ sở đã được sử dụng.",
  MEDIA_IN_USE: "Ảnh này đang được sử dụng và chưa thể xóa.",
  MEDIA_NOT_FOUND: "Ảnh không còn tồn tại hoặc đã bị xóa.",
  PACKAGE_NOT_FOUND: "Gói chụp không còn tồn tại hoặc đã bị xóa.",
  PACKAGE_SLUG_EXISTS: "Đường dẫn gói chụp đã được sử dụng.",
  POST_CATEGORY_IN_USE:
    "Danh mục bài viết đang được sử dụng và chưa thể xóa.",
  POST_CATEGORY_SLUG_EXISTS: "Đường dẫn danh mục bài viết đã được sử dụng.",
  POST_NOT_FOUND: "Bài viết không còn tồn tại hoặc đã bị xóa.",
  POST_SLUG_EXISTS: "Đường dẫn bài viết đã được sử dụng.",
  UNSUPPORTED_MEDIA_TYPE:
    "Định dạng ảnh chưa được hỗ trợ. Vui lòng dùng JPEG, PNG hoặc WebP.",
  UPLOAD_FAILED: "Không thể tải ảnh lên. Vui lòng thử lại.",
};

export function yesNoLabel(value: boolean): string {
  return value ? "Có" : "Không";
}

export function formatAdminDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatAdminDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAdminErrorMessage(
  error: unknown,
  fallback = defaultErrorMessage,
): string {
  const code = getAdminErrorCode(error);

  if (code && technicalErrorMessages[code]) {
    return technicalErrorMessages[code];
  }

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (!message || isTechnicalOrEnglishMessage(message)) {
    return fallback;
  }

  return message;
}

function getAdminErrorCode(error: unknown): string | null {
  if (error instanceof ApiError) {
    return getErrorCodeFromPayload(error.details) ?? getErrorCodeFromMessage(error.message);
  }

  if (error instanceof Error) {
    return getErrorCodeFromMessage(error.message);
  }

  return getErrorCodeFromPayload(error);
}

function getErrorCodeFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const code = (payload as { code?: unknown }).code;

  if (typeof code === "string" && code.trim()) {
    return code.trim().toUpperCase();
  }

  const details = (payload as { details?: unknown }).details;

  if (details && details !== payload) {
    return getErrorCodeFromPayload(details);
  }

  return null;
}

function getErrorCodeFromMessage(message: string): string | null {
  const normalized = message.trim().toUpperCase();

  if (/^[A-Z0-9_]+$/.test(normalized)) {
    return normalized;
  }

  return (
    Object.keys(technicalErrorMessages).find((code) =>
      normalized.includes(code),
    ) ?? null
  );
}

function isTechnicalOrEnglishMessage(message: string): boolean {
  return (
    /^[A-Z0-9_]+$/.test(message) ||
    /^[\x00-\x7F]+$/.test(message) ||
    message.includes("{") ||
    message.includes("}") ||
    message.toLowerCase().includes("stack")
  );
}
