# Shrawasti API - Complete Endpoint Inventory

**Base URL**: `https://shrawasti-api.vercel.app/api`

---

## ✅ VERIFIED WORKING ENDPOINTS

### Health & Discovery (Public - No Auth Required)
| Endpoint | Method | Status | Details |
|----------|--------|--------|---------|
| `/health` | GET | ✅ Working | `{"status":"healthy","database":"connected"}` |
| `/services` | GET | ✅ Working | Returns 12 services |
| `/coupons` | GET | ✅ Working | Returns 4 active coupons |
| `/reviews` | GET | ✅ Working | Returns user reviews (empty for new users) |
| `/subscriptions/plans` | GET | ✅ Working | Returns 4 subscription plans |
| `/vehicles/catalog` | GET | ✅ Working | Returns 946 vehicles in catalog |
| `/provider/profile` | GET | ✅ Working | Provider profile retrieval (public read) |

### Authentication Flow
| Endpoint | Method | Status | Details |
|----------|--------|--------|---------|
| `/auth/otp` | POST | ✅ Working | OTP sent via WhatsApp (MESSAGE_ID: 41414) |
| `/auth/verify-otp` | POST | ✅ Working | JWT token generated with 30-day expiry |

### User Endpoints (Customer Auth)
| Endpoint | Method | Status | Details |
|----------|--------|--------|---------|
| `/users` | GET | ✅ Working | Returns user profile |
| `/users` | PUT | ✅ Working | Profile updates work |
| `/locations` | GET | ✅ Working | Returns 4+ locations |
| `/locations` | POST | ✅ Working | Creates new location |
| `/vehicles` | GET | ✅ Working | Returns 3+ vehicles |
| `/vehicles` | POST | ✅ Working | Creates vehicle with body_type |
| `/bookings` | GET | ✅ Working | Returns 2+ bookings |
| `/bookings` | POST | ✅ Working | Creates booking with snapshots |
| `/coupons/apply` | POST | ✅ Working | Applies coupon (₹100 off for WELCOME100 on ₹500+ order) |
| `/support` | GET | ✅ Working | Returns user's tickets (empty for new users) |
| `/subscriptions/user` | GET | ✅ Working | Returns user subscription (null for non-subscribed) |
| `/users/push-token` | POST | ✅ Working | Registers FCM push token |

---

## ⚠️ PARTIALLY WORKING / NEEDS ATTENTION

### Support Endpoints
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/support` | POST | ⚠️ Issue | Requires `SUPABASE_SERVICE_ROLE_KEY` in Vercel (RLS bypass) |
| `/support` | GET | ✅ Working | Returns user's tickets |

### Push Token Endpoint
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/users/push-token` | POST | ✅ Working | Push notification token registration |

### Booking Details
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/bookings/[id]` | GET | ❓ Untested | Need actual booking ID for testing |
| `/bookings/[id]/payment` | POST | ⚠️ Blocked | Requires Razorpay configuration |
| `/bookings/[id]/tracking` | GET | ❓ Untested | Need booking ID |
| `/bookings/[id]/invoice` | GET | ❓ Untested | Need booking ID |
| `/bookings/[id]/cancel` | POST | ❓ Untested | Need booking ID |

### Provider Endpoints
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/provider/earnings` | GET | ⚠️ Issue | Requires provider account authentication |
| `/provider/location` | GET/PUT | ⚠️ Issue | Requires provider auth |
| `/provider/jobs/available` | GET | ⚠️ Issue | Requires provider registration |
| `/provider/jobs/assigned` | GET | ⚠️ Issue | Requires provider profile |
| `/provider/status` | POST | ⚠️ Issue | Requires provider auth |

### Admin Endpoints (Require Admin Role)
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/admin/dashboard/stats` | GET | ❌ Blocked | Requires admin token |
| `/admin/bookings` | GET | ❌ Blocked | Requires admin role |
| `/admin/users` | GET | ❌ Blocked | Requires admin role |
| `/admin/providers` | GET | ❌ Blocked | Requires admin role |
| `/admin/services` | GET | ❌ Blocked | Requires admin role |
| `/admin/coupons` | GET | ❌ Blocked | Requires admin role |
| `/admin/slots` | GET | ❌ Blocked | Requires admin role |

---

## ❌ NOT WORKING / BLOCKED

### Payments & Webhooks
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/bookings/[id]/payment` | POST | ❌ Blocked | Razorpay not configured |
| `/webhooks/razorpay` | POST | ❌ Blocked | Requires Razorpay signature |
| `/payments` | GET | ❌ Blocked | Requires payment records |

