<#
  Netlify deploy script (PowerShell)
  - Builds frontend dist and deploys to Netlify using netlify-cli
  - Accepts SITE_ID and AUTH_TOKEN from env vars or prompts user
#>
Param()

Write-Host "Starting Netlify deployment..." -ForegroundColor Green

if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
  Write-Host "Netlify CLI not found. Installing..." -ForegroundColor Yellow
  npm i -g netlify-cli --silent
}

Write-Host "Installing dependencies for frontend..." -ForegroundColor Cyan
cd frontend
npm ci --silent

Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build

${env:SITE_ID} = $env:NETLIFY_SITE_ID
if (-not $SITE_ID) { $SITE_ID = Read-Host 'Enter Netlify SITE_ID' }

${env:AUTH_TOKEN} = $env:NETLIFY_AUTH_TOKEN
if (-not $AUTH_TOKEN) { $AUTH_TOKEN = Read-Host 'Enter Netlify AUTH TOKEN' }

if (-not $SITE_ID -or -not $AUTH_TOKEN) {
  Write-Error 'SITE_ID and AUTH_TOKEN are required.'
  exit 1
}

Write-Host "Deploying to Netlify (site: $SITE_ID) ..." -ForegroundColor Green
netlify deploy --prod --dir=dist --site "$SITE_ID" --auth "$AUTH_TOKEN" --message "Automated deploy: frontend AI editor improvements"

Write-Host "Deployment completed." -ForegroundColor Green
