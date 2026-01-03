# Workspace API Contracts (CCP-05)

**Status**: Frozen  
**Version**: 1.0  
**Created**: 2026-01-03  
**Audit Semantics**: Success-only

---

## Contract Stability

These API contracts are **frozen** as of CCP-05 completion. Any changes require:
1. New CCP milestone
2. Versioned endpoint (e.g., `/v2/workspace/create`)
3. Documentation of breaking changes

---

## Authentication

All workspace endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- JWT must contain `account_id` claim
- Session must be active (validated via middleware)

**Error Response (401 Unauthorized)**:
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

## POST /api/workspace/create

Create a new workspace. The authenticated account becomes the owner.

### Request

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body** (JSON Schema):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "Workspace display name"
    },
    "metadata": {
      "type": "object",
      "description": "Optional metadata (key-value pairs)",
      "default": {}
    }
  }
}
```

**Example**:
```json
{
  "name": "Acme Corp Production",
  "metadata": {
    "description": "Main production workspace",
    "environment": "production"
  }
}
```

### Success Response (201 Created)

**Body**:
```json
{
  "workspace": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corp Production",
    "owner_account_id": "123e4567-e89b-12d3-a456-426614174000",
    "metadata": {
      "description": "Main production workspace",
      "environment": "production"
    },
    "created_at": "2026-01-03T10:30:00.000Z",
    "updated_at": "2026-01-03T10:30:00.000Z"
  },
  "membership": {
    "id": "660f9511-f3ac-52e5-b827-557766551111",
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "account_id": "123e4567-e89b-12d3-a456-426614174000",
    "role": "owner",
    "created_at": "2026-01-03T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request** (validation failure):
```json
{
  "error": "validation_error",
  "message": "Invalid request body",
  "details": [
    {
      "field": "name",
      "issue": "String must contain at least 1 character(s)"
    }
  ]
}
```

**403 Forbidden** (account not authorized to create workspaces):
```json
{
  "error": "forbidden",
  "message": "Account lacks permission to create workspaces"
}
```

**409 Conflict** (name already exists for this account):
```json
{
  "error": "conflict",
  "message": "Workspace name already exists",
  "details": {
    "existing_workspace_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## GET /api/workspace/:id

Retrieve a specific workspace by ID. User must be a member.

### Request

**Headers**:
- `Authorization: Bearer <token>` (required)

**Path Parameters**:
- `id` (UUID, required): Workspace identifier

**Example**: `GET /api/workspace/550e8400-e29b-41d4-a716-446655440000`

### Success Response (200 OK)

**Body**:
```json
{
  "workspace": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corp Production",
    "owner_account_id": "123e4567-e89b-12d3-a456-426614174000",
    "metadata": {
      "description": "Main production workspace",
      "environment": "production"
    },
    "created_at": "2026-01-03T10:30:00.000Z",
    "updated_at": "2026-01-03T10:30:00.000Z"
  },
  "members": [
    {
      "id": "660f9511-f3ac-52e5-b827-557766551111",
      "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
      "account_id": "123e4567-e89b-12d3-a456-426614174000",
      "role": "owner",
      "created_at": "2026-01-03T10:30:00.000Z"
    },
    {
      "id": "770f9511-f3ac-52e5-b827-557766552222",
      "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
      "account_id": "234e5678-e89b-12d3-a456-426614174111",
      "role": "member",
      "created_at": "2026-01-03T11:00:00.000Z"
    }
  ]
}
```

### Error Responses

**403 Forbidden** (not a member):
```json
{
  "error": "forbidden",
  "message": "Access denied: not a workspace member"
}
```

**404 Not Found** (workspace doesn't exist):
```json
{
  "error": "not_found",
  "message": "Workspace not found",
  "details": {
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## GET /api/workspaces

List all workspaces the authenticated account is a member of.

### Request

**Headers**:
- `Authorization: Bearer <token>` (required)

**Query Parameters**:
- `page` (integer, optional, default: 1): Page number (1-indexed)
- `limit` (integer, optional, default: 20, max: 100): Results per page

**Example**: `GET /api/workspaces?page=1&limit=20`

### Success Response (200 OK)

**Body**:
```json
{
  "workspaces": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corp Production",
      "owner_account_id": "123e4567-e89b-12d3-a456-426614174000",
      "metadata": {
        "environment": "production"
      },
      "created_at": "2026-01-03T10:30:00.000Z",
      "updated_at": "2026-01-03T10:30:00.000Z",
      "my_role": "owner"
    },
    {
      "id": "661e9511-f3ac-52e5-b827-557766553333",
      "name": "Acme Corp Staging",
      "owner_account_id": "123e4567-e89b-12d3-a456-426614174000",
      "metadata": {
        "environment": "staging"
      },
      "created_at": "2026-01-03T12:00:00.000Z",
      "updated_at": "2026-01-03T12:00:00.000Z",
      "my_role": "admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "total_pages": 1
  }
}
```

### Error Responses

**400 Bad Request** (invalid pagination):
```json
{
  "error": "validation_error",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "issue": "Must be between 1 and 100"
    }
  ]
}
```

---

## Audit Events

All successful workspace operations emit audit events per CCP-05 success-only semantics.

### Event: workspace.created

Emitted when: POST /api/workspace/create succeeds (201)

**Event Shape**:
```json
{
  "event_type": "workspace.created",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "account_id": "123e4567-e89b-12d3-a456-426614174000",
  "request_id": "req_abc123",
  "metadata": {
    "workspace_name": "Acme Corp Production",
    "owner_role": "owner"
  },
  "timestamp": "2026-01-03T10:30:00.000Z"
}
```

### Event: workspace.retrieved

Emitted when: GET /api/workspace/:id succeeds (200)

**Event Shape**:
```json
{
  "event_type": "workspace.retrieved",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "account_id": "123e4567-e89b-12d3-a456-426614174000",
  "request_id": "req_def456",
  "timestamp": "2026-01-03T10:31:00.000Z"
}
```

### Event: workspaces.listed

Emitted when: GET /api/workspaces succeeds (200)

**Event Shape**:
```json
{
  "event_type": "workspaces.listed",
  "account_id": "123e4567-e89b-12d3-a456-426614174000",
  "request_id": "req_ghi789",
  "metadata": {
    "count": 2,
    "page": 1
  },
  "timestamp": "2026-01-03T10:32:00.000Z"
}
```

**No events emitted for**:
- Validation failures (4xx errors)
- Authorization failures (403)
- Not found errors (404)

---

## OpenAPI Fragment

```yaml
openapi: 3.0.0
info:
  title: Workspace API
  version: 1.0.0
  description: CCP-05 Workspace Container Endpoints

paths:
  /api/workspace/create:
    post:
      summary: Create a new workspace
      operationId: createWorkspace
      tags: [Workspaces]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateWorkspaceRequest'
      responses:
        '201':
          description: Workspace created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateWorkspaceResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /api/workspace/{id}:
    get:
      summary: Get workspace by ID
      operationId: getWorkspace
      tags: [Workspaces]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Workspace retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetWorkspaceResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /api/workspaces:
    get:
      summary: List workspaces for authenticated account
      operationId: listWorkspaces
      tags: [Workspaces]
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Workspaces listed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ListWorkspacesResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    CreateWorkspaceRequest:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        metadata:
          type: object
          default: {}

    CreateWorkspaceResponse:
      type: object
      properties:
        workspace:
          $ref: '#/components/schemas/Workspace'
        membership:
          $ref: '#/components/schemas/WorkspaceMember'

    Workspace:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        owner_account_id:
          type: string
          format: uuid
        metadata:
          type: object
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    WorkspaceMember:
      type: object
      properties:
        id:
          type: string
          format: uuid
        workspace_id:
          type: string
          format: uuid
        account_id:
          type: string
          format: uuid
        role:
          type: string
          enum: [owner, admin, member]
        created_at:
          type: string
          format: date-time

    GetWorkspaceResponse:
      type: object
      properties:
        workspace:
          $ref: '#/components/schemas/Workspace'
        members:
          type: array
          items:
            $ref: '#/components/schemas/WorkspaceMember'

    ListWorkspacesResponse:
      type: object
      properties:
        workspaces:
          type: array
          items:
            allOf:
              - $ref: '#/components/schemas/Workspace'
              - type: object
                properties:
                  my_role:
                    type: string
                    enum: [owner, admin, member]
        pagination:
          type: object
          properties:
            page:
              type: integer
            limit:
              type: integer
            total:
              type: integer
            total_pages:
              type: integer

  responses:
    ValidationError:
      description: Request validation failed
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: validation_error
              message:
                type: string
              details:
                type: array
                items:
                  type: object

    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: unauthorized
              message:
                type: string

    Forbidden:
      description: Access denied
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: forbidden
              message:
                type: string

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: not_found
              message:
                type: string
              details:
                type: object

    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: conflict
              message:
                type: string
              details:
                type: object
```
