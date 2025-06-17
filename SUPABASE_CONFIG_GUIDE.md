# Supabase Configuration for Production

## 🔧 Required Supabase Dashboard Settings

### 1. **Site URL Configuration**
Go to: **Supabase Dashboard > Authentication > URL Configuration**

Set these values:
- **Site URL:** `https://auberonchat.vercel.app`
- **Redirect URLs:** Add these URLs:
  - `https://auberonchat.vercel.app/auth/callback`
  - `https://auberonchat.vercel.app/chat`
  - `http://localhost:3000/auth/callback` (for local development)
  - `http://localhost:3000/chat` (for local development)

### 2. **OAuth Provider Settings**
Go to: **Supabase Dashboard > Authentication > Providers**

**For Google OAuth:**
- Enable Google provider
- Set **Authorized redirect URIs** in Google Console to:
  - `https://pspikeinjqgtmuixbruc.supabase.co/auth/v1/callback`

**For GitHub OAuth:**
- Enable GitHub provider  
- Set **Authorization callback URL** in GitHub App to:
  - `https://pspikeinjqgtmuixbruc.supabase.co/auth/v1/callback`

### 3. **Email Templates**
Go to: **Supabase Dashboard > Authentication > Email Templates**

Update the **Confirm signup** template:
- Replace any `{{ .SiteURL }}` with `https://auberonchat.vercel.app`
- Ensure confirmation links point to your production domain

## 🚀 After Making These Changes

1. **Redeploy your app** to Vercel to use the new environment variable
2. **Test email confirmation** - new signups should get correct links
3. **Test OAuth redirects** - should redirect to your production site

## ⚠️ Common Issues

- **Still seeing localhost?** Clear browser cache and try incognito mode
- **Email links broken?** Check email templates in Supabase dashboard
- **OAuth not working?** Verify redirect URIs in provider (Google/GitHub) settings

Your environment is now configured for: **https://auberonchat.vercel.app** 🎯
