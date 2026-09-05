function Add-Leg {
    param([double], [double], [double], [double], [int])
     = @()
    for ( = 0;  -le ; ++) {
         =  + ( - ) *  / 
         =  + ( - ) *  / 
         += @{ lat = ; lon =  }
    }
    return 
}

$points = @()
$points += Add-Leg -lat1 16.0645 -lon1 74.3312 -lat2 16.2227 -lon2 74.3519 -steps 5
$points += Add-Leg -lat1 16.2227 -lon1 74.3519 -lat2 16.1577 -lon2 74.1881 -steps 5
$points += Add-Leg -lat1 16.1577 -lon1 74.1881 -lat2 16.0645 -lon2 74.3312 -steps 5

Write-Host "Clearing old history..."
Invoke-WebRequest -Method Delete -Uri "http://localhost:5160/api/tracking/clear-test-data/2" -UseBasicParsing

$baseTime = (Get-Date).AddHours(-4)
foreach ($p in $points) {
    $body = @{
        employeeId = 2
        latitude = $p.lat
        longitude = $p.lon
        timestamp = $baseTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json
    
    Invoke-WebRequest -Method Post -Uri "http://localhost:5160/api/tracking/location" -ContentType "application/json" -Body $body -UseBasicParsing | Out-Null
    $baseTime = $baseTime.AddMinutes(5)
    Start-Sleep -Milliseconds 100
}
Write-Host "Created GPS points: $($points.Length)"