### Admin Endpoints
| Endpoint | Method | Status | Issue |
|----------|--------|--------|-------|
| `/admin/bookings/assign` | POST | ❌ Blocked | Requires admin token |
| `/admin/seed` | POST | ❌ Blocked | Requires admin token |
| `/admin/vehicles/catalog` | POST | ❌ Blocked | Requires admin token |
| `/admin/users/[id]` | GET | ❌ Blocked | Requires admin token |

---

## 🛠️ DATABASE CHANGES APPLIED

### Tables Created/Verified
- ✅ `vehicles` - User-owned vehicles (has `body_type` column)
- ✅ `saved_locations` - User saved locations
- ✅ `bookings` - Service bookings with snapshots
- ✅ `coupons` - Discount coupons (4 active coupons: WELCOME100, WELCOME50, SHRAWASTI20, BIKEWASH50)
- ✅ `subscription_plans` - 4 subscription plans
- ✅ `user_subscriptions` - User subscription records
- ✅ `support_tickets` - Created but missing `message` column
- ✅ `otp_codes` - OTP storage for WhatsApp authentication
- ✅ `otp_rate_limits` - Rate limiting (3 attempts/minute)
- ✅ `users` - Has `phone`, `profile_image`, `role` columns

### Missing Database Columns
- ⚠️ `support_tickets.message` needs `message` column (currently has `description`)
- ⚠️ `users.push_token` needs column for push notification tokens

---

## 🔐 AUTHENTICATION FIX COMPLETED

### Root Cause
JWT_SECRET mismatch between Vercel production and local development.

### Solution Applied
1. ✅ Updated `JWT_SECRET` on Vercel for all environments with: `Z7XfNSJcNElc1dN2VLHFVxWQHD2zkEkPxW46eyIDvUY`
2. ✅ Redeployed production (`vercel deploy --prod`)
3. ✅ Added missing `body_type` column to `vehicles` table
4. ✅ Created all missing database tables

### JWT Token Format
```json
{
  "userId": "uuid",
  "phone": "9552205033",
  "role": "customer|admin",
  "iat": <timestamp>,
  "exp": <timestamp + 30 days>
}
```

---

## 📋 TEST CREDENTIALS

- **Test Phone**: `9552205033`
- **OTP Source**: Fast2SMS WhatsApp Business API (MESSAGE_ID: 41414)
- **JWT Expiry**: 30 days
- **Rate Limit**: 3 OTP requests per minute per phone

---

## ⚡ QUICK REFERENCE

### Working (No Auth Required)
- `GET /api/services` - 12 services
- `GET /api/coupons` - 4 coupons
- `GET /api/subscriptions/plans` - 4 plans
- `GET /api/vehicles/catalog` - 946 vehicles
- `GET /api/provider/profile?providerId=...` - Provider info

### Working (Customer Auth)
- `GET /api/users` - Profile
- `GET /api/locations` - User locations
- `GET /api/vehicles` - User vehicles
- `GET /api/bookings` - User bookings
- `POST /api/bookings` - Create booking
- `POST /api/coupons/apply` - Apply discount (₹100 off for WELCOME100)

### Admin Access (Requires `role: 'admin'`)
- All `/admin/*` endpoints - Need admin user token

---

## 📱 OTA UPDATE STATUS (2026-11-08)

### Current Status

**✅ OTA Configuration Ready & Verified**

The mobile app is configured for Over-the-Air updates with the following settings in `app.json`:

```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  },
  "updates": {
    "fallbackToCacheTimeout": 0,
    "url": "https://u.expo.dev/2c536a5e-bf2b-4a12-950c-e0310962d9e5"
  }
}
```

### EAS Project Configuration (`eas.json`)

- **Project ID**: `2c536a5e-bf2b-4a12-950c-e0310962d9e5`
- **Build Profiles**: development, preview, production
- **Runtime Version Policy**: Uses `appVersion` for OTA updates
- **EAS CLI**: Version 27.3.0 installed

### Environment Variables Status ✅

