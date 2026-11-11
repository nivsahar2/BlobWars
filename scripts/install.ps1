# Installs the packaged game for the current user and puts shortcuts on the Desktop and in the Start Menu.
#
# The ~250 MB app folder goes to %LOCALAPPDATA%\Programs\BlobWars (where per-user apps normally live)
# rather than onto the Desktop itself: the Desktop here is OneDrive-synced, and syncing the Electron
# runtime would waste upload and quota. The Desktop gets a normal shortcut with the game's icon.
#
# Hebrew text is built from code points because Windows PowerShell 5.1 reads BOM-less scripts as ANSI.

$ErrorActionPreference = 'Stop'

$root    = Split-Path -Parent $PSScriptRoot
$src     = Join-Path $root 'dist\BlobWars-win32-x64'
$dest    = Join-Path $env:LOCALAPPDATA 'Programs\BlobWars'
$exe     = Join-Path $dest 'BlobWars.exe'
$appName = -join ([char[]](0x05DE,0x05DC,0x05D7,0x05DE,0x05EA,0x20,0x05D4,0x05D1,0x05DC,0x05D5,0x05D1,0x05D9,0x05DD))  # מלחמת הבלובים

if (-not (Test-Path (Join-Path $src 'BlobWars.exe'))) { throw "Packaged app not found at $src - run 'npm run package' first." }
if (Get-Process -Name BlobWars -ErrorAction SilentlyContinue) { throw 'The game is running - close it and run the install again.' }

# Mirror the build into place (removes files from older builds that no longer exist).
New-Item -ItemType Directory -Force $dest | Out-Null
robocopy $src $dest /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

# WScript.Shell saves through the ANSI codepage, so a Hebrew path (the Desktop folder itself is
# "שולחן העבודה" here) fails with FileNotFound. Save under an ASCII temp name, then move it into
# place with PowerShell, which is Unicode-clean. The description stays ASCII for the same reason.
function New-Shortcut([string]$lnkPath) {
  $tmp = Join-Path $env:TEMP ("BlobWars-" + [guid]::NewGuid().ToString('N') + '.lnk')
  $shell = New-Object -ComObject WScript.Shell
  $s = $shell.CreateShortcut($tmp)
  $s.TargetPath       = $exe
  $s.WorkingDirectory = $dest
  $s.IconLocation     = "$exe,0"
  $s.Description      = 'Blob Wars - turn-based artillery game'
  $s.Save()
  Move-Item -LiteralPath $tmp -Destination $lnkPath -Force
}

$desktop   = [Environment]::GetFolderPath('Desktop')        # follows OneDrive folder redirection
$startMenu = [Environment]::GetFolderPath('Programs')
New-Shortcut (Join-Path $desktop   "$appName.lnk")
New-Shortcut (Join-Path $startMenu "$appName.lnk")

Write-Output "Installed: $exe"
Write-Output "Desktop shortcut: $(Join-Path $desktop "$appName.lnk")"
Write-Output "Start Menu shortcut: $(Join-Path $startMenu "$appName.lnk")"
