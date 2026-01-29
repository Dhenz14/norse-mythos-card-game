# Installation and Download Guide

This document will guide you through setting up and running this project in Visual Studio Code after downloading it from Replit.

## Step 1: Download the Project

1. In Replit, download the project by clicking on the project name in the top-left corner
2. Select "Download as zip"
3. Extract the ZIP file to a location on your computer

## Step 2: Environment Configuration

The project uses both a PostgreSQL database hosted on Neon and Cloudinary for image processing. To configure these services:

1. Copy the `.env.example` file to a new file named `.env`:
   ```
   cp .env.example .env
   ```

2. The `.env` file should contain the database connection string and Cloudinary credentials:
   ```
   # Database Configuration
   DATABASE_URL=postgresql://neondb_owner:npg_KFsR3vIoJ2Cr@ep-lucky-frost-a6uydz89.us-west-2.aws.neon.tech/neondb?sslmode=require

   # Cloudinary Configuration 
   CLOUDINARY_CLOUD_NAME=dtdz6aq5f
   CLOUDINARY_API_KEY=352382695286766
   CLOUDINARY_API_SECRET=FktzNE_G8yt0Nb9gpkmoEHu_l8M
   ```

3. These settings will allow you to connect to the same database and Cloudinary account as used in the Replit environment.

## Step 3: Install Dependencies

1. Make sure you have Node.js installed on your computer (version 16 or higher recommended)
2. Open a terminal in the project directory
3. Run the following command to install all dependencies:
   ```
   npm install
   ```

## Step 4: Configure Vite for Local Development

The project uses a Replit-specific Vite plugin that won't work in VSCode. There are three ways to handle this:

### Option 1: Use Environment Variable (Simplest)

Before starting the development server, set the `VITE_SKIP_REPLIT_PLUGIN` environment variable:

```bash
# Windows Command Prompt
set VITE_SKIP_REPLIT_PLUGIN=true
npm run dev

# Windows PowerShell
$env:VITE_SKIP_REPLIT_PLUGIN="true"
npm run dev

# Mac/Linux
VITE_SKIP_REPLIT_PLUGIN=true npm run dev
```

### Option 2: Update Package.json

Add a new script to your package.json:

```json
"scripts": {
  "dev": "tsx server/index.ts",
  "dev:local": "VITE_SKIP_REPLIT_PLUGIN=true tsx server/index.ts",
  // other scripts...
}
```

### Option 3: Run the Patch Script

A patch script is included to automatically modify the vite.config.ts file:

```bash
# Run the patch script
node patch_vite_config.js
```

This will comment out the Replit-specific plugin in the configuration file without affecting other settings.

## Step 5: Run the Development Server

1. After installing dependencies, start the development server with:
   ```
   npm run dev
   ```
   Or if you've added the local script:
   ```
   npm run dev:local
   ```

2. The server should start and the application will be available at `http://localhost:5000` by default (the port is configured to 5000 in server/index.ts).

## Step 6: Database Migrations (If Needed)

If you need to update the database schema:

1. Make changes to the schema in `shared/schema.ts`
2. Run the migration command:
   ```
   npm run db:push
   ```

## Troubleshooting

If you encounter any issues:

1. Make sure your Node.js version is compatible (v16+)
2. Check that the `.env` file is properly configured
3. If database connections fail, ensure the Neon database is active and accessible
4. For Vite-related errors, try the alternative methods in Step 4

### Common Issues and Solutions

#### Error: Cannot find module '@replit/vite-plugin-runtime-error-modal'

This means the Replit-specific plugin is causing issues. Use one of the methods in Step 4 to disable it.

#### Connection refused to PostgreSQL database

The Neon database might be in sleep mode or have connection restrictions. Try:
- Waiting a moment for the database to wake up
- Checking if your IP is allowed to connect (Neon might have IP restrictions)

#### Missing Cloudinary Images

If card images are not loading, verify your Cloudinary credentials in the `.env` file.

For more detailed information, refer to the project documentation in the README.md and VSC_SETUP.md files.