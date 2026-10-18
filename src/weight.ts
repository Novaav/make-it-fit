/**
 * Weights are stored as integer grams so sums and the allowance check are exact. Players see grams below 1 kg
 * ("900 g") and kilograms from 1 kg up ("2.25 kg"). "At most the allowance" wins: a total equal to the allowance is
 * not over it (see `isOverWeight`).
 */
export const WEIGHT_UNIT = 'kg'

/** Grams to a short kilogram number: 250 -> "0.25", 1300 -> "1.3", 7000 -> "7", 6250 -> "6.25". */
export function formatKg(grams: number): string {
  return String(Math.round(grams / 10) / 100)
}

/** A weight split into the number and unit a player sees: 900 -> 900 g, 2250 -> 2.25 kg. */
export function splitWeight(grams: number): { value: string; unit: 'g' | 'kg' } {
  return grams < 1000 ? { value: String(Math.round(grams)), unit: 'g' } : { value: formatKg(grams), unit: 'kg' }
}

/** Grams to a phrase with the unit: 900 -> "900 g", 1000 -> "1 kg", 2250 -> "2.25 kg". */
export function formatWeight(grams: number): string {
  const { value, unit } = splitWeight(grams)
  return `${value} ${unit}`
}

/** A running total shown before "/ allowance": nothing packed is a bare 0, under 1 kg is grams, otherwise a kilogram number. */
export function formatLoad(grams: number): string {
  return grams === 0 ? '0' : grams < 1000 ? `${grams} g` : formatKg(grams)
}
