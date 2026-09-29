# StructShield Infrastructure Verification Script (PowerShell)
Write-Host "=== Verifying StructShield Infrastructure Containers ===" -ForegroundColor Cyan

$services = @("postgres", "redis", "kafka")
$allHealthy = $true

foreach ($svc in $services) {
    $containerName = "structshield-$svc"
    $status = docker inspect --format '{{.State.Health.Status}}' $containerName 2>$null
    if ($status -eq "healthy") {
        Write-Host "[OK] $containerName is HEALTHY" -ForegroundColor Green
    } else {
        Write-Host "[WARN] $containerName status is '$status'" -ForegroundColor Yellow
        $allHealthy = $false
    }
}

if ($allHealthy) {
    Write-Host "All infrastructure dependencies are healthy and ready." -ForegroundColor Green
} else {
    Write-Host "Some containers are still initializing or unhealthy. Run 'docker compose ps' to inspect." -ForegroundColor Red
}
