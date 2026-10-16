/**
 * Weights are stored as integer grams so sums and the allowance check are exact; players see kilograms.
 * "At most the allowance" wins: a total equal to the allowance is not over it (see `isOverWeight`).
 */
export const WEIGHT_UNIT = 'kg'

/** Grams to a short kilogram number: 250 -> "0.25", 1300 -> "1.3", 7000 -> "7", 6250 -> "6.25". */
export function formatKg(grams: number): string {
  return String(Math.round(grams / 10) / 100)
}

/** Grams to a kilogram phrase with the unit: 250 -> "0.25 kg". */
export function formatWeight(grams: number): string {
  return `${formatKg(grams)} ${WEIGHT_UNIT}`
}
