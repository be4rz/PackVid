/**
 * Camera Types — Shared type definitions
 *
 * Core types for the dual camera display feature.
 * Used by hooks, components, and settings persistence.
 */

/** A video input device detected by the browser */
export interface CameraDevice {
  /** Unique device identifier (from MediaDeviceInfo.deviceId) */
  deviceId: string
  /** Human-readable label (e.g., "HD Pro Webcam C920") */
  label: string
  /** Always 'videoinput' for cameras */
  kind: 'videoinput'
}

/** The role a camera can be assigned to */
export type CameraRole = 'scanner' | 'recorder'

/** Persisted camera-to-role mapping */
export interface CameraAssignment {
  /** Device ID assigned to scanner role, null if unassigned */
  scanner: string | null
  /** Device ID assigned to recorder role, null if unassigned */
  recorder: string | null
}

/** Current operational status of a camera */
export type CameraStatus = 'idle' | 'active' | 'error' | 'permission_denied'

/** Camera permission state */
export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unknown'

/** Constraints for a camera stream */
export interface CameraConstraints {
  width?: number
  height?: number
  frameRate?: number
}

/** Default camera constraints */
export const DEFAULT_CAMERA_CONSTRAINTS: CameraConstraints = {
  width: 1280,
  height: 720,
  frameRate: 30,
}

/** Settings key used for persisting camera assignments in app_settings */
export const CAMERA_ASSIGNMENT_KEY = 'camera_assignments'
