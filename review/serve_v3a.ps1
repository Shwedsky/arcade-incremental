$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root 'dist'
$log = Join-Path $root 'launcher-v3a.log'

function Log([string]$message) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $message
  Add-Content -Path $log -Value $line
  Write-Host $message
}

try {
  Set-Content -Path $log -Value ("V3-A launcher started at {0}" -f (Get-Date -Format 's'))
  if (-not (Test-Path $dist -PathType Container)) {
    throw "dist folder not found next to launcher. Re-extract the complete owner-review ZIP."
  }
  if (-not (Test-Path (Join-Path $dist 'index.html') -PathType Leaf)) {
    throw "dist/index.html is missing. The archive is incomplete."
  }

  $listener = $null
  $port = $null
  foreach ($candidate in 4173..4190) {
    try {
      $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
      $probe.Start()
      $probe.Stop()
      $port = $candidate
      break
    } catch {}
  }
  if ($null -eq $port) { throw 'No free TCP port found in range 4173-4190.' }

  $prefix = "http://127.0.0.1:$port/"
  $listener = [System.Net.HttpListener]::new()
  $listener.Prefixes.Add($prefix)
  $listener.Start()
  Log "Server: $prefix"
  Log "Root: $dist"
  Start-Process $prefix
  Log 'Browser opened. Keep this window open while testing; Ctrl+C stops the server.'

  $mime = @{
    '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
    '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg';
    '.webp'='image/webp'; '.ico'='image/x-icon'; '.txt'='text/plain; charset=utf-8'; '.map'='application/json; charset=utf-8'; '.woff2'='font/woff2'
  }

  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $rawPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($rawPath)) { $rawPath = 'index.html' }
      $candidatePath = [IO.Path]::GetFullPath((Join-Path $dist ($rawPath -replace '/', [IO.Path]::DirectorySeparatorChar)))
      $distFull = [IO.Path]::GetFullPath($dist) + [IO.Path]::DirectorySeparatorChar
      if (-not $candidatePath.StartsWith($distFull, [StringComparison]::OrdinalIgnoreCase) -and $candidatePath -ne [IO.Path]::GetFullPath((Join-Path $dist 'index.html'))) {
        $context.Response.StatusCode = 403
        $context.Response.Close()
        continue
      }
      if (-not (Test-Path $candidatePath -PathType Leaf)) {
        $candidatePath = Join-Path $dist 'index.html'
      }
      $bytes = [IO.File]::ReadAllBytes($candidatePath)
      $ext = [IO.Path]::GetExtension($candidatePath).ToLowerInvariant()
      $context.Response.StatusCode = 200
      $context.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.OutputStream.Close()
    } catch {
      try { $context.Response.StatusCode = 500; $context.Response.Close() } catch {}
      Log ("Request error: " + $_.Exception.Message)
    }
  }
} catch {
  Log ("FATAL: " + $_.Exception.Message)
  Write-Host ''
  Write-Host 'Launcher failed. Read launcher-v3a.log for details.'
  exit 1
} finally {
  if ($listener) { try { $listener.Stop(); $listener.Close() } catch {} }
}
