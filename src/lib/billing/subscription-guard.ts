export interface TenantSubscriptionCheck {
  readonly subscription_status: string;
  readonly trial_ends_at: string | Date;
}

/**
 * Checks whether a tenant currently has active access (paid `active` plan
 * OR an unexpired `trial` within the 14-day window).
 */
export function isTenantSubscriptionActive(tenant: TenantSubscriptionCheck): boolean {
  if (tenant.subscription_status === 'active' || tenant.subscription_status === 'vip') {
    return true;
  }

  if (tenant.subscription_status === 'trial') {
    const endsAtMs = new Date(tenant.trial_ends_at).getTime();
    return Number.isFinite(endsAtMs) && endsAtMs > Date.now();
  }

  return false;
}
