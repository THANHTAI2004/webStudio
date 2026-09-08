import type {
  LocationOpeningHour,
  LocationWeekday,
  PublicLocationListItem,
} from "@/lib/api/locations";

export const weekdayLabels: Record<LocationWeekday, string> = {
  monday: "Th\u1ee9 Hai",
  tuesday: "Th\u1ee9 Ba",
  wednesday: "Th\u1ee9 T\u01b0",
  thursday: "Th\u1ee9 N\u0103m",
  friday: "Th\u1ee9 S\u00e1u",
  saturday: "Th\u1ee9 B\u1ea3y",
  sunday: "Ch\u1ee7 Nh\u1eadt",
};

const weekdays: LocationWeekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function formatBookingLocation(location: PublicLocationListItem): string {
  return `${location.name} - ${location.address}`;
}

export function formatOpeningHour(item: LocationOpeningHour): string {
  if (item.isClosed) {
    return "\u0110\u00f3ng c\u1eeda";
  }

  return item.openTime && item.closeTime
    ? `${item.openTime} - ${item.closeTime}`
    : "Li\u00ean h\u1ec7";
}

export function getOpeningStatus(
  openingHours: LocationOpeningHour[],
): {
  isOpen: boolean;
  text: string;
} {
  const today = getTodayWeekday();
  const hour = openingHours.find((item) => item.day === today);

  if (!hour) {
    return {
      isOpen: false,
      text: "Li\u00ean h\u1ec7 \u0111\u1ec3 bi\u1ebft gi\u1edd m\u1edf c\u1eeda",
    };
  }

  if (hour.isClosed) {
    return {
      isOpen: false,
      text: "H\u00f4m nay \u0111\u00f3ng c\u1eeda",
    };
  }

  if (!hour.openTime || !hour.closeTime) {
    return {
      isOpen: false,
      text: "Li\u00ean h\u1ec7 \u0111\u1ec3 bi\u1ebft gi\u1edd m\u1edf c\u1eeda",
    };
  }

  const minutes = getCurrentMinutes();
  const isOpen = minutes >= toMinutes(hour.openTime) && minutes < toMinutes(hour.closeTime);

  return {
    isOpen,
    text: isOpen
      ? `\u0110ang m\u1edf: ${hour.openTime} - ${hour.closeTime}`
      : `H\u00f4m nay: ${hour.openTime} - ${hour.closeTime}`,
  };
}

export function getOrderedOpeningHours(
  openingHours: LocationOpeningHour[],
): LocationOpeningHour[] {
  const byDay = new Map(openingHours.map((item) => [item.day, item]));

  return weekdays
    .map((day) => byDay.get(day))
    .filter((item): item is LocationOpeningHour => Boolean(item));
}

function getTodayWeekday(): LocationWeekday {
  const date = new Intl.DateTimeFormat("en", {
    weekday: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  })
    .format(new Date())
    .toLowerCase();

  return weekdays.includes(date as LocationWeekday)
    ? (date as LocationWeekday)
    : "monday";
}

function getCurrentMinutes(): number {
  const parts = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return hour * 60 + minute;
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);

  return hour * 60 + minute;
}
