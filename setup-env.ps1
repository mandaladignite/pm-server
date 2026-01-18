# PowerShell script to create .env file for MongoDB setup
# Run this script from the server directory

$envContent = @"
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Configuration
# Default local MongoDB connection
MONGODB_URI=mongodb://localhost:27017

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (update these with your actual secrets)
# JWT_SECRET=your-secret-key-change-this-in-production
# JWT_EXPIRE=7d
"@

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host ".env file already exists. Skipping creation." -ForegroundColor Yellow
    Write-Host "Current .env file location: $envPath" -ForegroundColor Cyan
} else {
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host ".env file created successfully at: $envPath" -ForegroundColor Green
    Write-Host "Please review and update the values as needed." -ForegroundColor Cyan
}
