$ErrorActionPreference = 'Stop'

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
