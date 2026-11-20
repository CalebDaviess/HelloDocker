$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.secrets\catalog.htpasswd') -PathType Leaf)) {
    throw 'Catalog authentication is not configured. Run .\set-catalog-auth.ps1 first.'
}

Push-Location $PSScriptRoot
try {
    $env:APP_PORT = '8081'
    $env:PUBLIC_PORT = '8082'

    docker compose -p devops -f compose.jenkins.yaml up --build -d
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    docker compose -f compose.yaml --profile public up --build -d
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
