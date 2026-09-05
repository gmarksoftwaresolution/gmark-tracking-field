function Get-Haversine {
    param([double], [double], [double], [double])
     = 6371
     = ( - ) * [Math]::PI / 180
     = ( - ) * [Math]::PI / 180
     = [Math]::Sin(/2)*[Math]::Sin(/2) + [Math]::Cos(*[Math]::PI/180)*[Math]::Cos(*[Math]::PI/180)*[Math]::Sin(/2)*[Math]::Sin(/2)
     = 2 * [Math]::Atan2([Math]::Sqrt(), [Math]::Sqrt(1-))
    return  * 
}

 = Get-Content 'test.json' -Raw | ConvertFrom-Json
Write-Host '| Type | Village | Latitude | Longitude | Timestamp | Distance from previous |'
Write-Host '|---|---|---|---|---|---|'

 = .origin.lat
 = .origin.lng
Write-Host "| Origin | N/A |  |  | N/A | 0.00 |"

foreach ( in .checkpoints) {
     = Get-Haversine -lat1  -lon1  -lat2 .lat -lon2 .lng
     = "{0:N2} km" -f 
    Write-Host "|  |  |  |  |  |  |"
     = .lat
     = .lng
}
