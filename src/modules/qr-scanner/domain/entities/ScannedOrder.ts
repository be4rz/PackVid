/**
 * ScannedOrder — Domain Entity (Value Object)
 *
 * Represents a decoded QR code or barcode scan result.
 * Pure TypeScript — no framework imports.
 *
 * @example
 * const order = createScannedOrder({
 *   rawData: 'SPXVN061116275422',
 *   trackingNumber: 'SPXVN061116275422',
 *   format: 'QR_CODE',
 *   carrier: 'SPX',
 * })
 */

/** Supported scan formats (subset of zxing BarcodeFormat) */
export type ScanFormat = 'QR_CODE' | 'CODE_128' | 'EAN_13' | 'OTHER'

/** Known shipping carriers detected by prefix */
export type Carrier = 'SPX' | 'GHN' | 'GHTK'

export interface ScannedOrder {
  /** Extracted tracking number (e.g. "SPXVN061116275422") */
  trackingNumber: string
  /** Raw decoded string from QR/barcode */
  rawData: string
  /** Detected barcode format */
  format: ScanFormat
  /** Timestamp of when the code was scanned */
  scannedAt: Date
  /** Detected carrier, if recognized by prefix */
  carrier?: Carrier
}

interface CreateScannedOrderInput {
  rawData: string
  trackingNumber: string
  format: ScanFormat
  carrier?: Carrier
}

/**
 * Factory function to create a ScannedOrder value object.
 * Sets scannedAt to current timestamp.
 */
export function createScannedOrder(input: CreateScannedOrderInput): ScannedOrder {
  return {
    trackingNumber: input.trackingNumber,
    rawData: input.rawData,
    format: input.format,
    scannedAt: new Date(),
    carrier: input.carrier,
  }
}
