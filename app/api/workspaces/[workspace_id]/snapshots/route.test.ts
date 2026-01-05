import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as snapshotPOST } from "./route";
import * as supabaseServer from "@/lib/supabase/server";
import * as activityLogger from "@/lib/helpers/activity-logger";

vi.mock("@/lib/supabase/server");

/**
 * Test: POST /api/workspaces/[workspace_id]/snapshots
 *
 * Contract assertions:
 * 1. Unauthenticated requests return frozen 401 shape (no activity logged)
 * 2. User without workspace access returns frozen 403 shape (no activity logged)
 * 3. Valid snapshot creation returns 201 with snapshot data
 * 4. Exactly one SNAPSHOT_CREATED activity row is inserted with correct metadata
 * 5. Activity metadata includes snapshot_id, parcel_id, address, schema_version
 */

// Spy on activity logger
vi.spyOn(activityLogger, "logSnapshotCreated");

describe("POST /api/workspaces/[workspace_id]/snapshots", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create fresh mock client for each test
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    // Mock supabaseRSC to return our client
    vi.mocked(supabaseServer.supabaseRSC).mockImplementation(() => mockSupabaseClient);
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("returns 401 with frozen shape when unauthenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Auth error"),
      });

      const req = new Request("http://localhost/api/workspaces/test-ws/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_id: "p123",
          parcel_address: "123 Main St",
        }),
      });

      const res = await snapshotPOST(req as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ workspace_id: "test-ws" }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: "Unauthorized" });
      expect(activityLogger.logSnapshotCreated).not.toHaveBeenCalled();
    });

    it("returns 403 with frozen shape when user lacks workspace access", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-456" } },
        error: null,
      });

      // No workspace membership
      const workspaceMemberQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: new Error("No matching rows"),
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(workspaceMemberQuery);

      const req = new Request("http://localhost/api/workspaces/test-ws/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_id: "p123",
          parcel_address: "123 Main St",
        }),
      });

      const res = await snapshotPOST(req as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ workspace_id: "test-ws" }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("access to this workspace");
      expect(activityLogger.logSnapshotCreated).not.toHaveBeenCalled();
    });
  });

  describe("Snapshot Creation & Activity Logging", () => {
    it("creates snapshot and logs exactly one SNAPSHOT_CREATED activity", async () => {
      const mockUserId = "user-123";
      const mockWorkspaceId = "ws-456";
      const mockSnapshotId = "snap-789";

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock workspace membership check
      const workspaceMemberQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { user_id: mockUserId },
          error: null,
        }),
      };

      // Mock snapshot insert
      const snapshotInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: mockSnapshotId,
            workspace_id: mockWorkspaceId,
            user_id: mockUserId,
            parcel_id: "p-789",
            parcel_address: "789 Elm St",
            parcel_apn: "789-12-34567",
          },
          error: null,
        }),
      };

      // Configure mock returns in order
      mockSupabaseClient.from
        .mockReturnValueOnce(workspaceMemberQuery) // workspace_members query
        .mockReturnValueOnce(snapshotInsertQuery); // parcel_snapshots insert

      const req = new Request("http://localhost/api/workspaces/test-ws/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_id: "p-789",
          parcel_address: "789 Elm St",
          parcel_apn: "789-12-34567",
          parcel_jurisdiction: "Test County",
          parcel_zoning: "R-1",
          summary_text: "Single family residential",
          metadata: {
            report_id: "report-456",
          },
        }),
      });

      const res = await snapshotPOST(req as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ workspace_id: mockWorkspaceId }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.snapshot.id).toBe(mockSnapshotId);

      // Verify activity was logged exactly once with correct metadata
      expect(activityLogger.logSnapshotCreated).toHaveBeenCalledTimes(1);
      expect(activityLogger.logSnapshotCreated).toHaveBeenCalledWith(
        mockUserId,
        mockWorkspaceId,
        mockSnapshotId,
        "p-789",
        "789 Elm St",
        "report-456",
        "1.0"
      );
    });

    it("validates required fields and returns 400", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const req = new Request("http://localhost/api/workspaces/test-ws/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_id: "p123",
          // Missing parcel_address
        }),
      });

      const res = await snapshotPOST(req as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ workspace_id: "test-ws" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("required");
      expect(activityLogger.logSnapshotCreated).not.toHaveBeenCalled();
    });

    it("returns 500 and does not log activity on snapshot creation failure", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // Mock workspace membership check (success)
      const workspaceMemberQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { user_id: "user-123" },
          error: null,
        }),
      };

      // Mock snapshot insert (failure)
      const snapshotInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: new Error("Database error"),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(workspaceMemberQuery)
        .mockReturnValueOnce(snapshotInsertQuery);

      const req = new Request("http://localhost/api/workspaces/test-ws/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_id: "p-789",
          parcel_address: "789 Elm St",
        }),
      });

      const res = await snapshotPOST(req as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ workspace_id: "test-ws" }),
      });

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("Failed");
      // Activity should NOT be logged on failure
      expect(activityLogger.logSnapshotCreated).not.toHaveBeenCalled();
    });
  });

  describe("Response Shape Contract", () => {
    it("returns frozen success response shape", async () => {
      const mockUserId = "user-123";
      const mockSnapshotId = "snap-789";

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const workspaceMemberQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { user_id: mockUserId },
          error: null,
        }),
      };

      const snapshotInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: mockSnapshotId,
            workspace_id: "ws-456",
            parcel_id: "p-789",
            parcel_address: "789 Elm St",
          },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(workspaceMemberQuery)
        .mockReturnValueOnce(snapshotInsertQuery);

      const req = new Request("http://localhost/api/workspaces/test-ws/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcel_id: "p-789",
          parcel_address: "789 Elm St",
        }),
      });

      const res = await snapshotPOST(req as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ workspace_id: "ws-456" }),
      });

      const json = await res.json();

      // Frozen response shape
      expect(json).toHaveProperty("ok");
      expect(json).toHaveProperty("snapshot");
      expect(json.ok).toBe(true);
      expect(json.snapshot).toHaveProperty("id");
      expect(json.snapshot).toHaveProperty("workspace_id");
    });
  });
});