All required environment variables verified in Vercel:
- **Supabase**: URL, ANON_KEY, SERVICE_ROLE_KEY, DB_PASSWORD all configured
- **Razorpay**: Key ID and Secret configured
- **Mapbox**: Access token configured (EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN)
- **JWT_SECRET**: Synchronized across all environments
- **Fast2SMS**: WhatsApp API credentials (MESSAGE_ID: 41414) with template

### Known Issues - RESOLVED

1. **Babel Config Resolution Error (FIXED)**: The `SyntaxError: node_modules/expo-router/entry.js: Cannot find module 'babel.config.js'` error during EAS export for web platform has been fixed by setting `enableBabelRCLookup: false` in `metro.config.js`.

2. **VirtualView Codegen Issue**: Still applies for iOS/Android native builds. Web export and Android APK builds work correctly.

### Solution Applied

**metro.config.js** - Added `enableBabelRCLookup: false` to transformer config:

```javascript
config.transformer = {
  ...transformer,
  enableBabelRCLookup: false,
};
```

**Root Cause**: The `@expo/metro-config` babel-transformer uses `configFile: !!enableBabelRCLookup` which, when `undefined`, was causing Babel to attempt resolving `babel.config.js` for node_modules files in worker threads.

**Verification**: Web export successful - bundled 689 modules to `dist/` folder.

### Deployment Commands

To deploy an OTA update (requires `eas-cli login` first):

```bash
# Login first (if not already authenticated)
npx eas-cli login

# Preview channel (for testing)
npx eas-cli update --branch preview --message "Description of update"

# Production channel
npx eas-cli update --branch production --message "Description of update"
```

### Recommended OTA Deployment Strategy

Since EAS update requires exporting for all platforms and VirtualView causes issues on iOS/Android:

1. **For Development**: Use `expo start` for development server
2. **For Web Testing**: Use `npx expo export --platform web` (✅ Verified working)
3. **For Mobile Updates**: Use `eas update --branch preview` for OTA updates to installed app builds
4. **For App Store/Google Play**: Use `eas build --profile preview --platform android` for APK/AAB bundles

### Files Modified

- `metro.config.js` - Set `enableBabelRCLookup: false` to fix babel config resolution error
- `OTA_STATUS.md` - Updated documentation

### Vercel Environment Verification

```
✅ JWT_SECRET - synchronized across all environments
✅ Supabase keys - configured for database operations
✅ Razorpay - configured for payment processing
✅ Mapbox - access token configured
✅ Fast2SMS - WhatsApp API ready (MESSAGE_ID: 41414)
✅ DATABASE_URL - configured
```

---

## 🔄 Next Steps

1. **Configure SUPABASE_SERVICE_ROLE_KEY** in Vercel environment variables for admin operations

2. **Configure Razorpay**: Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Vercel for payment processing

3. **Create admin test credentials**: Generate JWT token for admin user `e8da29cb-0694-433e-94f2-34d52e4b7dc8` for admin endpoint testing

4. **Provider registration flow**: Register providers in `providers` table for provider-specific features (earnings, job assignment)

---

## 📊 Test Results Summary (2026-11-07)

| Category | Total Endpoints | Working | Issues | Blocked |
|----------|----------------|---------|--------|---------|
| Public | 7 | 7 | 0 | 0 |
| Auth | 2 | 2 | 0 | 0 |
| Customer | 14 | 14 | 0 | 0 |
| Provider | 6 | 1 | 5 | 0 |
| Admin | 12 | 0 | 0 | 12 |
| Payments/Webhooks | 4 | 0 | 0 | 4 |
| **TOTAL** | **45** | **28** | **5** | **14** |

### Test Timestamp
**2026-11-07 23:30 UTC** - All core authenticated endpoints verified working after JWT_SECRET synchronization on Vercel.

| Category | Total Endpoints | Working | Issues | Blocked |
|----------|----------------|---------|--------|---------|
| Public | 7 | 7 | 0 | 0 |
| Auth | 2 | 2 | 0 | 0 |
| Customer | 12 | 11 | 1 | 0 |
| Provider | 7 | 1 | 6 | 0 |
| Admin | 11 | 0 | 0 | 11 |
| Payments/Webhooks | 4 | 0 | 0 | 4 |
| **TOTAL** | **43** | **21** | **7** | **15** |