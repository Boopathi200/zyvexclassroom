# Deployment Setup Guide for ZYVEX Classroom

## Production Deployment Status

- **Frontend**: https://zyvexclassroom.vercel.app ✅
- **Backend**: https://zyvexclassroom-backend.onrender.com (⚠️ Needs Configuration)

## Backend Configuration Issues

The backend on Render is failing because environment variables are not configured. Follow these steps to fix it:

### Step 1: Set Environment Variables on Render

Go to: https://dashboard.render.com/web/srv-d82lq6kvikkc73aee35g/env

Add the following environment variables:

1. **MONGODB_URI** (REQUIRED)
   - Value: Your MongoDB Atlas connection string
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
   - Get from: https://www.mongodb.com/cloud/atlas
   
2. **JWT_SECRET** (REQUIRED)
   - Value: A long random string for JWT signing
   - Example: `your_very_long_secret_key_change_this_1234567890abc`
   - Keep this secret and secure
   
3. **CLIENT_URL** (REQUIRED)
   - Value: `https://zyvexclassroom.vercel.app`
   - This enables CORS for the frontend
   
4. **PORT** (OPTIONAL)
   - Value: `5000`
   - Default is fine
   
5. **OPENAI_API_KEY** (OPTIONAL)
   - Value: Your OpenAI API key if using AI features
   - Get from: https://platform.openai.com/api-keys
   
6. **OPENAI_MODEL** (OPTIONAL)
   - Value: `gpt-4o-mini`
   - Default is fine

### Step 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user with username and password
4. Whitelist Render IP (0.0.0.0/0 for simplicity, or specific Render IPs)
5. Copy the connection string and use it for MONGODB_URI

### Step 3: Verify Backend Connection

After setting environment variables:

1. Restart the Render service:
   - Go to https://dashboard.render.com/web/srv-d82lq6kvikkc73aee35g
   - Click "Manual Deploy" → "Deploy latest commit"

2. Check the logs:
   - Go to https://dashboard.render.com/web/srv-d82lq6kvikkc73aee35g/logs
   - You should see: `Zyvex Classroom server on port 5000`
   - And: `MongoDB connected`

3. Test health endpoint:
   ```bash
   curl https://zyvexclassroom-backend.onrender.com/api/health
   ```
   - Should return: `{"ok": true, "name": "Zyvex Classroom API"}`

### Step 4: Test Full Application

1. Go to https://zyvexclassroom.vercel.app
2. Click "Get started" or "Create account"
3. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123!
   - Role: Student
4. Click "Create account"
5. You should be logged in and redirected to the dashboard

### Troubleshooting

**Error: "Request failed" on Registration/Login**
- Check that all environment variables are set on Render
- Verify MongoDB connection string is correct
- Check Render logs for detailed error messages

**Error: MongoDB connection timeout**
- Whitelist Render IP addresses in MongoDB Atlas
- Verify connection string format is correct
- Check username/password in connection string

**Error: CORS issue in browser console**
- Verify CLIENT_URL is set to `https://zyvexclassroom.vercel.app`
- Restart Render deployment after changing env vars

**Backend not starting**
- Check all required environment variables are set
- Review Render logs for startup errors
- Ensure Node.js version is compatible (14+)

## Environment Variables Summary

| Variable | Required | Production Value |
|----------|----------|------------------|
| MONGODB_URI | Yes | MongoDB Atlas connection string |
| JWT_SECRET | Yes | Random secret string |
| CLIENT_URL | Yes | https://zyvexclassroom.vercel.app |
| PORT | No | 5000 |
| OPENAI_API_KEY | No | OpenAI API key |
| OPENAI_MODEL | No | gpt-4o-mini |

## Testing Checklist

- [ ] All environment variables set on Render
- [ ] MongoDB cluster created and user configured
- [ ] Backend deployment restarted
- [ ] Health check endpoint responds
- [ ] User registration works
- [ ] User login works
- [ ] Create classroom works
- [ ] Upload video works
- [ ] Take quiz works

## Support

For detailed logs and monitoring:
- Backend Logs: https://dashboard.render.com/web/srv-d82lq6kvikkc73aee35g/logs
- Backend Settings: https://dashboard.render.com/web/srv-d82lq6kvikkc73aee35g/settings
- Frontend Deployments: https://vercel.com/boopathi-s-projects1/zyvexclassroom
