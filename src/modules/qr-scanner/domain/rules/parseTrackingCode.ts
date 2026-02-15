/**
 * parseTrackingCode — Domain Rule
 *
 * Parses a decoded QR/barcode string into a ScannedOrder.
 * Detects carrier by prefix and extracts the tracking number.
 *
 * Works for both QR codes and 1D barcodes — the decoded data
 * is always a string regardless of format.
 *
 * Carrier detection rules:
 *   SPXVN... → SPX Express
 *   GHN...   → Giao Hàng Nhanh
 *   GHTK...  → Giao Hàng Tiết Kiệm
 *   (other)  → generic (no carrier)
 */

import { createScannedOrder, type Carrier, type ScanFormat, type ScannedOrder } from '../entities/ScannedOrder'

/** Carrier prefix rules — order matters (longer prefixes first) */
const CARRIER_PREFIXES: { prefix: string; carrier: Carrier }[] = [
  { prefix: 'SPXVN', carrier: 'SPX' },
  { prefix: 'SPX', carrier: 'SPX' },
  { prefix: 'GHTK', carrier: 'GHTK' },
  { prefix: 'GHN', carrier: 'GHN' },
]

/**
 * Parse a decoded string from a QR code or barcode into a ScannedOrder.
 *
 * @param rawData - The raw decoded string from the scanner
 * @param format - The detected barcode format
 * @returns ScannedOrder with extracted tracking number and detected carrier
 */
export function parseTrackingCode(rawData: string, format: ScanFormat): ScannedOrder {
  const trimmed = rawData.trim()

  // Detect carrier by prefix match
  const match = CARRIER_PREFIXES.find((rule) =>
    trimmed.toUpperCase().startsWith(rule.prefix),
  )

  return createScannedOrder({
    rawData: trimmed,
    trackingNumber: trimmed, // Full string is the tracking number
    format,
    carrier: match?.carrier,
  })
}
