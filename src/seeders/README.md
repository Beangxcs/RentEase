# Database Seeders

This directory contains seeder files to populate the database with sample data for development and testing purposes.

## Available Seeders

### User Seeder
Seeds 10 sample users with different roles and verification statuses.

**Run the seeder:**
```bash
npm run seed:users
```

**Seeded Users:**

1. **Admin User** (admin@rentease.com)
   - Role: Admin
   - Password: `Admin@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: Yes

2. **John Doe** (john.doe@example.com)
   - Role: Rentor
   - Password: `Password@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: Yes

3. **Maria Santos** (maria.santos@example.com)
   - Role: Rentor
   - Password: `Password@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: Yes

4. **Robert Chen** (robert.chen@example.com)
   - Role: Staff
   - Password: `Password@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: Yes

5. **Ana Reyes** (ana.reyes@example.com)
   - Role: Rentor
   - Password: `Password@123`
   - ID Verified: No
   - Email Verified: Yes
   - Active: Yes

6. **Michael Torres** (michael.torres@example.com)
   - Role: Rentor
   - Password: `Password@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: No

7. **Sofia Rodriguez** (sofia.rodriguez@example.com)
   - Role: Rentor
   - Password: `Password@123`
   - ID Verified: No
   - Email Verified: No
   - Active: No

8. **David Cruz** (david.cruz@example.com)
   - Role: Staff
   - Password: `Password@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: Yes

9. **Isabella Garcia** (isabella.garcia@example.com)
   - Role: Rentor
   - Password: `Password@123`
   - ID Verified: Yes
   - Email Verified: Yes
   - Active: Yes

10. **James Lim** (james.lim@example.com)
    - Role: Rentor
    - Password: `Password@123`
    - ID Verified: No
    - Email Verified: No
    - Active: Yes

## Notes

- ⚠️ **Warning:** Running seeders will **DELETE ALL EXISTING USERS** in the database
- All seeded users have the same password for testing convenience: `Password@123`
- The admin user has special credentials: `Admin@123`
- Make sure your `.env` file is configured with the correct MongoDB connection string
- Seeders are intended for development/testing environments only
- Never run seeders in production!

## Usage Example

```bash
# Make sure you're in the project root directory
cd RentEase

# Run the user seeder
npm run seed:users
```

## Expected Output

```
Connected to MongoDB...
Cleared existing users...
✅ Successfully seeded 10 users!

📋 Created Users:
1. Admin User (admin@rentease.com) - admin
2. John Doe (john.doe@example.com) - rentor
3. Maria Santos (maria.santos@example.com) - rentor
4. Robert Chen (robert.chen@example.com) - staff
5. Ana Reyes (ana.reyes@example.com) - rentor
6. Michael Torres (michael.torres@example.com) - rentor
7. Sofia Rodriguez (sofia.rodriguez@example.com) - rentor
8. David Cruz (david.cruz@example.com) - staff
9. Isabella Garcia (isabella.garcia@example.com) - rentor
10. James Lim (james.lim@example.com) - rentor
```

## User Types

- **admin**: Full system access, can manage all users and properties
- **staff**: Can manage bookings and properties
- **rentor**: Regular users who can rent properties

## Testing Different Scenarios

The seeded users cover various scenarios:
- Verified and unverified email addresses
- Verified and unverified IDs
- Active and inactive accounts
- Different user roles (admin, staff, rentor)
- Various locations across Metro Manila
