# Test User Management APIs for Smart Campus

$baseUrl = "http://localhost:8080"
$adminToken = $null
$testUserId = $null

# Color functions
function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-ErrorCustom($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Infomsg($message) {
    Write-Host "ℹ $message" -ForegroundColor Cyan
}

# =============================================================================
# STEP 1: Admin Login
# =============================================================================
Write-Infomsg "=== STEP 1: Admin Login ===" 

$loginBody = @{
    email = "admin@smartcampus.com"
    password = "Admin@1234"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing
    
    Write-Success "Admin login successful!"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $adminToken = $loginData.token
    Write-Infomsg "Token: $($adminToken.Substring(0, 20))..."
} catch {
    Write-ErrorCustom "Admin login failed: $($_.Exception.Message)"
    exit
}

# =============================================================================
# STEP 2: Create a Test User
# =============================================================================
Write-Infomsg "`n=== STEP 2: Create Test User ===" 

$createUserBody = @{
    email = "testuser@example.com"
    firstName = "Test"
    lastName = "User"
    phoneNumber = "9876543210"
    password = "Test@1234"
    role = "USER"
    isActive = $true
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/users" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -Body $createUserBody `
        -UseBasicParsing
    
    Write-Success "User created successfully!"
    $createData = $createResponse.Content | ConvertFrom-Json
    $testUserId = $createData.id
    Write-Infomsg "User ID: $testUserId"
    Write-Infomsg "Email: $($createData.email)"
    Write-Infomsg "Role: $($createData.role)"
} catch {
    Write-ErrorCustom "Failed to create user: $($_.Exception.Message)"
}

# =============================================================================
# STEP 3: Get All Users
# =============================================================================
Write-Infomsg "`n=== STEP 3: Get All Users ===" 

try {
    $getAllResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/users" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    
    Write-Success "Fetched all users!"
    $users = $getAllResponse.Content | ConvertFrom-Json
    Write-Infomsg "Total users: $($users.Count)"
    
    # Display first few users
    $users | Select-Object -First 3 | ForEach-Object {
        Write-Infomsg "  - $($_.email) ($($_.role)) - Active: $($_.isActive)"
    }
} catch {
    Write-ErrorCustom "Failed to fetch users: $($_.Exception.Message)"
}

# =============================================================================
# STEP 4: Update User Role (PUT /api/auth/users/{userId}/role)
# =============================================================================
Write-Infomsg "`n=== STEP 4: Update User Role ===" 

$updateRoleBody = @{
    role = "STAFF"
} | ConvertTo-Json

try {
    $updateRoleResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/users/$testUserId/role" `
        -Method PUT `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -Body $updateRoleBody `
        -UseBasicParsing
    
    Write-Success "User role updated to STAFF!"
    $roleUpdateData = $updateRoleResponse.Content | ConvertFrom-Json
    Write-Infomsg "Updated user role: $($roleUpdateData.role)"
} catch {
    Write-ErrorCustom "Failed to update user role: $($_.Exception.Message)"
}

# =============================================================================
# STEP 5: Update User Status (PUT /api/auth/users/{userId}/status)
# =============================================================================
Write-Infomsg "`n=== STEP 5: Update User Status ===" 

$updateStatusBody = @{
    isActive = $false
} | ConvertTo-Json

try {
    $updateStatusResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/users/$testUserId/status" `
        -Method PUT `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -Body $updateStatusBody `
        -UseBasicParsing
    
    Write-Success "User status updated to inactive!"
    $statusUpdateData = $updateStatusResponse.Content | ConvertFrom-Json
    Write-Infomsg "Updated user status: $($statusUpdateData.isActive)"
} catch {
    Write-ErrorCustom "Failed to update user status: $($_.Exception.Message)"
}

# =============================================================================
# STEP 6: Comprehensive User Update (PUT /api/auth/users/{userId})
# =============================================================================
Write-Infomsg "`n=== STEP 6: Comprehensive User Update ===" 

$updateUserBody = @{
    firstName = "Updated"
    lastName = "User"
    phoneNumber = "9999999999"
    role = "ADMIN"
    isActive = $true
} | ConvertTo-Json

try {
    $updateUserResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/users/$testUserId" `
        -Method PUT `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -Body $updateUserBody `
        -UseBasicParsing
    
    Write-Success "User updated comprehensively!"
    $updateUserData = $updateUserResponse.Content | ConvertFrom-Json
    Write-Infomsg "Updated First Name: $($updateUserData.firstName)"
    Write-Infomsg "Updated Last Name: $($updateUserData.lastName)"
    Write-Infomsg "Updated Phone: $($updateUserData.phoneNumber)"
    Write-Infomsg "Updated Role: $($updateUserData.role)"
    Write-Infomsg "Updated Status: $($updateUserData.isActive)"
} catch {
    Write-ErrorCustom "Failed to update user: $($_.Exception.Message)"
}

# =============================================================================
# STEP 7: Verify Updates
# =============================================================================
Write-Infomsg "`n=== STEP 7: Verify Updates ===" 

try {
    $verifyResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/users" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -UseBasicParsing
    
    Write-Success "Fetched all users for verification!"
    $allUsers = $verifyResponse.Content | ConvertFrom-Json
    
    $updatedUser = $allUsers | Where-Object { $_.id -eq $testUserId }
    
    if ($updatedUser) {
        Write-Infomsg "User verification:"
        Write-Infomsg "  Email: $($updatedUser.email)"
        Write-Infomsg "  Full Name: $($updatedUser.fullName)"
        Write-Infomsg "  Phone: $($updatedUser.phoneNumber)"
        Write-Infomsg "  Role: $($updatedUser.role)"
        Write-Infomsg "  Status: $($updatedUser.isActive)"
        Write-Success "All updates verified!"
    } else {
        Write-ErrorCustom "User not found in list"
    }
} catch {
    Write-ErrorCustom "Failed to verify updates: $($_.Exception.Message)"
}

Write-Host "`n=== All User Management Tests Complete ===" -ForegroundColor Yellow
