'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SignInSchema, SignUpMerchantSchema } from '@/schemas/auth.schema';
import { TenantCreateSchema } from '@/schemas/tenant.schema';
import type { ActionResult } from './action-result';

export interface SignUpSuccessData {
  readonly userId: string;
  readonly tenantId: string | null;
  readonly slug: string;
  readonly requiresEmailConfirmation: boolean;
}

/**
 * Registers a new merchant account and provisions their initial BookGrid tenant
 * in `trial` status with default currency strictly set to USD or EUR.
 */
export async function signUpMerchantAction(
  rawInput: unknown
): Promise<ActionResult<SignUpSuccessData>> {
  const parsed = SignUpMerchantSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existingSlug } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle();

  if (existingSlug) {
    return {
      ok: false,
      errorCode: 'SLUG_TAKEN',
      message: 'This BookGrid URL slug is already in use. Please choose another.',
    };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        business_name: input.businessName,
        pending_slug: input.slug,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      ok: false,
      errorCode: 'AUTH_SIGNUP_FAILED',
      message: authError?.message ?? 'Unable to create merchant account.',
    };
  }

  // If session is established immediately, create the initial tenant via RLS-protected client
  if (authData.session) {
    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        owner_id: authData.user.id,
        slug: input.slug,
        business_name: input.businessName,
        niche: input.niche,
        city: input.city,
        whatsapp_phone: input.whatsappPhone,
        currency: input.currency,
        subscription_status: 'trial',
        payment_provider: 'paddle',
      })
      .select('id, slug')
      .single();

    if (tenantError || !tenantRow) {
      return {
        ok: false,
        errorCode: 'TENANT_PROVISION_FAILED',
        message: tenantError?.message ?? 'Account created, but failed to initialize store.',
      };
    }

    return {
      ok: true,
      data: {
        userId: authData.user.id,
        tenantId: tenantRow.id,
        slug: tenantRow.slug,
        requiresEmailConfirmation: false,
      },
    };
  }

  return {
    ok: true,
    data: {
      userId: authData.user.id,
      tenantId: null,
      slug: input.slug,
      requiresEmailConfirmation: true,
    },
  };
}

/**
 * Authenticates an existing BookGrid merchant via Supabase Auth.
 */
export async function signInMerchantAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly userId: string }>> {
  const parsed = SignInSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    };
  }

  return {
    ok: true,
    data: { userId: data.user.id },
  };
}

/**
 * Signs out the current merchant and redirects to `/login`.
 */
export async function signOutMerchantAction(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Provisions a new BookGrid tenant for an already-authenticated Google OAuth user
 * during first-time `/onboarding`.
 */
export async function createOnboardingTenantAction(
  rawInput: unknown
): Promise<ActionResult<{ readonly tenantId: string; readonly slug: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Please sign in with Google before completing onboarding.',
    };
  }

  const parsed = TenantCreateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      errorCode: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const input = parsed.data;

  const { data: alreadyOwned } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (alreadyOwned) {
    return {
      ok: true,
      data: { tenantId: alreadyOwned.id, slug: alreadyOwned.slug },
    };
  }

  const { data: slugTaken } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle();

  if (slugTaken) {
    return {
      ok: false,
      errorCode: 'SLUG_TAKEN',
      message: 'This BookGrid URL slug is already taken. Please choose another.',
    };
  }

  const { data: created, error: insertError } = await supabase
    .from('tenants')
    .insert({
      owner_id: user.id,
      slug: input.slug,
      business_name: input.businessName,
      niche: input.niche,
      city: input.city,
      whatsapp_phone: input.whatsappPhone,
      currency: input.currency,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      subscription_status: 'trial',
      payment_provider: 'paddle',
    })
    .select('id, slug')
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      errorCode: 'ONBOARDING_FAILED',
      message: insertError?.message ?? 'Failed to create your store.',
    };
  }

  return {
    ok: true,
    data: { tenantId: created.id, slug: created.slug },
  };
}
