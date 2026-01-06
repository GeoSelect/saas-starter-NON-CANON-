/**
 * CCP-00: Update User Preferences
 *
 * PATCH /api/account/preferences
 *
 * Allows user to update their operational defaults and preferences.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware";
import { UpdatePreferencesRequest, UserPreferences } from "@/lib/types/user";
import { accountContextCache } from "@/lib/hooks/useAccountContext";

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    // Parse request body
    const body = (await request.json()) as UpdatePreferencesRequest;

    // Validate input
    const allowedFields = [
      "default_map_view",
      "default_report_type",
      "show_sources_expanded",
      "mobile_first",
    ];

    const updates: Partial<UpdatePreferencesRequest> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field as keyof UpdatePreferencesRequest] = body[field as keyof UpdatePreferencesRequest];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "No valid fields to update",
          },
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    // Update preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", auth.userId)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/account/preferences] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPDATE_FAILED",
            message: "Failed to update preferences",
          },
        },
        { status: 500 }
      );
    }

    // Invalidate cache to force refetch
    accountContextCache.invalidate();

    return NextResponse.json(
      {
        success: true,
        data: data as UserPreferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /api/account/preferences] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
