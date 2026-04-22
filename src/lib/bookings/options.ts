export const serviceTypeOptions = ["عيد ميلاد 🎂", "زفاف 💍", "جلسة 📷"] as const;

export const sessionSizeOptions = ["٣٠ / ٤٠", "٣٠ / ٦٠"] as const;

export const locationTypeOptions = ["🏠 داخلي", "🌿 خارجي", "🏛️ قاعة"] as const;

export const staffGenderOptions = ["👩 نسائي", "👨 رجالي"] as const;

export const dateFilterOptions = [
  { value: "all", label: "كل الحجوزات" },
  { value: "today", label: "حجوزات اليوم" },
  { value: "upcoming", label: "القادمة" },
  { value: "month", label: "هذا الشهر" },
] as const;

export type DateFilterValue = (typeof dateFilterOptions)[number]["value"];
