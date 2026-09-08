import type { ContactStatus } from "@/lib/api/contacts";

export const contactStatusLabels: Record<ContactStatus, string> = {
  new: "M\u1edbi",
  read: "Đã xem",
  replied: "\u0110\u00e3 ph\u1ea3n h\u1ed3i",
  archived: "Đã lưu trữ",
};

export function getContactStatusClass(status: ContactStatus): string {
  switch (status) {
    case "new":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "read":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "replied":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "archived":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}
