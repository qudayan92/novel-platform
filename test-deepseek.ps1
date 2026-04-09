$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer sk-29d4e3aba3f84637b990b4f4f5b62616'
}
$body = @{
    model = 'deepseek-chat'
    messages = @(
        @{ role = 'system'; content = '你是一个有帮助的助手' }
        @{ role = 'user'; content = '你好' }
    )
    max_tokens = 50
} | ConvertTo-Json

Write-Host "Testing DeepSeek API..."
Write-Host ""

try {
    $r = Invoke-WebRequest -Uri 'https://api.deepseek.com/chat/completions' -Method POST -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Response: $($r.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response Body: $responseBody"
    }
}
