# Adding Users to Spotify App (Development Mode)

If users get **403 Forbidden** when searching, they need to be added to your Spotify app's allowlist.

## Steps to Add Users

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with the account that created the app

2. **Select Your App**
   - Click on your app (the one with Client ID: `011c5f27eef64dd0b6f65ca673215a58`)

3. **Navigate to Settings**
   - Click "Settings" in the top right

4. **Add Users**
   - Scroll down to "User Management" section
   - Click "Add New User"
   - Enter the user's **name** and **Spotify email address**
   - Click "Add"

5. **User Accepts Invitation**
   - The user will receive an email invitation
   - They must click the link to accept
   - After acceptance, they can use the app

## Limitations in Development Mode

- **Maximum 25 users** can be added
- Each user must be added manually
- Users must accept the email invitation
- Cannot be used by the general public

## Moving to Extended Quota Mode (Public Access)

If you need more than 25 users or want public access:

1. **Complete App Information**
   - Add app description
   - Add privacy policy URL
   - Add terms of service URL
   - Add app icon/logo

2. **Request Extension**
   - Go to your app in the dashboard
   - Click "Request Extension" or "Submit for Review"
   - Fill out the extension request form
   - Wait for Spotify approval (can take several weeks)

3. **After Approval**
   - App can be used by anyone
   - No need to add individual users
   - Higher API rate limits

## Checking Current Mode

In the Spotify Developer Dashboard:
- Look for "Quota" section in your app settings
- It will show "Development Mode" or "Extended Quota Mode"
- Development Mode shows how many users you've added (X/25)

## Alternative: Create Test Accounts

For testing purposes, you can:
1. Create test Spotify accounts (free or premium)
2. Add those emails to the allowlist
3. Share credentials with testers

## Reference

- Spotify Developer Docs: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Dashboard: https://developer.spotify.com/dashboard
