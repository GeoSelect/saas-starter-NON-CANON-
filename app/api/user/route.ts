import { getUser } from "@/lib/db/queries";
import { getMockUserById } from "@/lib/mock-data/users";

export async function GET() {
  try {
    const user = await getUser();
    if (user) {
      return Response.json(user);
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }

  // Fallback to mock data
  const mockUser = getMockUserById("user-001");
  return Response.json(mockUser ? {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.displayName,
  } : {
    id: "user-001",
    email: "peter@geoselect.com",
    name: "Peter Johnson",
  });
}
