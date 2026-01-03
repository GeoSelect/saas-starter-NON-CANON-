import { supabaseRSC } from '@/lib/supabase/server';


export type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export type AppTeam = {
  id: string;
  name: string | null;
  members?: Array<{ id: string; name: string | null; email: string | null }>;
};

export async function getUser(): Promise<AppUser | null> {
  const supabase = await supabaseRSC();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    name: (data.user.user_metadata as any)?.name ?? null
  };
}

export async function getTeamForUser(): Promise<AppTeam | null> {
  const user = await getUser();
  if (!user) return null;

  // Temporary stand-in until CCP-00 account tables exist
  return {
    id: 'demo',
    name: 'Demo Team',
    members: [{ id: user.id, name: user.name, email: user.email }]
  };
}

// Compatibility stubs (implement later with Supabase tables + Stripe webhooks)
export async function getTeamByStripeCustomerId(_customerId: string) {
  return null;
}

export async function updateTeamSubscription(
  _teamId: number,
  _subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  return;
}

export async function getUserWithTeam(_userId: number) {
  return null;
}

export async function getActivityLogs() {
  return [];
}
