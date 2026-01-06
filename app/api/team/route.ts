import { getTeamForUser } from "@/lib/db/queries";
import { mockUsers } from "@/lib/mock-data/users";

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (team) {
      return Response.json(team);
    }
  } catch (error) {
    console.error("Error fetching team:", error);
  }

  // Fallback to mock data
  const mockTeamMembers = mockUsers.slice(0, 3).map((user) => ({
    id: user.id,
    userId: user.id,
    teamId: 1,
    role: user.role,
    user: {
      id: user.id,
      name: user.displayName,
      email: user.email,
    },
  }));

  return Response.json({
    id: 1,
    name: "Acme Real Estate",
    planName: "Pro",
    subscriptionStatus: "active",
    teamMembers: mockTeamMembers,
  });
}
