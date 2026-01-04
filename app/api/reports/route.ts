import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { reports } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/observability/logger';

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const user = await getUser();
    const team = await getTeamForUser();

    if (!user || !team) {
      logger.warn('reports_list_unauthorized', {
        hasUser: !!user,
        hasTeam: !!team,
      });
      return NextResponse.json(
        { error: 'Unauthorized', reports: [] },
        { status: 401 }
      );
    }

    // Convert IDs to numbers for database query
    const teamId = typeof team.id === 'string' ? parseInt(team.id) : team.id;
    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;

    // Fetch reports for this team
    const teamReports = await db
      .select()
      .from(reports)
      .where(eq(reports.teamId, teamId));

    const duration = Date.now() - startTime;
    logger.info('reports_listed', {
      teamId,
      userId,
      count: teamReports?.length || 0,
      duration,
    });

    return NextResponse.json({
      reports: teamReports || [],
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('reports_list_failed', error as Error, {
      operation: 'list-reports',
      duration,
    });
    return NextResponse.json(
      { error: 'Failed to fetch reports', reports: [] },
      { status: 500 }
    );
  }
}
