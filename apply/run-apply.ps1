#!/usr/bin/env pwsh
param(
    [switch]$DryRun
)

function Fail($msg){
    Write-Error $msg
    exit 1
}

function Have-Cmd($name){
    $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$AdminSql = Join-Path $RootDir '00_admin_only.sql'
$AppSql = Join-Path $RootDir '01_app_safe.sql'
$ChecksSql = Join-Path $ScriptDir 'checks_after.sql'
$ChecksOut = Join-Path $ScriptDir 'checks_after.out'
$ReportFile = Join-Path $ScriptDir 'report_apply.md'

if (!(Have-Cmd 'psql')){ Fail 'psql command not found' }
if (!(Test-Path $AdminSql)){ Fail "missing $AdminSql" }
if (!(Test-Path $AppSql)){ Fail "missing $AppSql" }

$SafeForbidden = @(
  'create\s+extension',
  'create\s+role|alter\s+role|grant\s+.*\bto\b\s+role',
  '\bauth\.|\bstorage\.|\brealtime\.',
  'net\.http_',
  'create\s+or\s+replace\s+function\s+auth\.uid',
  'alter\s+system'
)

$AdminRequire = @(
  'create\s+extension',
  'create\s+role',
  '\bauth\.',
  'net\.http_',
  'security\s+definer'
)

function Scan-Forbidden($file, $patterns){
    foreach($pat in $patterns){
        $m = Select-String -Path $file -Pattern $pat -CaseSensitive:$false -SimpleMatch:$false
        if($m){ return @($false, "${($m[0].LineNumber)}:${($m[0].Line.Trim())}") }
    }
    return @($true, '')
}

function Scan-Require($file, $patterns){
    foreach($pat in $patterns){
        $m = Select-String -Path $file -Pattern $pat -CaseSensitive:$false -SimpleMatch:$false
        if($m){ return @($true, "pattern '$pat' found") }
    }
    return @($false, 'no required patterns matched')
}

$admScan = Scan-Require $AdminSql $AdminRequire
$ADMIN_SCAN_RES = if($admScan[0]){'OK'} else {'KO'}
$ADMIN_SCAN_MSG = $admScan[1]

$appScan = Scan-Forbidden $AppSql $SafeForbidden
$APP_SCAN_RES = if($appScan[0]){'OK'} else {'KO'}
$APP_SCAN_MSG = $appScan[1]

$FINAL_EXIT = 0
$APPLY_00 = 'SKIPPED'
$APPLY_01 = 'SKIPPED'
$CHECKS_RESULT = 'SKIPPED'
$APPLY_00_LOG = ''
$APPLY_01_LOG = ''
$CHECKS_LOG = ''

if($ADMIN_SCAN_RES -eq 'OK' -and $APP_SCAN_RES -eq 'OK'){
    $AdminDsn = $env:SUPABASE_DB_URL_ADMIN
    if(!$AdminDsn){ $AdminDsn = $env:PSQL_ADMIN_DSN }
    if(!$AdminDsn){ Fail 'no admin DSN provided' }
    $AppDsn = $env:SUPABASE_DB_URL_APP
    if(!$AppDsn){ $AppDsn = $env:PSQL_APP_DSN }
    if(!$AppDsn){ $AppDsn = $AdminDsn }
    if(-not $DryRun){
        $APPLY_00_LOG = & psql $AdminDsn -v ON_ERROR_STOP=1 -f $AdminSql 2>&1
        if($LASTEXITCODE -eq 0){ $APPLY_00 = 'OK' } else { $APPLY_00 = 'KO'; $FINAL_EXIT = 1 }
        $APPLY_01_LOG = & psql $AppDsn -v ON_ERROR_STOP=1 -f $AppSql 2>&1
        if($LASTEXITCODE -eq 0){ $APPLY_01 = 'OK' } else { $APPLY_01 = 'KO'; $FINAL_EXIT = 1 }
        $CHECKS_LOG = & psql $AppDsn -f $ChecksSql -o $ChecksOut 2>&1
        if($LASTEXITCODE -eq 0){
            $lines = (Get-Content $ChecksOut | Measure-Object -Line).Lines
            $CHECKS_RESULT = "OK ($lines lines)"
        } else {
            $CHECKS_RESULT = 'KO'; $FINAL_EXIT = 1
        }
    } else {
        $APPLY_00 = 'DRY-RUN'
        $APPLY_01 = 'DRY-RUN'
        $CHECKS_RESULT = 'DRY-RUN'
    }
} else {
    $FINAL_EXIT = 1
}

function Mask-Dsn($dsn){ if(!$dsn){ return 'n/a' } else { return ($dsn.Split(':')[0] + '://***') } }

$report = @()
$report += '# Rapport d''application'
$report += "Date: $(Get-Date -Format u)"
$report += ''
$report += '## DSN'
$report += "- Admin: $(Mask-Dsn $AdminDsn)"
$report += "- App: $(Mask-Dsn $AppDsn)"
$report += ''
$report += '## Résultats des scans'
$report += "- 00_admin_only.sql: $ADMIN_SCAN_RES"
if($ADMIN_SCAN_MSG){ $report += "  $ADMIN_SCAN_MSG" }
$report += "- 01_app_safe.sql: $APP_SCAN_RES"
if($APP_SCAN_MSG){ $report += "  $APP_SCAN_MSG" }
$report += ''
$report += '## Application'
$report += "- 00_admin_only.sql: $APPLY_00"
if($APPLY_00 -ne 'OK' -and $APPLY_00_LOG){ $report += '```'; $report += $APPLY_00_LOG; $report += '```' }
$report += "- 01_app_safe.sql: $APPLY_01"
if($APPLY_01 -ne 'OK' -and $APPLY_01_LOG){ $report += '```'; $report += $APPLY_01_LOG; $report += '```' }
$report += ''
$report += '## Checks'
$report += "- checks_after.sql: $CHECKS_RESULT"
if($CHECKS_RESULT -ne 'OK' -and $CHECKS_LOG){ $report += '```'; $report += $CHECKS_LOG; $report += '```' }
$report | Set-Content $ReportFile

exit $FINAL_EXIT
