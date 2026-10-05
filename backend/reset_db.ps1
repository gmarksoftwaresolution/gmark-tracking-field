Add-Type -Path "c:\Navbharat\gmark-tracking-field\backend\bin\Debug\net8.0\Npgsql.dll"

$connString = "Host=localhost;Port=5432;Database=NavbharatAgroDB;Username=postgres;Password=postgres;Ssl Mode=Disable;"
$conn = New-Object Npgsql.NpgsqlConnection($connString)
try {
    $conn.Open()
    Write-Host "Connected to database successfully."
    $cmd = New-Object Npgsql.NpgsqlCommand('UPDATE "Employees" SET "TodayTravelledDistance" = 0;', $conn)
    $rowsAffected = $cmd.ExecuteNonQuery()
    Write-Host "Updated TodayTravelledDistance to 0 for $rowsAffected employees."
} catch {
    Write-Error "Error: $_"
} finally {
    if ($conn.State -eq 'Open') {
        $conn.Close()
    }
}
