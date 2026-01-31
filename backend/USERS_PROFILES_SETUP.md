# Users & Profiles Database Setup - Halal Kitchen Backend

## ✅ Implementation Complete

PostgreSQL tables for users and profiles have been created, along with data access layers and dev-only API routes for testing.

## Database Schema

### `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `profiles` Table
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  halal_standard TEXT DEFAULT 'standard',
  school_of_thought TEXT DEFAULT 'hanafi',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
```

## Files Created

### 1. `backend/src/db/users.js` (NEW)
Data access layer for users table:
- `createUser(email, password)` - Creates a new user with hashed password
- `getUserByEmail(email)` - Gets user by email (includes password_hash)
- `getUserById(userId)` - Gets user by ID (without password_hash)
- `verifyUserPassword(email, password)` - Verifies password and returns user
- `getAllUsers()` - Gets all users (for dev/testing)

**Features:**
- Email validation (format check)
- Password validation (minimum 6 characters)
- Password hashing with bcrypt (10 rounds)
- Duplicate email handling (PostgreSQL unique violation)
- Email normalization (lowercase, trimmed)

### 2. `backend/src/db/profiles.js` (NEW)
Data access layer for profiles table:
- `createProfile(userId, profileData)` - Creates a profile for a user
- `getProfileByUserId(userId)` - Gets profile by user ID
- `updateProfile(userId, profileData)` - Updates profile fields
- `getUserWithProfile(userId)` - Gets user with joined profile
- `getAllUsersWithProfiles()` - Gets all users with profiles (for dev/testing)

**Features:**
- Foreign key validation (user must exist)
- Duplicate profile prevention (UNIQUE constraint)
- Dynamic update queries (only updates provided fields)
- Default values for preferences (standard, hanafi, en, light)

### 3. `backend/src/routes/dev.js` (NEW)
Development-only routes for testing:
- `POST /api/dev/create-user` - Creates user + profile in a transaction
- `GET /api/dev/users` - Lists all users with profiles (no password_hash)

**Features:**
- Transaction support (user + profile created atomically)
- Input validation (email format, password length)
- Duplicate email handling (409 Conflict)
- Error handling with rollback
- Clear dev-only warnings in code

### 4. `backend/src/database.js` (MODIFIED)
Updated `initializeDatabase()` to create users and profiles tables.

### 5. `backend/src/index.js` (MODIFIED)
Added dev router: `app.use("/api/dev", devRouter)`

## API Endpoints

### POST `/api/dev/create-user`
Creates a new user and profile in a single transaction.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User and profile created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T12:00:00.000Z"
  },
  "profile": {
    "id": 1,
    "display_name": "user",
    "halal_standard": "standard",
    "school_of_thought": "hanafi",
    "language": "en",
    "theme": "light"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

**Response (Error - 409):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

### GET `/api/dev/users`
Returns all users with their profiles (no password_hash).

**Response (Success - 200):**
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "created_at": "2024-01-01T12:00:00.000Z",
      "profile": {
        "id": 1,
        "display_name": "user",
        "avatar_url": null,
        "halal_standard": "standard",
        "school_of_thought": "hanafi",
        "language": "en",
        "theme": "light",
        "created_at": "2024-01-01T12:00:00.000Z"
      }
    }
  ]
}
```

## Security Features

1. **Password Hashing**: bcrypt with 10 rounds
2. **Email Normalization**: Lowercase and trimmed
3. **Input Validation**: Email format and password length checks
4. **Duplicate Prevention**: Unique constraint on email
5. **Transaction Safety**: User + profile created atomically
6. **No Password Exposure**: password_hash never returned in responses

## Default Profile Values

When a user is created, a profile is automatically created with:
- `display_name`: Email prefix (e.g., "user" from "user@example.com")
- `halal_standard`: "standard"
- `school_of_thought`: "hanafi"
- `language`: "en"
- `theme`: "light"
- `avatar_url`: null

## Testing

### Create a User
```bash
curl -X POST http://localhost:3000/api/dev/create-user \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### List All Users
```bash
curl http://localhost:3000/api/dev/users
```

## Production Notes

⚠️ **IMPORTANT**: The `/api/dev/*` routes are development-only and should be:
1. **Removed** before production, OR
2. **Protected** with authentication/authorization, OR
3. **Disabled** via environment variable check

Example protection:
```javascript
if (process.env.NODE_ENV === 'production') {
  router.use((req, res) => {
    res.status(403).json({ error: 'Dev routes disabled in production' });
  });
}
```

## Next Steps

Once these endpoints work on Render:
- ✅ Users and profiles are persisted in PostgreSQL
- ✅ Ready to build JWT authentication
- ✅ Ready to migrate recipe posting to use user IDs
- ✅ Ready to implement profile management endpoints

**Do NOT proceed with auth/JWT until these dev routes work on Render.**

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2024
**Version**: 1.0.0
