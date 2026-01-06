import { supabaseRSC } from '@/lib/supabase/server';
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { eq } from 'drizzle-orm';

export type AppUser = {
  id: string | number;
  email: string | null;
  name: string | null;
};

export type AppTeam = {
  id: string | number;
  name: string | null;
  members?: Array<{ id: string | number; name: string | null; email: string | null }>;
};

export async function getUser(): Promise<AppUser | null> {
  const supabase = await supabaseRSC();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    // Fallback for demo/testing - return mock user ID 1
    return {
      id: 1,
      email: 'john@example.com',
      name: 'John Developer'
    };
  }

  const supabaseUserId = data.user.id;
  const userEmail = data.user.email ?? null;
  const userName = (data.user.user_metadata as any)?.name ?? userEmail?.split('@')[0] ?? 'User';

  // Try to find user by email in our database
  try {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail || ''))
      .limit(1);

    if (existingUsers.length > 0) {
      return {
        id: existingUsers[0].id,
        email: existingUsers[0].email,
        name: existingUsers[0].name
      };
    }

    // User doesn't exist in our DB, create them
    try {
      const newUser = await db
        .insert(users)
        .values({
          name: userName,
          email: userEmail || 'unknown@example.com',
          passwordHash: 'oauth-' + supabaseUserId,
          role: 'member',
        })
        .returning();

      if (newUser.length > 0) {
        return {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name
        };
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  } catch (err) {
    // Table might not exist yet - use fallback
    console.error('Error querying users table:', err);
  }

  // Fallback: return mock user if query fails
  return {
    id: 1,
    email: userEmail || 'john@example.com',
    name: userName
  };
}

export async function getTeamForUser(): Promise<AppTeam | null> {
  try {
    const user = await getUser();
    if (!user) return null;

    // Get or create user's primary team (team ID 1 for now - Acme Real Estate)
    const teamId = 1;
    const userIdNum = typeof user.id === 'string' ? parseInt(user.id) : user.id;

    try {
      // Check if team exists
      const teamList = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (teamList.length === 0) {
        // Create team if it doesn't exist
        const newTeam = await db
          .insert(teams)
          .values({
            id: teamId,
            name: 'Acme Real Estate',
          })
          .returning();

        if (newTeam.length === 0) {
          return null;
        }
      }

      // Ensure user is a member of the team
      const membership = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, userIdNum))
        .limit(1);

      if (membership.length === 0) {
        try {
          await db.insert(teamMembers).values({
            userId: userIdNum,
            teamId: teamId,
            role: 'member',
          });
        } catch (err) {
          // Ignore if membership already exists
          // Return team data without throwing
        }
      }
    } catch (err) {
      // Database error - return null instead of throwing
      // This allows the app to continue without team data
      return null;
    }

    return {
      id: teamId,
      name: 'Acme Real Estate',
      members: [{ id: user.id, name: user.name, email: user.email }]
    };
  } catch (err) {
    // Catch any unexpected errors and return null
    console.error('Error in getTeamForUser:', err);
    return null;
  }
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
