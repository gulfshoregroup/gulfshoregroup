# 🚀 Gulfshore Group — Deployer Instructions

## Files to Receive
- 📁 `gulfshore/` — Next.js app code
- 🗃️ `gulfshore_backup.sql` — MySQL database (320 MB, ~10,200 properties)

---

## Step 1: Database Setup (MySQL)

Create a MySQL database and import the backup:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE gulfshoregroup;"

# Import backup (320 MB — will take 2-5 mins)
mysql -u root -p gulfshoregroup < gulfshore_backup.sql
```

**On Railway:**
1. Add MySQL service in Railway project
2. Go to MySQL service → Connect → Copy connection string
3. Use TablePlus/DBeaver to import the SQL file

---

## Step 2: Environment Variables

Set these in Railway Variables section:

```env
# REQUIRED — Railway MySQL URL (copy from Railway MySQL service)
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/gulfshoregroup"

# REQUIRED — Your actual domain/Railway URL
NEXT_PUBLIC_SERVER_URL="https://your-app.up.railway.app"

NEXT_PUBLIC_ENV="PROD"

# Bridge API (MLS data)
BRIDGE_API_KEY="cac17d1ac3cbf00980257de8c5902ea7"
BRIDGE_SOURCE="nabor"

# Twilio SMS
TWILIO_SID="your_twilio_sid"
TWILIO_TOKEN="your_twilio_token"
TWILIO_NUMBER="your_twilio_phone_number"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dm68hqwp9"
NEXT_PUBLIC_CLOUDINARY_API_KEY="253583164852589"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

---

## Step 3: Build Commands

```bash
npm install
npx prisma generate
npm run build
npm start
```

---

## Step 4: Admin Login

```
URL: https://your-domain.com/admin/sign-in
Email: admin@gulfshore.com
Password: admin
```

⚠️ Change password after first login from /admin/settings

---

## Important Notes

- No Clerk auth — custom cookie-based admin auth
- Images already in DB — no extra sync needed
- 10,200 properties ready in database
- NEXT_PUBLIC_SERVER_URL must match actual domain
- Do NOT set NEXT_PUBLIC_USE_REAL_CLERK=true
