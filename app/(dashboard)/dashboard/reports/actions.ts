'use server';

import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { reports } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/observability/logger';
import type { ParcelResult } from '@/components/parcel/ParcelDetailsSheet';

const createReportSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  parcelData: z.any(), // ParcelResult as JSON
  findings: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

const updateReportSchema = z.object({
  reportId: z.string(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional(),
  findings: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

const deleteReportSchema = z.object({
  reportId: z.string(),
});

export const createReport = validatedActionWithUser(
  createReportSchema,
  async (data, formData, user) => {
    const startTime = Date.now();
    try {
      const team = await getTeamForUser();
      if (!team) {
        logger.warn('report_create_no_team', { userId: user.id });
        return { error: 'Team not found' };
      }

      // Parse parcelData if it's a JSON string
      let parcelData = data.parcelData;
      if (typeof parcelData === 'string') {
        parcelData = JSON.parse(parcelData);
      }
      parcelData = parcelData as ParcelResult;

      const reportId = nanoid(12);

      // Ensure IDs are numbers for database insert
      const teamIdNum = typeof team.id === 'string' ? parseInt(team.id) : team.id;
      const userIdNum = typeof user.id === 'string' ? parseInt(user.id) : user.id;

      const newReport = {
        id: reportId,
        teamId: teamIdNum,
        userId: userIdNum,
        title: data.title,
        description: data.description || null,
        parcelId: parcelData.id,
        address: parcelData.address,
        apn: parcelData.apn || null,
        jurisdiction: parcelData.jurisdiction || null,
        zoning: parcelData.zoning || null,
        parcelSnapshot: parcelData,
        findings: data.findings || null,
        tags: data.tags || [],
        status: 'draft',
        shareToken: null,
        shareTokenExpiresAt: null,
      };

      const result = await db.insert(reports).values(newReport as any).returning();

      if (!result || result.length === 0) {
        logger.error('report_create_db_insert_failed', new Error('No result from insert'), {
          reportId,
          teamId: teamIdNum,
          userId: userIdNum,
        });
        return { error: 'Failed to insert report into database' };
      }

      const duration = Date.now() - startTime;
      logger.info('report_created', {
        reportId,
        teamId: teamIdNum,
        userId: userIdNum,
        title: data.title,
        address: parcelData.address,
        duration,
      });

      return {
        success: `Report "${data.title}" created successfully`,
        reportId,
        title: data.title,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('report_create_failed', error, {
        userId: user.id,
        title: data.title,
        duration,
      });
      return { error: error?.message || 'Failed to create report' };
    }
  }
);

export const updateReport = validatedActionWithUser(
  updateReportSchema,
  async (data, formData, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      const updates: any = {};
      if (data.title) updates.title = data.title;
      if (data.description) updates.description = data.description;
      if (data.findings) updates.findings = data.findings;
      if (data.tags) updates.tags = data.tags;
      updates.updatedAt = new Date();

      await db
        .update(reports)
        .set(updates)
        .where(
          and(
            eq(reports.id, data.reportId),
            eq(reports.teamId, team.id),
            eq(reports.userId, user.id)
          )
        );

      return { success: 'Report updated successfully' };
    } catch (error: any) {
      return { error: error?.message || 'Failed to update report' };
    }
  }
);

export const deleteReport = validatedActionWithUser(
  deleteReportSchema,
  async (data, formData, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      await db
        .delete(reports)
        .where(
          and(
            eq(reports.id, data.reportId),
            eq(reports.teamId, team.id),
            eq(reports.userId, user.id)
          )
        );

      return { success: 'Report deleted successfully' };
    } catch (error: any) {
      return { error: error?.message || 'Failed to delete report' };
    }
  }
);

export async function getTeamReports() {
  try {
    const user = await getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    const teamReports = await db
      .select()
      .from(reports)
      .where(eq(reports.teamId, team.id))
      .orderBy(desc(reports.createdAt));

    return { data: teamReports };
  } catch (error: any) {
    return { error: error?.message || 'Failed to fetch reports' };
  }
}

export async function getReportById(reportId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    const report = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.id, reportId),
          eq(reports.teamId, team.id)
        )
      )
      .limit(1);

    if (report.length === 0) {
      return { error: 'Report not found' };
    }

    return { data: report[0] };
  } catch (error: any) {
    return { error: error?.message || 'Failed to fetch report' };
  }
}
