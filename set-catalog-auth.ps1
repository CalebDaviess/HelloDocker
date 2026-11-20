$ErrorActionPreference = 'Stop'

$username = Read-Host 'Choose a shared catalog username'
if ($username -notmatch '^[A-Za-z0-9._-]{1,64}$') {
    throw 'Use 1-64 letters, numbers, dots, underscores, or hyphens for the username.'
}

$secretsDirectory = Join-Path $PSScriptRoot '.secrets'
New-Item -ItemType Directory -Path $secretsDirectory -Force | Out-Null
$secretsPath = (Resolve-Path $secretsDirectory).Path

docker run --rm -it --mount "type=bind,source=$secretsPath,target=/out" httpd:2.4-alpine htpasswd -B -c /out/catalog.htpasswd $username
if ($LASTEXITCODE -ne 0) {
    throw 'Could not create the catalog password file.'
}

$passwordFile = Join-Path $secretsDirectory 'catalog.htpasswd'
if (-not (Test-Path -LiteralPath $passwordFile -PathType Leaf)) {
    throw 'The password file was not created.'
}

Write-Host 'Catalog credentials saved in .secrets/catalog.htpasswd (excluded from Git).'
