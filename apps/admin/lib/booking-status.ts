import type { BookingStatus } from "@/lib/api/bookings";

export const bookingStatusLabels: Record<BookingStatus, string> = {
  new: "M\u1edbi",
  contacted: "\u0110\u00e3 li\u00ean h\u1ec7",
  confirmed: "\u0110\u00e3 x\u00e1c nh\u1eadn",
  deposit: "\u0110\u00e3 \u0111\u1eb7t c\u1ecdc",
  shooting: "\u0110ang ch\u1ee5p",
  completed: "Ho\u00e0n th\u00e0nh",
  cancelled: "\u0110\u00e3 h\u1ee7y",
};

export function getBookingStatusClass(status: BookingStatus): string {
  switch (status) {
    case "new":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "contacted":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "deposit":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "shooting":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "completed":
      return "border-zinc-300 bg-zinc-100 text-zinc-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
  }
}
