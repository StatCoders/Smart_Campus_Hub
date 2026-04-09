# Test API Script for Smart Campus

$baseUrl = "http://localhost:8080"

# 1. Signup
Write-Host "=== STEP 1: Creating Test User ===" -ForegroundColor Green
$signupBody = @{
    email = "test@example.com"
    firstName = "Test"
    lastName = "Admin"
    phoneNumber = "9876543210"
    password = "Test@1234"
    confirmPassword = "Test@1234"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/signup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $signupBody `
        -UseBasicParsing
    
    Write-Host "✓ Signup successful!" -ForegroundColor Green
    $signupData = $signupResponse.Content | ConvertFrom-Json
    Write-Host "Response: $($signupResponse.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Login
Write-Host "`n=== STEP 2: Logging In ===" -ForegroundColor Green
$loginBody = @{
    email = "test@example.com"
    password = "Test@1234"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "Token: $token`n" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Test GET Resources endpoint
Write-Host "=== STEP 3: Getting All Resources ===" -ForegroundColor Green
try {
    $resourcesResponse = Invoke-WebRequest -Uri "$baseUrl/api/resources" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing
    
    Write-Host "✓ GET Resources successful!" -ForegroundColor Green
    Write-Host "Response: $($resourcesResponse.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ GET Resources failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Create a Resource (POST)
Write-Host "`n=== STEP 4: Creating New Resource ===" -ForegroundColor Green
$createBody = @{
    name = "Lab A101"
    type = "LAB"
    capacity = 30
    building = "Science Building"
    floor = "1st Floor"
    status = "ACTIVE"
    features = @("Microscopes", "Computers", "Projector")
    imageUrl = "https://example.com/lab.jpg"
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/resources" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $createBody `
        -UseBasicParsing
    
    Write-Host "✓ Resource created!" -ForegroundColor Green
    Write-Host "Response: $($createResponse.Content)" -ForegroundColor Cyan
    $resourceData = $createResponse.Content | ConvertFrom-Json
    $resourceId = $resourceData.id
} catch {
    Write-Host "✗ Failed to create resource: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Green
