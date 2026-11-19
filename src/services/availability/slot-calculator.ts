import type { CatalogServiceItem, PublicBusySlot } from '@/schemas/booking.schema';

export interface MultiServiceCartCalculation {
  readonly selectedServices: readonly CatalogServiceItem[];
  readonly totalDurationMinutes: number;
  readonly totalPriceUsd: number;
  readonly totalPriceEur: number;
}

export interface TimeIntervalWindow {
  readonly startMinutes: number;
  readonly endMinutes: number;
}

export interface AvailabilityEngineParams {
  readonly openingTime: string;      // e.g. "09:00"
  readonly closingTime: string;      // e.g. "19:00"
  readonly slotStepMinutes?: number; // Default 30-min grid steps
  readonly requiredDurationMinutes: number;
  readonly targetStaffId: string | null;
  readonly busySlots: readonly PublicBusySlot[];
  readonly manualBlockouts?: readonly { startTime: string; durationMinutes: number }[];
}

/**
 * Converts a 24h time string ("HH:mm") to minutes since midnight (0 - 1439).
 */
export function timeStringToMinutes(time24h: string): number {
  const parts = time24h.split(':');
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight back to "HH:mm" 24h format.
 */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Server-Side Zero-Trust Multi-Service Cart Calculator.
 * Always resolves prices (USD & EUR) and durations from the authoritative catalog list.
 */
export function calculateMultiServiceCart(
  catalogServices: readonly CatalogServiceItem[],
  requestedServiceIds: readonly string[]
): MultiServiceCartCalculation {
  const uniqueIds = Array.from(new Set(requestedServiceIds));
  const matchedServices = uniqueIds
    .map((id) => catalogServices.find((item) => item.id === id))
    .filter((item): item is CatalogServiceItem => item !== undefined);

  if (matchedServices.length === 0) {
    throw new Error('INVALID_CART: None of the requested service IDs match active tenant services.');
  }

  let totalDurationMinutes = 0;
  let totalPriceUsd = 0;
  let totalPriceEur = 0;

  for (const service of matchedServices) {
    totalDurationMinutes += service.durationMinutes;
    totalPriceUsd += service.priceUsd;
    totalPriceEur += service.priceEur;
  }

  return {
    selectedServices: matchedServices,
    totalDurationMinutes,
    totalPriceUsd: Number(totalPriceUsd.toFixed(2)),
    totalPriceEur: Number(totalPriceEur.toFixed(2)),
  };
}

/**
 * Checks whether two half-open intervals [startA, endA) and [startB, endB) overlap.
 */
export function intervalsOverlap(a: TimeIntervalWindow, b: TimeIntervalWindow): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * BookGrid Continuous Window Availability Engine.
 * Crosses store working hours, existing bookings (from `get_public_busy_slots`),
 * manual blockouts, and the summed multi-service cart duration (`requiredDurationMinutes`).
 */
export function computeAvailableTimeSlots(params: AvailabilityEngineParams): string[] {
  const step = params.slotStepMinutes ?? 30;
  const openMin = timeStringToMinutes(params.openingTime);
  const closeMin = timeStringToMinutes(params.closingTime);
  const duration = params.requiredDurationMinutes;

  if (duration <= 0 || openMin + duration > closeMin) {
    return [];
  }

  const relevantBusyWindows: TimeIntervalWindow[] = params.busySlots
    .filter((slot) => params.targetStaffId === null || slot.staffId === null || slot.staffId === params.targetStaffId)
    .map((slot) => {
      const start = timeStringToMinutes(slot.bookingTime);
      return {
        startMinutes: start,
        endMinutes: start + slot.totalDurationMinutes,
      };
    });

  const blockoutWindows: TimeIntervalWindow[] = (params.manualBlockouts ?? []).map((blk) => {
    const start = timeStringToMinutes(blk.startTime);
    return {
      startMinutes: start,
      endMinutes: start + blk.durationMinutes,
    };
  });

  const allOccupiedWindows = [...relevantBusyWindows, ...blockoutWindows];
  const availableSlots: string[] = [];

  for (let candidateStart = openMin; candidateStart + duration <= closeMin; candidateStart += step) {
    const candidateWindow: TimeIntervalWindow = {
      startMinutes: candidateStart,
      endMinutes: candidateStart + duration,
    };

    const hasCollision = allOccupiedWindows.some((occupied) =>
      intervalsOverlap(candidateWindow, occupied)
    );

    if (!hasCollision) {
      availableSlots.push(minutesToTimeString(candidateStart));
    }
  }

  return availableSlots;
}
