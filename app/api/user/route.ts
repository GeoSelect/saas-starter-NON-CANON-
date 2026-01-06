import { getUser } from '@/lib/db/queries';
import { getMockUserById } from '@/lib/mock-data/users';

export async function GET() {
  try {
    const user = await getUser();
    return Response.json(user);
  } catch (error) {
    // Fallback to mock data if database is unavailable
    const mockUser = getMockUserById(1);
    return Response.json(mockUser);
  }
}
