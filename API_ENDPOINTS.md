# Meal App Core - API Endpoints Documentation

## Base URL

All endpoints are prefixed with their respective route paths as defined in `app.ts`.

---

## Table of Contents

- [Auth (`/auth`)](#auth)
- [Roles (`/roles`)](#roles)
- [Meals (`/meals`)](#meals)
- [Menus (`/menus`)](#menus)
- [Users (`/users`)](#users)
- [Taste Profiles (`/users/taste-profiles`)](#taste-profiles)
- [Week Menu Schedules (`/week-menu-schedules`)](#week-menu-schedules)
- [Meal Selections (`/meal-selections`)](#meal-selections)
- [Presets (`/presets`)](#presets)
- [Food Library (`/food-library`)](#food-library)
- [Enums](#enums)

---

## Enums

```typescript
enum Days {
  MONDAY | TUESDAY | WEDNESDAY | THURSDAY | FRIDAY | SATURDAY | SUNDAY
}

enum Status {
  ACTIVE | INACTIVE | RETIRED
}

enum SelectionStatus {
  PENDING | SUBMITTED
}

enum FoodGroup {
  SUPERGROUP | BASE | PROTEIN | PREP
}

enum WeekMenuStatus {
  DRAFT | ACTIVE | LOCKED | CLOSED
}

enum TokenType {
  USER_ONBOARDING | PASSWORD_RESET
}
```

---

## Auth

Base path: `/auth`

### POST `/auth/login`

Authenticate a user and return access/refresh tokens.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "roleId": 1,
    "roleName": "user"
  },
  "availability": {
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-07-10T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Note:** `accessToken` payload contains `{ userId, role: { id, name } }`. Expires in 15m. `refreshToken` payload contains `{ userId }`. Expires in 7d.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid login data", "errors": { ... } }` |
| 401 | `{ "message": "Failed to login" }` |

---

### POST `/auth/register`

Activate a user account using a onboarding token (received via email). Sets the user's password and activates the account.

**Request Body:**

```json
{
  "email": "string",
  "password": "string",
  "token": "string (onboarding token from email)"
}
```

**Validation:**
- Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.
- Token must be a valid, unexpired onboarding token for the user.

**Success Response (200):**

```json
{
  "message": "Successfully Signed Up",
  "result": {
    "message": "Account activated!"
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid signup data", "errors": { ... } }` |
| 400 | `{ "message": "User with this email is already activated" }` |
| 400 | `{ "message": "Email invalid" }` |
| 400 | `{ "message": "Unused Token not found" }` |
| 400 | `{ "message": "Token has expired. Request a new one" }` |
| 400 | `{ "message": "Invalid user token" }` |
| 400 | `{ "message": "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol." }` |

---

### POST `/auth/onboarding`

Request an onboarding email with a registration token. Sends an email with a token link to the user's reference email.

**Request Body:**

```json
{
  "email": "string"
}
```

**Success Response (200):**

```json
{
  "result": {
    "message": "Email sent successfully"
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Email is required" }` |
| 400 | `{ "message": "User with this email is already activated" }` |
| 400 | `{ "message": "Email invalid" }` |

---

### POST `/auth/logout`

Log out a user by deleting their refresh token from the database.

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Success Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Refresh token required" }` |
| 400 | `{ "message": "Failed to Logout" }` |

---

### POST `/auth/refresh`

Generate a new access token using a valid refresh token.

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Success Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Failed to renew access token" }` |
| 401 | `{ "message": "Refresh token is required" }` |

---

### POST `/auth/generate-password-token`

Request a password reset. Generates a one-time token (OTP) for the user, stores a hashed copy (type `PASSWORD_RESET`, expires in 24h), and emails the plaintext OTP to the user's reference email.

**Request Body:**

```json
{
  "email": "string"
}
```

> **Note:** The user must exist, be `ACTIVE`, and already have a password set (activated account). An existing `PASSWORD_RESET` token for the user is overwritten.

**Success Response (200):** No response body is returned on success.

**Error Responses:**

| Status | Body |
|--------|------|
| 401 | `{ "message": "Email Required" }` |
| 500 | `"<error>"` (e.g. `Error: Invalid Email`, `Error: User Inactive`) |

---

### POST `/auth/verify-otp`

Verify a password reset OTP token for a user. Used to validate the OTP before allowing a password reset.

**Request Body:**

```json
{
  "email": "string",
  "token": "string (OTP received via email)"
}
```

**Success Response (200):**

```json
{
  "message": "OTP is valid"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 401 | `{ "message": "Email and Token are required" }` |
| 500 | `{ "message": "Failed to verifyOTP" }` (e.g. invalid user, invalid OTP, or expired OTP) |

---

### POST `/auth/reset-password`

Reset a user's password using a valid password reset OTP. Verifies the OTP, updates the password hash, and marks the token as used.

**Request Body:**

```json
{
  "email": "string",
  "password": "string (new password)",
  "token": "string (OTP received via email)"
}
```

> **Note:** The user must exist, be `ACTIVE`, be activated (have a password), and provide a valid, unexpired `PASSWORD_RESET` token.

**Success Response (200):**

```json
{
  "message": "Successfully reset Password"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 401 | `{ "message": "Email and New Password are required" }` |
| 500 | `{ "message": "Failed to reset Password", "error": "<error>" }` (e.g. invalid email, user inactive, invalid token) |

---

### POST `/auth/sync`

Sync users from DigiHR external system into the local database.

**Request Body:** None required.

**Success Response (200):**

```json
"Successful sync!"
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to sync users" }` |

---

## Roles

Base path: `/roles`

### GET `/roles`

Retrieve all roles.

**Query Parameters:** None

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "user",
    "description": "Standard user role with basic access",
    "createdAt": "2026-05-21T11:21:43.000Z",
    "updatedAt": "2026-05-21T11:21:43.000Z"
  },
  {
    "id": 2,
    "name": "admin",
    "description": "Administrator role with full system access",
    "createdAt": "2026-05-21T11:21:43.000Z",
    "updatedAt": "2026-05-21T11:21:43.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to fetch roles" }` |

---

### GET `/roles/:id`

Retrieve a single role by its ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Role ID |

**Success Response (200):**

```json
{
  "id": 1,
  "name": "user",
  "description": "Standard user role with basic access",
  "createdAt": "2026-05-21T11:21:43.000Z",
  "updatedAt": "2026-05-21T11:21:43.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Role ID is required" }` |
| 500 | `{ "message": "Failed to fetch role" }` |

---

### POST `/roles`

Create a new role.

**Request Body:**

```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Success Response (201):**

```json
{
  "message": "Role created successfully",
  "role": {
    "id": 4,
    "name": "manager",
    "description": "Manager role",
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to create role" }` |

---

### PUT `/roles/:id`

Update an existing role.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Role ID |

**Request Body:**

```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "name": "updated-name",
  "description": "Updated description",
  "createdAt": "2026-05-21T11:21:43.000Z",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Role ID is required" }` |
| 500 | `{ "message": "Failed to update role" }` |

---

## Meals

Base path: `/meals`

### GET `/meals`

Retrieve all meals.

**Query Parameters:** None

**Success Response (200):**

```json
{
  "message": "Meals retrieved successfully",
  "meals": [
    {
      "id": 1,
      "image": "https://example.com/meal.jpg",
      "name": "Grilled Chicken",
      "description": "Grilled chicken breast with herbs",
      "isActive": true,
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-01T10:00:00.000Z",
      "foodCode": "GC001",
      "calories": 350
    }
  ]
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to retrieve meals" }` |

---

### GET `/meals/:id`

Retrieve a single meal by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Meal ID |

**Success Response (200):**

```json
{
  "message": "Meal retrieved successfully",
  "meal": {
    "id": 1,
    "image": "https://example.com/meal.jpg",
    "name": "Grilled Chicken",
    "description": "Grilled chicken breast with herbs",
    "isActive": true,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z",
    "foodCode": "GC001",
    "calories": 350
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to retrieve meal" }` |

---

### POST `/meals`

Create a new meal.

**Request Body:**

```json
{
  "name": "string",
  "image": "string (optional)",
  "isActive": "boolean (optional, defaults to true)",
  "foodCode": "string (unique)",
  "calories": "number (optional)",
  "description": "string (optional)"
}
```

**Success Response (201):**

```json
{
  "message": "Meal created successfully",
  "meal": {
    "id": 5,
    "image": null,
    "name": "Pasta Bolognese",
    "description": "Classic Italian pasta",
    "isActive": true,
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z",
    "foodCode": "PB001",
    "calories": 520
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to create meal" }` |

---

### POST `/meals/batch`

Create multiple meals in a batch. Skips duplicates based on `foodCode`.

**Request Body:**

```json
[
  {
    "name": "string",
    "image": "string (optional)",
    "isActive": "boolean (optional)",
    "foodCode": "string (unique)",
    "calories": "number (optional)",
    "description": "string (optional)"
  }
]
```

**Success Response (201):**

```json
{
  "message": "Meals created successfully",
  "meal": {
    "count": 3
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Request body must be an array of objects" }` |
| 500 | `{ "message": "Failed to create meals" }` |

---

### PUT `/meals/:id`

Update a meal by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Meal ID |

**Request Body:**

```json
{
  "name": "string (optional)",
  "image": "string (optional)",
  "isActive": "boolean (optional)",
  "foodCode": "string (optional)",
  "calories": "number (optional)",
  "description": "string (optional)"
}
```

**Success Response (200):**

```json
{
  "message": "Meal updated successfully",
  "meal": {
    "id": 1,
    "image": "https://example.com/new-image.jpg",
    "name": "Updated Grilled Chicken",
    "description": "Updated description",
    "isActive": true,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z",
    "foodCode": "GC001",
    "calories": 360
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to update meal" }` |

---

### DELETE `/meals/:id`

Soft-delete a meal by setting `isActive` to `false`.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Meal ID |

**Success Response (200):**

```json
{
  "message": "Meal deleted successfully",
  "meal": {
    "id": 1,
    "image": "https://example.com/meal.jpg",
    "name": "Grilled Chicken",
    "description": "Grilled chicken breast with herbs",
    "isActive": false,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z",
    "foodCode": "GC001",
    "calories": 350
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to delete meal" }` |

---

## Menus

Base path: `/menus`

> Menu routes currently do not apply server-side authentication or role middleware.

### GET `/menus`

Retrieve all menus. Returns a simplified shape (id, title, description only).

**Query Parameters:** None

**Success Response (200):**

```json
[
  {
    "id": 1,
    "title": "Week 27 Menu",
    "description": "Standard weekly menu"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to retrieve menus" }` |

---

### GET `/menus/:id`

Retrieve a single menu by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Menu ID |

**Success Response (200):**

```json
{
  "id": 1,
  "title": "Week 27 Menu",
  "description": "Standard weekly menu"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 404 | `{ "error": "Menu not found" }` |
| 500 | `{ "error": "Failed to retrieve menu" }` |

---

### GET `/menus/:id/meals`

Retrieve all MenuDayMeals records for a given menu (meals assigned to each day).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Menu ID |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z",
    "isActive": true,
    "menuDayId": 1,
    "mealId": 3
  },
  {
    "id": 2,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z",
    "isActive": true,
    "menuDayId": 1,
    "mealId": 5
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to retrieve menu meals" }` |

---

### GET `/menus/days/:id`

Retrieve menu days (MONDAY–FRIDAY) for a given menu ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Menu ID |

**Success Response (200):**

```json
[
  { "id": 1, "day": "MONDAY" },
  { "id": 2, "day": "TUESDAY" },
  { "id": 3, "day": "WEDNESDAY" },
  { "id": 4, "day": "THURSDAY" },
  { "id": 5, "day": "FRIDAY" }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Menu Id is invalid" }` |
| 500 | `{ "error": "Failed to retrieve menus" }` |

---

### POST `/menus`

Create a new menu. Automatically creates 5 MenuDays (MONDAY–FRIDAY).

**Request Body:**

```json
{
  "title": "string",
  "description": "string (optional)",
  "isActive": "boolean (optional, defaults to true)"
}
```

**Success Response (201):**

```json
{
  "id": 2,
  "title": "New Weekly Menu",
  "description": "A fresh menu for the week"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid menu payload", "errors": { ... } }` |
| 500 | `{ "error": "Failed to create menu. Error:..." }` |

---

### POST `/menus/meals`

Assign meals to menu days. Accepts an array to assign multiple meals to multiple days at once. Skips duplicates.

**Request Body:**

```json
[
  {
    "menuDayId": 1,
    "meals": [1, 2, 3]
  },
  {
    "menuDayId": 2,
    "meals": [4, 5]
  }
]
```

**Success Response (200):**

```json
{
  "count": 5
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to create menu meals" }` |

---

### PUT `/menus/:id`

Update a menu's metadata.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Menu ID |

**Request Body:**

```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "isActive": "boolean (optional)"
}
```

At least one field must be provided.

**Success Response (200):**

```json
{
  "id": 1,
  "title": "Updated Menu Title",
  "description": "Updated description",
  "isActive": true,
  "createdAt": "2026-06-01T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid menu payload", "errors": { ... } }` |
| 500 | `{ "error": "Failed to update menu" }` |

---

### PATCH `/menus/meals/:id`

Toggle a menu day meal's active status (show/hide a meal option from a day).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | MenuDayMeals ID |

**Request Body:**

```json
{
  "isActive": false
}
```

**Success Response (200):**

```json
{
  "message": "Successfully updated meal status"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid menu meal payload", "errors": { ... } }` |
| 500 | `{ "error": "Failed to update menu meal" }` |

---

### DELETE `/menus/:id`

Soft-delete a menu by setting `isActive` to `false`.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Menu ID |

**Success Response (200):**

```json
{
  "id": 1,
  "title": "Week 27 Menu",
  "description": "Standard weekly menu",
  "isActive": false,
  "createdAt": "2026-06-01T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to delete menu" }` |

---

## Users

Base path: `/users`

### GET `/users`

Retrieve all users (safe projection — excludes `passwordHash`).

**Query Parameters:** None

**Success Response (200):**

```json
[
  {
    "id": 1,
    "email": "john@example.com",
    "referenceEmail": "john.doe@company.com",
    "status": "ACTIVE",
    "roleId": 1,
    "referenceId": 1001,
    "role": {
      "name": "user"
    }
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to retrieve users" }` |

---

### GET `/users/:id`

Retrieve a single user by ID (safe projection).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Success Response (200):**

```json
{
  "id": 1,
  "email": "john@example.com",
  "referenceEmail": "john.doe@company.com",
  "status": "ACTIVE",
  "roleId": 1,
  "referenceId": 1001,
  "role": {
    "name": "user"
  }
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to retrieve user" }` |

---

### GET `/users/:id/leaves`

Retrieve leave and availability records for a specific user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "userId": 1,
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-09-02T23:59:59.999Z",
    "daysCount": 2,
    "createdAt": "2026-08-20T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid user ID" }` |
| 500 | `{ "message": "Failed to retrieve user leaves" }` |

---

### PUT `/users/:id`

Update user details.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Request Body:**

```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "status": "ACTIVE | INACTIVE | RETIRED (optional)",
  "roleId": "number (optional)"
}
```

**Success Response (200):** Returns the full updated user record.

```json
{
  "id": 1,
  "name": "John Updated",
  "email": "john.updated@example.com",
  "referenceEmail": "john.doe@company.com",
  "referenceId": 1001,
  "status": "ACTIVE",
  "passwordHash": "...",
  "createdAt": "2026-05-21T11:21:43.000Z",
  "isActivated": true,
  "roleId": 1
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to update user details" }` |

---

## Taste Profiles

Base path: `/users/taste-profiles`

### GET `/users/taste-profiles/:id`

Retrieve taste profiles. (Currently returns all taste profiles regardless of user ID.)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Success Response (200):**

```json
[
  {
    "userId": 1,
    "calendarYear": 2026,
    "totalMealsSelected": 45,
    "metrics": {
      "proteinPreference": { "GC001": 12, "BF002": 8 },
      "basePreference": { "RC001": 15 }
    },
    "personalityType": "adventurous",
    "favoriteProtein": "GC001",
    "updatedAt": "2026-07-01T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Invalid User ID" }` |
| 500 | `{ "message": "Failed to Fetch Taste Profile by User ID" }` |

---

## Week Menu Schedules

Base path: `/week-menu-schedules`

> Week menu schedule routes currently do not apply server-side authentication or role middleware. Related menu values are returned as `menu.title`.

### GET `/week-menu-schedules`

Retrieve all week menu schedules.

**Query Parameters:** None

**Success Response (200):**

```json
[
  {
    "id": 1,
    "week": 27,
    "year": 2026,
    "menu": {
      "id": 1,
      "title": "Week 27 Menu"
    },
    "status": "ACTIVE"
  },
  {
    "id": 2,
    "week": 28,
    "year": 2026,
    "menu": {
      "id": 2,
      "title": "Week 28 Menu"
    },
    "status": "DRAFT"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to fetch week menu schedules" }` |

---

### GET `/week-menu-schedules/:id`

Retrieve a week menu schedule by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Schedule ID |

**Success Response (200):**

```json
{
  "id": 1,
  "week": 27,
  "year": 2026,
  "menu": {
    "id": 1,
    "title": "Week 27 Menu"
  },
  "status": "ACTIVE"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid week menu schedule ID" }` |
| 404 | `{ "error": "Week menu schedule not found" }` |
| 500 | `{ "error": "Failed to fetch week menu schedule" }` |

---

### GET `/week-menu-schedules/by-week-year`

Retrieve a week menu schedule by ISO week number and year.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| week | number | Yes | ISO week number (1–53) |
| year | number | Yes | Year (e.g. 2026) |

**Success Response (200):**

```json
{
  "id": 1,
  "week": 27,
  "year": 2026,
  "menu": {
    "id": 1,
    "title": "Week 27 Menu"
  },
  "status": "ACTIVE"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid week or year" }` |
| 404 | `{ "error": "Week menu schedule not found" }` |
| 500 | `{ "error": "Failed to fetch week menu schedule" }` |

---

### GET `/week-menu-schedules/by-menu`

Retrieve all week menu schedules that use a specific menu.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| menuId | number | Yes | Menu ID |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "week": 27,
    "year": 2026,
    "menu": {
      "id": 1,
      "title": "Week 27 Menu"
    },
    "status": "ACTIVE"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid menu ID" }` |
| 500 | `{ "error": "Failed to fetch week menu schedules" }` |

---

### POST `/week-menu-schedules`

Create a new week menu schedule. Only one schedule per week+year combination is allowed.

**Request Body:**

```json
{
  "week": 28,
  "year": 2026,
  "menuId": 2
}
```

**Success Response (201):**

```json
{
  "id": 3,
  "week": 28,
  "year": 2026,
  "menu": {
    "id": 2,
    "title": "Week 28 Menu"
  },
  "status": "DRAFT"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid week, year, or menu ID" }` |
| 400 | `{ "error": "A week menu schedule for the specified week and year already exists" }` |
| 500 | `{ "error": "Failed to create week menu schedule" }` |

---

### PUT `/week-menu-schedules/:id`

Update a week menu schedule.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Schedule ID |

**Request Body:**

```json
{
  "week": 28,
  "year": 2026,
  "menuId": 3,
  "status": "ACTIVE | DRAFT | LOCKED | CLOSED"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "week": 28,
  "year": 2026,
  "menu": {
    "id": 3,
    "title": "Updated Menu"
  },
  "status": "ACTIVE"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid week menu schedule ID or data" }` |
| 404 | `{ "error": "Week menu schedule not found" }` |
| 500 | `{ "error": "Failed to update week menu schedule" }` |

---

## Meal Selections

Base path: `/meal-selections`

All selection endpoints that return selection objects use the following shape:

**Selection Object Shape:**

```json
{
  "id": 1,
  "createdBy": 1,
  "createdFor": 2,
  "weekMenuScheduleId": 1,
  "selectionStatus": "PENDING",
  "createdByUser": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "createdForUser": {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "menuDay": {
    "id": 1,
    "day": "MONDAY"
  },
  "dayMeal": {
    "id": 3,
    "meal": {
      "id": 5,
      "name": "Grilled Chicken"
    }
  },
  "createdAt": "2026-07-01T10:00:00.000Z",
  "updatedAt": "2026-07-01T10:00:00.000Z"
}
```

---

### GET `/meal-selections`

Retrieve all meal selections.

**Query Parameters:** None

**Success Response (200):** Array of Selection objects (see shape above).

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to fetch selections" }` |

---

### GET `/meal-selections/date-range`

Retrieve selections created within a date range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (ISO date) | Yes | Start date (inclusive) |
| endDate | string (ISO date) | Yes | End date (inclusive) |

**Success Response (200):** Array of Selection objects.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Start date and end date are required" }` |
| 500 | `{ "error": "Failed to fetch selections by date range" }` |

---

### GET `/meal-selections/filter`

Retrieve selections matching filter criteria. All filters are optional and combined with AND logic.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | number | No | Filter by `createdFor` user ID |
| mealId | number | No | Filter by meal ID |
| day | string | No | Filter by day (e.g. "MONDAY") |
| menuId | number | No | Filter by menu ID |

**Success Response (200):** Array of Selection objects.

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to fetch selections by filter" }` |

---

### GET `/meal-selections/:id`

Retrieve a single selection by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Selection ID |

**Success Response (200):** Single Selection object.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid selection ID" }` |
| 404 | `{ "error": "Selection not found" }` |
| 500 | `{ "error": "Failed to fetch selection by ID" }` |

---

### GET `/meal-selections/by-user/:id`

Retrieve all selections created for a specific user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID (`createdFor`) |

**Success Response (200):** Array of Selection objects.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid user ID" }` |
| 500 | `{ "error": "Failed to fetch selections by user ID" }` |

---

### GET `/meal-selections/by-meal/:id`

Retrieve all selections for a specific meal.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Meal ID |

**Success Response (200):** Array of Selection objects.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid meal ID" }` |
| 500 | `{ "error": "Failed to fetch selections by meal ID" }` |

---

### GET `/meal-selections/weekly`

Retrieve all selections for the week containing the given date. Uses ISO week calculation to find the relevant `WeekMenuSchedule`.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string (ISO date) | Yes | Any date within the target week |

**Success Response (200):** Array of Selection objects for the entire week.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Date parameter is required" }` |
| 500 | `{ "error": "Failed to fetch selections by date" }` |

---

### GET `/meal-selections/weekly/by-date`

Retrieve selections for a specific day within its ISO week. Only returns selections for that specific day of the week.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string (ISO date) | Yes | The specific date |

**Success Response (200):** Array of Selection objects for that day.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Date parameter is required" }` |
| 500 | `{ "error": "Failed to fetch selections by date" }` |

---

### GET `/meal-selections/weekly/by-user/:id`

Retrieve all weekly selections for a specific user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID (`createdFor`) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string (ISO date) | Yes | Any date within the target week |

**Success Response (200):** Array of Selection objects for the user in that week.

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Date parameter is required" }` |
| 400 | `{ "error": "User ID is required" }` |
| 500 | `{ "error": "Failed to fetch selections by date" }` |

---

### GET `/meal-selections/weekly/no-selections`

Retrieve users who have made fewer than 5 selections for the week (i.e., missing at least one day).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string (ISO date) | Yes | Any date within the target week |

**Success Response (200):**

```json
[
  { "id": 3, "name": "Alice Smith", "email": "alice@example.com" },
  { "id": 7, "name": "Bob Johnson", "email": "bob@example.com" }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Date parameter is required" }` |
| 500 | `{ "message": "Failed to fetch users without selections" }` |

---

### GET `/meal-selections/weekly/with-selections`

Retrieve active users who have actually made meal selections for the specified week.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string (ISO date) | Yes | Any date within the target week |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "Calvin Debrah Ampadu",
    "email": "cd@example.com",
    "referenceEmail": "cd@example.com",
    "status": "ACTIVE",
    "roleId": 1,
    "referenceId": 100,
    "role": { "name": "Employee" }
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid query parameters" }` |
| 500 | `{ "message": "Failed to fetch users with selections" }` |

---

### POST `/meal-selections`

Create a new meal selection. Validates that no duplicate selection exists for the same user + schedule + day combination.

**Request Body:**

```json
{
  "dayMealId": 3,
  "createdBy": 1,
  "createdFor": 2,
  "weekMenuScheduleId": 1,
  "menuDayId": 1
}
```

**Success Response (201):** Single Selection object (see shape above).

**Error Responses:**

| Status | Body |
|--------|------|
| 403 | `{ "error": "Selection cannot be created because a selection has already been made for this day." }` |
| 500 | `{ "error": "Failed to create a new selection" }` |

---

### POST `/meal-selections/batch`

Create multiple selections in a batch. Validates each selection for duplicates before creating.

**Request Body:**

```json
[
  {
    "dayMealId": 3,
    "createdBy": 1,
    "createdFor": 2,
    "weekMenuScheduleId": 1,
    "menuDayId": 1
  },
  {
    "dayMealId": 5,
    "createdBy": 1,
    "createdFor": 2,
    "weekMenuScheduleId": 1,
    "menuDayId": 2
  }
]
```

**Success Response (201):**

```json
{
  "count": 2
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 403 | `{ "error": "Selection cannot be created because selection for this date already exists)." }` |
| 500 | `{ "error": "Failed to create new selections batch" }` |

---

### PUT `/meal-selections/:id`

Update an existing selection. Cannot update selections with status `SUBMITTED`.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Selection ID |

**Request Body:**

```json
{
  "dayMealId": 7,
  "createdBy": 1,
  "createdFor": 2,
  "weekMenuScheduleId": 1,
  "menuDayId": 1
}
```

**Success Response (200):** Updated Selection object (see shape above).

**Error Responses:**

| Status | Body |
|--------|------|
| 403 | `{ "error": "Cannot update a selection that has already been submitted." }` |
| 404 | `{ "error": "Selection not found" }` |
| 500 | `{ "error": "Failed to update selection" }` |

---

### PUT `/meal-selections/batch`

Update multiple selections in a batch. Cannot update any selection with status `SUBMITTED`.

**Request Body:**

```json
[
  {
    "id": 1,
    "data": {
      "dayMealId": 7
    }
  },
  {
    "id": 2,
    "data": {
      "dayMealId": 8
    }
  }
]
```

**Success Response (200):** Array of updated Selection objects.

**Error Responses:**

| Status | Body |
|--------|------|
| 403 | `{ "error": "Selection with ID 1 has already been submitted and cannot be updated." }` |
| 500 | `{ "error": "Failed to update selections batch" }` |

---

### PATCH `/meal-selections/submit`

Submit specific selections by their IDs. Changes their `selectionStatus` from `PENDING` to `SUBMITTED`.

**Request Body:**

```json
{
  "selectionIds": [1, 2, 3, 4, 5]
}
```

**Success Response (200):**

```json
{
  "message": "Selections submitted successfully"
}
```

> Internally returns `{ count: N }` from Prisma `updateMany`.

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to submit selections" }` |

---

### PATCH `/meal-selections/submit-weekly`

Submit all selections for a specific week and year. Finds the `WeekMenuSchedule` and updates all related selections to `SUBMITTED`.

**Request Body:**

```json
{
  "weekNumber": 27,
  "year": 2026
}
```

**Success Response (200):**

```json
{
  "message": "Weekly selections submitted successfully"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "error": "Failed to submit weekly selections" }` |

---

## Presets

Base path: `/presets`

### GET `/presets`

Retrieve all presets.

**Query Parameters:** None

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "My Weekly Preset",
    "description": "My favorite meals for the week",
    "userId": 1,
    "createdAt": "2026-06-15T10:00:00.000Z",
    "updatedAt": "2026-06-15T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to retrieve presets" }` |

---

### GET `/presets/:id`

Retrieve a single preset by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Preset ID |

**Success Response (200):**

```json
{
  "id": 1,
  "name": "My Weekly Preset",
  "description": "My favorite meals for the week",
  "userId": 1,
  "createdAt": "2026-06-15T10:00:00.000Z",
  "updatedAt": "2026-06-15T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset Id" }` |
| 500 | `{ "message": "Failed to retrieve preset by ID" }` |

---

### GET `/presets/by-user/:id`

Retrieve all presets belonging to a specific user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "My Weekly Preset",
    "description": "My favorite meals",
    "userId": 1,
    "createdAt": "2026-06-15T10:00:00.000Z",
    "updatedAt": "2026-06-15T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid User Id" }` |
| 500 | `{ "message": "Failed to retrieve preset by ID" }` |

---

### GET `/presets/with-details/:id`

Retrieve a preset with full details including items grouped by day of the week.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Preset ID |

**Success Response (200):**

```json
{
  "id": 1,
  "name": "My Weekly Preset",
  "description": "My favorite meals",
  "userId": 1,
  "createdAt": "2026-06-15T10:00:00.000Z",
  "updatedAt": "2026-06-15T10:00:00.000Z",
  "presetItems": [
    {
      "id": 1,
      "presetId": 1,
      "menuDayId": 1,
      "dayMealId": 3,
      "createdAt": "2026-06-15T10:00:00.000Z",
      "updatedAt": "2026-06-15T10:00:00.000Z",
      "menuDay": { "day": "MONDAY" },
      "menuDayMeals": {
        "id": 3,
        "createdAt": "...",
        "updatedAt": "...",
        "isActive": true,
        "menuDayId": 1,
        "mealId": 5,
        "meal": {
          "name": "Grilled Chicken",
          "id": 5
        }
      }
    }
  ],
  "presetItemsGrouped": [
    {
      "day": "MONDAY",
      "items": [
        {
          "id": 1,
          "presetId": 1,
          "menuDayId": 1,
          "dayMealId": 3,
          "menuDay": { "day": "MONDAY" },
          "menuDayMeals": {
            "meal": { "name": "Grilled Chicken", "id": 5 }
          }
        }
      ]
    },
    { "day": "TUESDAY", "items": [] },
    { "day": "WEDNESDAY", "items": [] },
    { "day": "THURSDAY", "items": [] },
    { "day": "FRIDAY", "items": [] },
    { "day": "SATURDAY", "items": [] },
    { "day": "SUNDAY", "items": [] }
  ]
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset Id" }` |
| 500 | `{ "message": "Failed to retrieve preset with details" }` |

---

### POST `/presets`

Create a new preset.

**Request Body:**

```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "userId": 1
}
```

**Success Response (200):**

```json
{
  "id": 2,
  "name": "New Preset",
  "description": null,
  "userId": 1,
  "createdAt": "2026-07-05T10:00:00.000Z",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 401 | `{ "error": "Invalid preset body" }` |
| 500 | `{ "message": "Failed to retrieve presets" }` |

---

### PUT `/presets/:id`

Update a preset's name or description.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Preset ID |

**Request Body:**

```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "name": "Updated Preset Name",
  "description": "Updated description",
  "userId": 1,
  "createdAt": "2026-06-15T10:00:00.000Z",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 401 | `{ "error": "Invalid Preset ID" }` |
| 500 | `{ "message": "Failed to retrieve presets" }` |

---

### GET `/presets/:id/items`

Retrieve all preset items for a given preset.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Preset ID |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "presetId": 1,
    "menuDayId": 1,
    "dayMealId": 3,
    "createdAt": "2026-06-15T10:00:00.000Z",
    "updatedAt": "2026-06-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "presetId": 1,
    "menuDayId": 2,
    "dayMealId": 5,
    "createdAt": "2026-06-15T10:00:00.000Z",
    "updatedAt": "2026-06-15T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset Id" }` |
| 500 | `{ "message": "Failed to retrieve preset Items by Preset ID" }` |

---

### POST `/presets/items`

Create a single preset item.

**Request Body:**

```json
{
  "menuDayId": 1,
  "dayMealId": 3
}
```

**Success Response (200):**

```json
{
  "id": 3,
  "presetId": 1,
  "menuDayId": 1,
  "dayMealId": 3,
  "createdAt": "2026-07-05T10:00:00.000Z",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset Id" }` |
| 500 | `{ "message": "Failed to retrieve preset Items by Preset ID" }` |

---

### POST `/presets/items-batch`

Create multiple preset items in a batch.

**Request Body:**

```json
[
  { "menuDayId": 1, "dayMealId": 3 },
  { "menuDayId": 2, "dayMealId": 5 },
  { "menuDayId": 3, "dayMealId": 7 }
]
```

**Success Response (200):**

```json
{
  "count": 3
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset ID" }` |
| 500 | `{ "message": "Failed to retrieve preset Items by Preset ID" }` |

---

### PUT `/presets/items/:id`

Update a preset item.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Preset Item ID |

**Request Body:**

```json
{
  "menuDayId": 2,
  "dayMealId": 8
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "presetId": 1,
  "menuDayId": 2,
  "dayMealId": 8,
  "createdAt": "2026-06-15T10:00:00.000Z",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset ID" }` |
| 500 | `{ "message": "Failed to retrieve presets" }` |

---

### DELETE `/presets/items/:id`

Delete a preset item.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Preset Item ID |

**Success Response (200):**

```json
{
  "id": 1,
  "presetId": 1,
  "menuDayId": 1,
  "dayMealId": 3,
  "createdAt": "2026-06-15T10:00:00.000Z",
  "updatedAt": "2026-06-15T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid Preset ID" }` |
| 500 | `{ "message": "Failed to retrieve presets" }` |

---

## Food Library

Base path: `/food-library`

### GET `/food-library`

Retrieve all food items from the library.

**Query Parameters:** None

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "Rice",
    "foodCode": "RC001",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22T10:00:00.000Z",
    "updatedAt": "2026-06-22T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Chicken Breast",
    "foodCode": "CB001",
    "foodGroup": "PROTEIN",
    "createdAt": "2026-06-22T10:00:00.000Z",
    "updatedAt": "2026-06-22T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 500 | `{ "message": "Failed to fetch food items" }` |

---

### GET `/food-library/:foodGroup`

Retrieve food items filtered by food group.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| foodGroup | FoodGroup enum | One of: `SUPERGROUP`, `BASE`, `PROTEIN`, `PREP` |

**Success Response (200):**

```json
[
  {
    "id": 1,
    "name": "Rice",
    "foodCode": "RC001",
    "foodGroup": "BASE",
    "createdAt": "2026-06-22T10:00:00.000Z",
    "updatedAt": "2026-06-22T10:00:00.000Z"
  }
]
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "message": "Food Group Invalid" }` |
| 500 | `{ "error": "Failed to fetch food groups" }` |

---

### POST `/food-library`

Create a single food item.

**Request Body:**

```json
{
  "name": "Quinoa",
  "foodCode": "QN001",
  "foodGroup": "BASE"
}
```

**Success Response (200):**

```json
"Successfully created food item"
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid request body" }` |
| 500 | `{ "error": "Failed to create food item" }` |

---

### POST `/food-library/batch`

Create multiple food items in a batch. Skips duplicates based on `foodCode` + `foodGroup` unique constraint.

**Request Body:**

```json
[
  { "name": "Quinoa", "foodCode": "QN001", "foodGroup": "BASE" },
  { "name": "Tofu", "foodCode": "TF001", "foodGroup": "PROTEIN" },
  { "name": "Olive Oil", "foodCode": "OO001", "foodGroup": "PREP" }
]
```

**Success Response (200):**

```json
{
  "count": 3
}
```

**Error Responses:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Request body must be an array" }` |
| 500 | `{ "error": "Failed to create food items" }` |
