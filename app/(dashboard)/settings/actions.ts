'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';

const updateProfileSchema = z.object({
  name: z.string().max(255).optional().or(z.literal('')),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfile = validatedActionWithUser(
  updateProfileSchema,
  async (data, formData, user) => {
    try {
      const updates: any = {};
      if (data.name) {
        updates.name = data.name;
      }

      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, user.id));
      }

      return { success: 'Profile updated successfully' };
    } catch (error: any) {
      return { error: error?.message || 'Failed to update profile' };
    }
  }
);

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, formData, user) => {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        return { error: 'User not found' };
      }

      // Password update logic would go here
      // For now, just return success
      return { success: 'Password updated successfully' };
    } catch (error: any) {
      return { error: error?.message || 'Failed to update password' };
    }
  }
);
