/**
 * Demo OpenAPI document loaded by the "Example" button. Real-world enough to
 * exercise paths, security schemes, $refs, enums, arrays and response samples.
 */
export const SAMPLE_OPENAPI = `openapi: 3.0.3
info:
  title: Example User API
  description: >-
    A minimal REST API for managing users, used to demonstrate the OpenAPI
    Workbench. Every value here is an illustration, not real data.
  version: 2.4.1
  contact:
    name: Example Team
    email: team@example.com
servers:
  - url: https://api.example.com/v2
    description: Production
  - url: https://staging.example.com/v2
    description: Staging
security:
  - bearerAuth: []
tags:
  - name: users
    description: User lifecycle operations
paths:
  /users:
    get:
      operationId: listUsers
      summary: List users
      description: Returns a paged list of users.
      tags: [users]
      parameters:
        - name: limit
          in: query
          description: Maximum number of results.
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          description: Number of results to skip.
          schema:
            type: integer
            default: 0
        - name: X-Request-Trace
          in: header
          description: Optional trace id echoed in the response.
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: A page of users.
          headers:
            X-Total-Count:
              schema:
                type: integer
          content:
            application/json:
              schema:
                type: object
                required: [items, total]
                properties:
                  items:
                    type: array
                    items:
                      $ref: "#/components/schemas/User"
                  total:
                    type: integer
        "default":
          description: Unexpected error.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
    post:
      operationId: createUser
      summary: Create a user
      tags: [users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NewUser"
      responses:
        "201":
          description: The created user.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          description: Invalid payload.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
  /users/{userId}:
    parameters:
      - name: userId
        in: path
        required: true
        description: Numeric user identifier.
        schema:
          type: integer
          format: int64
          example: 42
    get:
      operationId: getUser
      summary: Fetch one user
      tags: [users]
      responses:
        "200":
          description: The requested user.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "404":
          description: User not found.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
    patch:
      operationId: updateUser
      summary: Update a user
      tags: [users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                role:
                  type: string
                  enum: [admin, member, viewer]
        description: Fields to update.
      responses:
        "200":
          description: The updated user.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
  schemas:
    User:
      type: object
      required: [id, email, createdAt]
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, member, viewer]
        active:
          type: boolean
        tags:
          type: array
          items:
            type: string
        profile:
          type: object
          properties:
            bio:
              type: string
            website:
              type: string
              format: uri
        createdAt:
          type: string
          format: date-time
    NewUser:
      type: object
      required: [email]
      properties:
        name:
          type: string
        email:
          type: string
          format: email
        role:
          type: string
          enum: [admin, member, viewer]
          default: member
    ErrorResponse:
      type: object
      required: [code, message]
      properties:
        code:
          type: integer
          format: int32
        message:
          type: string
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              reason:
                type: string
`;