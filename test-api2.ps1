$headers = @{ 'Content-Type' = 'application/json' }
$body = '{"context":"林墨坐在窗前","maxTokens":50}'

# Show request
Write-Host "Sending request to http://localhost:3000/api/ai/stream-write"
Write-Host "Body: $body"
Write-Host ""

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/ai/stream-write' -Method POST -Headers $headers -Body $body -TimeoutSec 60
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Content:"
    Write-Host $r.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
