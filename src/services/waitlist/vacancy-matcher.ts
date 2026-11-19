import type { SupportedCurrency } from '@/schemas/env.schema';
import type { WaitlistCandidate } from '@/schemas/waitlist.schema';

export interface CancelledBookingSlotContext {
  readonly tenantId: string;
  readonly businessName: string;
  readonly cancelledBookingId: string;
  readonly bookingDate: string;
  readonly bookingTime: string;
  readonly releasedDurationMinutes: number;
  readonly staffName: string;
  readonly currency: SupportedCurrency;
}

export interface MatchedWaitlistOpportunity {
  readonly candidate: WaitlistCandidate;
  readonly fitsWithoutOverrun: boolean;
  readonly durationUtilizationPercent: number;
  readonly formattedPrice: string;
  readonly whatsappFlashUrl: string;
}

/**
 * Formats an amount strictly in USD ($) or EUR (€).
 */
export function formatGlobalCurrency(amountUsd: number, amountEur: number, currency: SupportedCurrency): string {
  if (currency === 'EUR') {
    return `${amountEur.toFixed(2)} € EUR`;
  }
  return `$${amountUsd.toFixed(2)} USD`;
}

/**
 * Smart Waitlist Anti-Gap Matcher Engine (`vacancy-matcher.ts`).
 * Filters waiting clients for the target date whose desired multi-service cart duration
 * fits cleanly inside the released cancellation window (`totalDurationMinutes <= releasedDurationMinutes`),
 * sorting by highest slot utilization and FIFO order.
 */
export function findMatchingWaitlistCandidates(
  cancelledSlot: CancelledBookingSlotContext,
  waitingPool: readonly WaitlistCandidate[]
): MatchedWaitlistOpportunity[] {
  const eligible = waitingPool.filter(
    (entry) =>
      entry.tenantId === cancelledSlot.tenantId &&
      entry.desiredDate === cancelledSlot.bookingDate &&
      entry.totalDurationMinutes <= cancelledSlot.releasedDurationMinutes
  );

  const sorted = [...eligible].sort((a, b) => {
    // Prioritize highest time utilization so the merchant maximizes recovered revenue, then FIFO
    if (b.totalDurationMinutes !== a.totalDurationMinutes) {
      return b.totalDurationMinutes - a.totalDurationMinutes;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  return sorted.map((candidate) => {
    const utilization = Math.min(
      100,
      Math.round((candidate.totalDurationMinutes / cancelledSlot.releasedDurationMinutes) * 100)
    );
    const formattedPrice = formatGlobalCurrency(
      candidate.totalPriceUsd,
      candidate.totalPriceEur,
      cancelledSlot.currency
    );
    const digitsOnlyPhone = candidate.clientPhone.replace(/\D/g, '');
    const servicesSummary = candidate.desiredServices.join(' + ');

    const message = encodeURIComponent(
      `FLASH OPENING at ${cancelledSlot.businessName}!\n\n` +
        `Hi ${candidate.clientName}, a ${cancelledSlot.releasedDurationMinutes}-min slot just opened on ${cancelledSlot.bookingDate} at ${cancelledSlot.bookingTime} with ${cancelledSlot.staffName} for your requested ${servicesSummary} (${formattedPrice}).\n\n` +
        `Reply CLAIM within 15 minutes to lock in this slot!`
    );

    return {
      candidate,
      fitsWithoutOverrun: true,
      durationUtilizationPercent: utilization,
      formattedPrice,
      whatsappFlashUrl: `https://wa.me/${digitsOnlyPhone}?text=${message}`,
    };
  });
}
