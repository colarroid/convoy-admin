// Mirrors the main app's REPORT_CATEGORIES so admins see the same labels the
// reporter chose (keep in sync with the main Veesaa app's lib/reports.ts).
const LABELS: Record<string, string> = {
  unsafe_driving: 'Unsafe driving',
  harassment: 'Harassment or threats',
  no_show: 'No-show or unreliable',
  fake_profile: 'Fake or misleading profile',
  inappropriate: 'Inappropriate behaviour',
  other: 'Something else',
}

/** Human label for a report category value, falling back to a de-underscored form. */
export function categoryLabel(value: string): string {
  return LABELS[value] ?? value.replace(/_/g, ' ')
}
