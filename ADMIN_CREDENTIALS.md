# Admin User Credentials

## Problem
The comments management page shows no comments because you are logged in as a regular user (role: 'user'), not an admin. The admin endpoints require admin privileges.

## Solution

Use the admin credentials below to log in:

### Admin User Account
- **Username**: `admin_test`
- **Email**: `admin@test.com`
- **Password**: `Admin123XYZ`
- **Role**: `admin`

### How to Use

1. **Log out** of your current account
2. **Log in** with the admin credentials:
   - Email: `admin@test.com`
   - Password: `Admin123XYZ`
3. Navigate to the **Comments Management** page at http://localhost:3003/admin/comments

### API Testing

You can also test the admin API directly:

```bash
# Login and get token
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123XYZ"}'

# Get comments list
curl http://localhost:3000/v1/admin/comments \
  -H "Authorization: Bearer <your-token>"
```

### Database Info

Total comments in database: 14
- Pending: 9 comments
- Approved: 5 comments
- Rejected: 0 comments

The admin account has full access to:
- User management (view, edit roles, delete users)
- Comment moderation (approve, reject, mark as spam, delete)
- Admin statistics and dashboard

### Notes

- The test user `test_user_1766825852` has role 'user' and cannot access admin features
- Only users with role 'admin' can access the `/admin/*` endpoints
- The existing admin user `demo2024` exists but the password is unknown
