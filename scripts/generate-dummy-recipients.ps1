# scripts/generate-dummy-recipients.ps1
# PowerShell script to generate 500 dummy recipient rows for performance testing

# Load required assemblies for JSON conversion
Add-Type -AssemblyName System.Web.Extensions

# Function to generate a random Stellar/EVM compatible address
function Generate-Address {
    $prefixes = @('G', '0x')
    $prefix = Get-Random -InputObject $prefixes
    if ($prefix -eq '0x') {
        # EVM-style address
        return "0x" + (Get-Random -Count 40 -InputObject [char[]]"0123456789abcdef" -Join '')
    } else {
        # Stellar-style address (starts with G, 56 chars total)
        $randomChars = -join ((Get-Random -Count 55 -InputObject [char[]]"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"))
        return "G" + $randomChars
    }
}

# Function to generate a fake tax ID (optional)
function Generate-TaxId {
    if (Get-Random -Maximum 2) { # 30% chance
        return (Get-Random -Minimum 100000000 -Maximum 999999999).ToString()
    }
    return $null
}

# Constants
$tokens = @('USDC', 'XLM', 'BTC', 'ETH', 'USDT', 'DAI', 'WBTC', 'WETH')
$labels = @(
    'Treasury Wallet',
    'Development Fund',
    'Marketing DAO',
    'Liquidity Pool',
    'Staking Contract',
    'Governance Vault',
    'Yield Farm',
    'Lending Protocol',
    'Exchange Hot Wallet',
    'Cold Storage',
    'Payment Processor',
    'Bridge Contract',
    'Oracle Network',
    'NFT Marketplace',
    'Gaming Platform'
)

# Generate 500 dummy recipients
$dummyRecipients = @()
for ($i = 1; $i -le 500; $i++) {
    $recipient = [PSCustomObject]@{
        id = $i
        address = Generate-Address
        label = "$($labels.GetRandom()) #$i"
        amount = "{0:N2}" -f (Get-Random -Minimum 100 -Maximum 1000000)
        token = $tokens.GetRandom()
        taxId = Generate-TaxId
        transactions = Get-Random -Minimum 0 -Maximum 500
        lastActive = (Get-Date).AddDays(-(Get-Random -Maximum 365)).ToString('o')
    }
    $dummyRecipients += $recipient
}

# Save to JSON file
$jsonPath = Join-Path -Path "C:\github repo\StellarStream\frontend\public" -ChildPath "dummy-recipients.json"
$json = $dummyRecipients | ConvertTo-Json -Depth 4
Set-Content -Path $jsonPath -Value $json -Encoding UTF8
Write-Host "✅ Generated $($dummyRecipients.Count) dummy recipients saved to $jsonPath"

# Save to CSV file
$csvPath = Join-Path -Path "C:\github repo\StellarStream\frontend\public" -ChildPath "dummy-recipients.csv"
$dummyRecipients | Export-Csv -NoTypeInformation -Path $csvPath -Encoding UTF8
Write-Host "✅ Generated $($dummyRecipients.Count) dummy recipients saved to $csvPath"

# Output sample data
Write-Host "`n📊 Sample data:"
$dummyRecipients[0] | ConvertTo-Json -Depth 4