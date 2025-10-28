# BoothNow Setup Guide

This guide will help you set up the complete BoothNow platform with all integrations.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI for mobile development
- Git
- Accounts for: Clerk, Supabase, Google Cloud, Creem

## 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd BoothNow
npm run install:all
```

## 2. Environment Setup

### Backend (.env)
Copy `backend/env.example` to `backend/.env` and fill in your values:

```bash
cd backend
cp env.example .env
```

Required services:
- **Clerk**: Get keys from [clerk.com](https://clerk.com)
- **Supabase**: Create project at [supabase.com](https://supabase.com)
- **Google Maps**: Enable APIs at [Google Cloud Console](https://console.cloud.google.com)
- **Creem**: Get API key from [creem.io](https://creem.io)

### Frontend (Mobile)
Copy `frontend/env.example` to `frontend/.env`:

```bash
cd frontend
cp env.example .env
```

### Web Dashboard
Copy `web/env.example` to `web/.env.local`:

```bash
cd web
cp env.example .env.local
```

## 3. Database Setup

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema from `backend/database/schema.sql`
3. Enable Row Level Security (RLS) policies
4. Set up real-time subscriptions

```sql
-- Run this in Supabase SQL Editor
\i backend/database/schema.sql
```

## 4. Service Configuration

### Clerk Authentication
1. Create a Clerk application
2. Configure social providers (Google, Apple)
3. Set up JWT templates
4. Configure redirect URLs

### Google Maps API
1. Enable Google Maps JavaScript API
2. Enable Google Places API
3. Create API key with restrictions
4. Configure billing

### Creem Payments
1. Create Creem account at [creem.io](https://creem.io)
2. Get API key (test/live) from dashboard
3. Set up webhook endpoints (use NGROK for local development)
4. Configure products and pricing in Creem dashboard
5. Test API connection with provided test key


## 5. Database Setup

### Initialize Supabase Database
1. **Run the complete schema in Supabase SQL Editor:**
   - Copy the contents of `backend/database/complete_schema.sql`
   - Paste and run in your Supabase project's SQL Editor
   - This creates all tables, indexes, and RLS policies

2. **Setup sample data:**
```bash
cd backend
npm run db:setup
```

## 6. Development Setup

### Start Backend
```bash
cd backend
npm run dev
```

### Start Web Dashboard
```bash
cd web
npm run dev
```

### Expose for Webhooks (Optional)
```bash
# Install NGROK globally
npm install -g ngrok

# Expose your local backend for webhooks
ngrok http 3001

# Use the NGROK URL in your Creem webhook settings
```

### Start Mobile App
```bash
cd frontend
npm start
```

## 6. Testing the Setup

### Backend Health Check
```bash
curl http://localhost:3001/health
```

### Test Authentication
1. Visit web dashboard
2. Sign up with Clerk
3. Verify JWT tokens

### Test Mobile App
1. Install Expo Go app
2. Scan QR code from `npm start`
3. Test authentication flow

## 7. Production Deployment

### Backend (Railway/Heroku)
```bash
# Set environment variables
# Deploy with your preferred platform
```

### Web Dashboard (Vercel/Netlify)
```bash
cd web
npm run build
# Deploy to Vercel/Netlify
```

### Mobile App (Expo/EAS)
```bash
cd frontend
expo build:android
expo build:ios
```

## 8. Monitoring and Analytics


### Creem Dashboard
- Monitor payment success rates
- Set up alerts for failed payments
- Configure subscription management
- Track product performance

### Supabase Dashboard
- Monitor database performance
- Set up real-time subscriptions
- Configure backup schedules

## 9. Security Checklist

- [ ] Enable HTTPS for all services
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable RLS on all tables
- [ ] Secure API keys
- [ ] Set up monitoring alerts

## 10. Troubleshooting

### Common Issues

**Authentication not working:**
- Check Clerk configuration
- Verify JWT secret keys
- Check redirect URLs

**Maps not loading:**
- Verify Google Maps API key
- Check API restrictions
- Enable required APIs

**Payments failing:**
- Check Stripe webhook configuration
- Verify API keys
- Test with Stripe test cards

**Database connection issues:**
- Check Supabase credentials
- Verify RLS policies
- Check connection limits

## Support

For issues and questions:
- Check the logs in each service
- Verify environment variables
- Test each integration individually
- Contact support for service-specific issues
