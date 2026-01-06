/**
 * CCP-00: Update User Profile
 *
 * PATCH /api/account/profile
 *
 * Allows user to update their display name and avatar.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth/middleware";
import { UpdateUserProfileRequest, User } from "@/lib/types/user";
import { accountContextCache } from "@/lib/hooks/useAccountContext";

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    // Check authentication
    const auth = await requireAuth(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    // Parse request body
    const body = (await request.json()) as UpdateUserProfileRequest;

    // Validate input
    const updates: Partial<UpdateUserProfileRequest> = {};

    if ("display_name" in body && typeof body.display_name === "string") {
      if (body.display_name.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "display_name must be at least 2 characters",
            },
          },
          { status: 400 }
        );
      }
      updates.display_name = body.display_name.trim();
    }

    if ("avatar_url" in body && typeof body.avatar_url === "string") {
      // Basic URL validation
      try {
        new URL(body.avatar_url);
        updates.avatar_url = body.avatar_url;
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "avatar_url must be a valid URL",
            },
          },
          { status: 400 }
        );
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

    // Update user profile
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.userId)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/account/profile] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPDATE_FAILED",
            message: "Failed to update profile",
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
        data: data as User,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /api/account/profile] Error:", error);

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
