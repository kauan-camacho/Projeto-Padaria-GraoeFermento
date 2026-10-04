# ============================================================================
#  Servidor estatico minimo para PowerShell (sem instalar Python ou Node).
#
#    powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
#
#  Opcionalmente escolha a porta:
#    powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1 -Port 9000
#
#  Depois abra http://localhost:8000 no navegador. Ctrl+C encerra.
# ============================================================================

param(
    [int]$Port = 8000,
    [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'

$mimes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.avif' = 'image/avif'
    '.gif'  = 'image/gif'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.txt'  = 'text/plain; charset=utf-8'
    '.md'   = 'text/markdown; charset=utf-8'
    '.xml'  = 'application/xml; charset=utf-8'
    '.webmanifest' = 'application/manifest+json'
}

if (-not (Test-Path $Root)) {
    Write-Host "Pasta nao encontrada: $Root" -ForegroundColor Red
    exit 1
}
$Root = (Resolve-Path $Root).Path

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Nao foi possivel abrir a porta $Port. Escolha outra: -Port 9000" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor DarkGray
    exit 1
}

Write-Host ""
Write-Host "  Grão & Fermento - servidor local" -ForegroundColor Green
Write-Host "  http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  raiz: $Root" -ForegroundColor DarkGray
Write-Host "  Ctrl+C para encerrar" -ForegroundColor DarkGray
Write-Host ""

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }

    $request = $context.Request
    $response = $context.Response

    try {
        # caminho -> caminho do sistema, bloqueando escapar da raiz
        $relative = [Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }

        $full = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))
        if (-not $full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw '403'
        }
        if (Test-Path -LiteralPath $full -PathType Container) {
            $full = Join-Path $full 'index.html'
        }
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
            throw '404'
        }

        $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
        if ($mimes.ContainsKey($ext)) { $type = $mimes[$ext] } else { $type = 'application/octet-stream' }

        $bytes = [System.IO.File]::ReadAllBytes($full)
        $response.StatusCode = 200
        $response.ContentType = $type
        $response.ContentLength64 = $bytes.Length
        $response.Headers.Add('Cache-Control', 'no-cache')
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    catch {
        $code = if ($_.Exception.Message -eq '403') { 403 } else { 404 }
        $body = [System.Text.Encoding]::UTF8.GetBytes("<h1>$code</h1>")
        $response.StatusCode = $code
        $response.ContentType = 'text/html; charset=utf-8'
        $response.ContentLength64 = $body.Length
        try { $response.OutputStream.Write($body, 0, $body.Length) } catch { }
    }
    finally {
        try { $response.OutputStream.Close() } catch { }
    }
}

$listener.Stop()
$listener.Close()
