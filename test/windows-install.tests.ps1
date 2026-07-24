#Requires -Modules Pester

# Unit tests for windows-install.ps1.
#
# The script is dot-sourced with FLEDGING_NO_MAIN set so Invoke-Main never runs
# during testing. External calls (network, registry, package managers) are wrapped
# in thin _-prefixed functions so tests can Mock them without touching the system.

BeforeAll {
    $env:FLEDGING_NO_MAIN = '1'
    . "$PSScriptRoot/../windows-install.ps1"
}

AfterAll {
    Remove-Item Env:\FLEDGING_NO_MAIN -ErrorAction SilentlyContinue
}

Describe "script skeleton" {
    It "defines FLEDGING_VERSION" {
        $script:FLEDGING_VERSION | Should -Not -BeNullOrEmpty
    }

    It "does not run Main when sourced with the guard set" {
        # Invoke-Main sets $script:FledgingArch; if it had run, this would be non-empty.
        $script:FledgingArch | Should -BeNullOrEmpty
    }

    It "defines Invoke-Main" {
        (Get-Command Invoke-Main -ErrorAction SilentlyContinue) | Should -Not -BeNullOrEmpty
    }

    It "loads via Invoke-Expression under StrictMode without error (the 'irm | iex' path)" {
        # Dot-sourcing gives $MyInvocation.MyCommand.Path a value; the real iex path
        # does not, and StrictMode turns a missing property into a hard error. This
        # exercises that path so the iex-only bug can't regress. FLEDGING_NO_MAIN is
        # already set by BeforeAll, so Invoke-Main does not run here.
        $content = Get-Content "$PSScriptRoot/../windows-install.ps1" -Raw
        { Invoke-Expression $content } | Should -Not -Throw
    }
}

Describe "Invoke-Handoff" {
    It "activates and runs fledging via plain dart on the --no-fvm path" {
        $script:NoFvm = $true
        Mock _Invoke-DartHandoff { }
        Mock _Invoke-FvmDartHandoff { }
        Invoke-Handoff
        Should -Invoke _Invoke-DartHandoff -Times 1 -Exactly
        Should -Invoke _Invoke-FvmDartHandoff -Times 0 -Exactly
    }
    It "runs fledging via 'fvm dart' on the fvm path" {
        $script:NoFvm = $false
        Mock _Invoke-DartHandoff { }
        Mock _Invoke-FvmDartHandoff { }
        Invoke-Handoff
        Should -Invoke _Invoke-FvmDartHandoff -Times 1 -Exactly
        Should -Invoke _Invoke-DartHandoff -Times 0 -Exactly
    }
}

Describe "Invoke-Main orchestration" {
    BeforeEach {
        $script:savedUserProfile = $env:USERPROFILE
        $env:USERPROFILE = 'C:\Users\jane'
        $script:mainCalls = [System.Collections.ArrayList]@()
        Mock Get-FledgingArch { 'x64' }
        Mock Enable-LongPaths      { $null = $script:mainCalls.Add('long-paths') }
        Mock Install-Scoop         { $null = $script:mainCalls.Add('scoop') }
        Mock Add-ScoopExtrasBucket { $null = $script:mainCalls.Add('bucket') }
        Mock Install-ScoopPackage  { $null = $script:mainCalls.Add("pkg:$Package") }
        Mock Install-ViaFvm        { $null = $script:mainCalls.Add('fvm') }
        Mock Install-FlutterDirect { $null = $script:mainCalls.Add('direct') }
        Mock Set-GitSslBackend     { $null = $script:mainCalls.Add('ssl') }
        Mock Enable-DeveloperMode  { $null = $script:mainCalls.Add('devmode') }
        Mock Add-DefenderExclusions{ $null = $script:mainCalls.Add('defender') }
        Mock Add-ToUserPath        { $null = $script:mainCalls.Add("path:$NewDir") }
        Mock Invoke-Handoff        { $null = $script:mainCalls.Add('handoff') }
    }
    AfterEach { $env:USERPROFILE = $script:savedUserProfile }

    It "runs the fvm path in the expected order" {
        Mock Initialize-Flags { $script:Headless = $true; $script:NoFvm = $false; $script:FlutterVersion = ''; $script:VerboseOutput = $false }
        Invoke-Main
        $script:mainCalls -join ',' | Should -Be 'long-paths,scoop,pkg:git,ssl,bucket,fvm,devmode,defender,path:C:\Users\jane\fvm\default\bin,handoff' -Because ($script:mainCalls -join ',')
    }

    It "uses the direct-download path when NoFvm is set" {
        Mock Initialize-Flags { $script:Headless = $true; $script:NoFvm = $true; $script:FlutterVersion = ''; $script:VerboseOutput = $false }
        Invoke-Main
        $script:mainCalls | Should -Contain 'direct'
        $script:mainCalls | Should -Not -Contain 'fvm'
    }

    It "installs git before the Flutter step (fvm needs it)" {
        Mock Initialize-Flags { $script:Headless = $true; $script:NoFvm = $false; $script:FlutterVersion = ''; $script:VerboseOutput = $false }
        Invoke-Main
        $gitIdx = $script:mainCalls.IndexOf('pkg:git')
        $fvmIdx = $script:mainCalls.IndexOf('fvm')
        $gitIdx | Should -BeLessThan $fvmIdx
    }

    It "installs git before adding the extras bucket (Scoop buckets are git repos)" {
        Mock Initialize-Flags { $script:Headless = $true; $script:NoFvm = $false; $script:FlutterVersion = ''; $script:VerboseOutput = $false }
        Invoke-Main
        $script:mainCalls.IndexOf('pkg:git') | Should -BeLessThan $script:mainCalls.IndexOf('bucket')
    }

    It "sets git schannel before the first git clone (bucket add) for corp proxies" {
        # Git for Windows ignores the Windows cert store until http.sslBackend=schannel,
        # so schannel MUST be configured before the extras bucket is cloned.
        Mock Initialize-Flags { $script:Headless = $true; $script:NoFvm = $false; $script:FlutterVersion = ''; $script:VerboseOutput = $false }
        Invoke-Main
        $script:mainCalls.IndexOf('ssl') | Should -BeLessThan $script:mainCalls.IndexOf('bucket')
    }
}

Describe "Windows-specific steps" {
    Context "Enable-LongPaths" {
        It "skips the registry write and does not throw when not admin" {
            Mock Test-IsAdmin { $false }
            Mock _Set-LongPathsRegistry { }
            Mock _Set-GitLongPaths { }
            { Enable-LongPaths } | Should -Not -Throw
            Should -Invoke _Set-LongPathsRegistry -Times 0 -Exactly
        }
        It "writes the registry value when admin" {
            Mock Test-IsAdmin { $true }
            Mock _Set-LongPathsRegistry { }
            Mock _Set-GitLongPaths { }
            Enable-LongPaths
            Should -Invoke _Set-LongPathsRegistry -Times 1 -Exactly
        }
    }

    Context "Add-DefenderExclusions" {
        It "skips when not admin" {
            Mock Test-IsAdmin { $false }
            Mock _Add-DefenderExclusion { }
            Add-DefenderExclusions
            Should -Invoke _Add-DefenderExclusion -Times 0 -Exactly
        }
        It "adds exclusions for the Flutter SDK and pub cache when admin" {
            Mock Test-IsAdmin { $true }
            Mock _Add-DefenderExclusion { }
            Add-DefenderExclusions
            Should -Invoke _Add-DefenderExclusion -Times 2 -Exactly
        }
    }

    Context "Enable-DeveloperMode" {
        It "skips when not admin" {
            Mock Test-IsAdmin { $false }
            Mock _Set-DeveloperModeRegistry { }
            Enable-DeveloperMode
            Should -Invoke _Set-DeveloperModeRegistry -Times 0 -Exactly
        }
        It "enables developer mode when admin" {
            Mock Test-IsAdmin { $true }
            Mock _Set-DeveloperModeRegistry { }
            Enable-DeveloperMode
            Should -Invoke _Set-DeveloperModeRegistry -Times 1 -Exactly
        }
    }

    Context "Set-GitSslBackend" {
        It "configures schannel without requiring admin" {
            Mock _Set-GitSslBackendSchannel { }
            Set-GitSslBackend
            Should -Invoke _Set-GitSslBackendSchannel -Times 1 -Exactly
        }
    }
}

Describe "Get-UpdatedPath" {
    It "appends the new directory when it is absent" {
        Get-UpdatedPath -CurrentPath 'C:\a;C:\b' -NewDir 'C:\c' | Should -Be 'C:\a;C:\b;C:\c'
    }
    It "returns null when the directory is already present (dedup)" {
        Get-UpdatedPath -CurrentPath 'C:\a;C:\c' -NewDir 'C:\c' | Should -BeNullOrEmpty
    }
    It "handles an empty current PATH" {
        Get-UpdatedPath -CurrentPath '' -NewDir 'C:\c' | Should -Be 'C:\c'
    }
    It "ignores empty segments from trailing separators" {
        Get-UpdatedPath -CurrentPath 'C:\a;;' -NewDir 'C:\c' | Should -Be 'C:\a;C:\c'
    }
}

Describe "Add-ToUserPath" {
    It "writes the updated PATH when the directory is absent" {
        Mock _Get-UserEnvPath { 'C:\a' }
        Mock _Set-UserEnvPath { }
        Add-ToUserPath -NewDir 'C:\c'
        Should -Invoke _Set-UserEnvPath -Times 1 -Exactly -ParameterFilter { $Value -like '*C:\c*' }
    }
    It "does not write when the directory is already present" {
        Mock _Get-UserEnvPath { 'C:\c' }
        Mock _Set-UserEnvPath { }
        Add-ToUserPath -NewDir 'C:\c'
        Should -Invoke _Set-UserEnvPath -Times 0 -Exactly
    }
}

Describe "Get-FlutterInstallDir" {
    AfterEach { $env:USERPROFILE = $script:savedUserProfile }
    BeforeEach { $script:savedUserProfile = $env:USERPROFILE }

    It "uses the profile\develop path when the profile path has no spaces" {
        $env:USERPROFILE = 'C:\Users\jane'
        Get-FlutterInstallDir | Should -Be 'C:\Users\jane\develop'
    }

    It "falls back to a spaceless path when the profile has a space" {
        # Flutter breaks on paths containing spaces (e.g. C:\Users\John Doe).
        $env:USERPROFILE = 'C:\Users\John Doe'
        Get-FlutterInstallDir | Should -Not -Match ' '
    }
}

Describe "Install-FlutterDirect" {
    BeforeEach {
        $script:FledgingArch = 'x64'
        $script:FlutterVersion = ''
        $script:releasesFixture = @'
{
  "base_url": "https://evil.example.com/releases",
  "current_release": { "stable": "hashstable" },
  "releases": [
    { "hash": "hashstable", "version": "3.19.0",
      "archive": "stable/windows/flutter_windows_3.19.0-stable.zip",
      "sha256": "aaa64", "dart_sdk_arch": "x64" }
  ]
}
'@ | ConvertFrom-Json
        Mock _Get-FlutterReleasesJson { $script:releasesFixture }
        Mock Get-RemoteFile { }
        Mock Test-Sha256 { }
        Mock _Expand-Zip { }
        Mock Get-FlutterInstallDir { Join-Path ([System.IO.Path]::GetTempPath()) "fledging-inst-$([System.IO.Path]::GetRandomFileName())" }
    }

    It "skips everything when flutter is already installed" {
        Mock _Test-FlutterInstalled { $true }
        Install-FlutterDirect
        Should -Invoke _Get-FlutterReleasesJson -Times 0 -Exactly
    }

    It "downloads, verifies, and extracts on the happy path" {
        $script:flutterChecks = 0
        Mock _Test-FlutterInstalled { $script:flutterChecks++; return ($script:flutterChecks -gt 1) }
        Install-FlutterDirect
        Should -Invoke Get-RemoteFile -Times 1 -Exactly
        Should -Invoke Test-Sha256 -Times 1 -Exactly
        Should -Invoke _Expand-Zip -Times 1 -Exactly
    }

    It "builds the download URL from FLUTTER_RELEASES_BASE, not the JSON base_url" {
        # Security: a compromised releases JSON must not be able to redirect the download.
        $script:flutterChecks = 0
        Mock _Test-FlutterInstalled { $script:flutterChecks++; return ($script:flutterChecks -gt 1) }
        Install-FlutterDirect
        Should -Invoke Get-RemoteFile -Times 1 -Exactly -ParameterFilter {
            $Url -like "$($script:FLUTTER_RELEASES_BASE)/*" -and $Url -notlike '*evil.example.com*'
        }
    }

    It "throws when flutter is not on PATH after extraction" {
        Mock _Test-FlutterInstalled { $false }
        { Install-FlutterDirect } | Should -Throw -ExpectedMessage '*flutter*'
    }
}

Describe "Install-ViaFvm" {
    BeforeEach {
        Mock Install-ScoopPackage { }
        Mock _Fvm-Install { }
        Mock _Fvm-Global { }
        Mock _Set-GitSafeDirectory { }
        Mock _Test-DartInstalled { $true }
        $script:FlutterVersion = ''
    }

    It "installs fvm via Scoop when it is missing" {
        Mock _Test-FvmInstalled { $false }
        Install-ViaFvm
        Should -Invoke Install-ScoopPackage -Times 1 -Exactly -ParameterFilter { $Package -eq 'fvm' }
    }

    It "skips the Scoop install when fvm is already present" {
        Mock _Test-FvmInstalled { $true }
        Install-ViaFvm
        Should -Invoke Install-ScoopPackage -Times 0 -Exactly
    }

    It "passes the requested Flutter version to fvm install" {
        Mock _Test-FvmInstalled { $true }
        $script:FlutterVersion = '3.19.0'
        Install-ViaFvm
        Should -Invoke _Fvm-Install -Times 1 -Exactly -ParameterFilter { $Version -eq '3.19.0' }
    }

    It "defaults to stable when no version is requested" {
        Mock _Test-FvmInstalled { $true }
        Install-ViaFvm
        Should -Invoke _Fvm-Install -Times 1 -Exactly -ParameterFilter { $Version -eq 'stable' }
    }

    It "configures git safe.directory (fvm installs Flutter via git on Windows)" {
        Mock _Test-FvmInstalled { $true }
        Install-ViaFvm
        Should -Invoke _Set-GitSafeDirectory -Times 1 -Exactly
    }

    It "throws when dart is not on PATH after install" {
        Mock _Test-FvmInstalled { $true }
        Mock _Test-DartInstalled { $false }
        { Install-ViaFvm } | Should -Throw -ExpectedMessage '*dart*'
    }
}

Describe "Scoop" {
    Context "Install-Scoop" {
        It "skips the installer when scoop is already present" {
            Mock _Test-ScoopInstalled { $true }
            Mock _Invoke-ScoopInstaller { }
            Install-Scoop
            Should -Invoke _Invoke-ScoopInstaller -Times 0 -Exactly
        }

        It "runs the installer when scoop is absent" {
            $script:scoopCheckCalls = 0
            # First check (before install) reports absent; the post-install check reports present.
            Mock _Test-ScoopInstalled { $script:scoopCheckCalls++; return ($script:scoopCheckCalls -gt 1) }
            Mock _Invoke-ScoopInstaller { }
            Install-Scoop
            Should -Invoke _Invoke-ScoopInstaller -Times 1 -Exactly
        }

        It "throws when scoop is still missing after the installer runs" {
            Mock _Test-ScoopInstalled { $false }
            Mock _Invoke-ScoopInstaller { }
            { Install-Scoop } | Should -Throw -ExpectedMessage '*scoop*'
        }

        It "adds the shims dir to the session PATH after installing" {
            # A freshly-installed Scoop only lands on the *persistent* User PATH; the
            # current process must have the shims dir added explicitly or the post-check
            # (and later scoop/git calls) can't find it.
            $script:fakeShims = Join-Path ([System.IO.Path]::GetTempPath()) "fledging-shims-$([System.IO.Path]::GetRandomFileName())"
            New-Item -ItemType Directory -Path $script:fakeShims -Force | Out-Null
            $savedPath = $env:PATH
            try {
                Mock _Get-ScoopShimDir { $script:fakeShims }
                $script:scoopCheckCalls = 0
                Mock _Test-ScoopInstalled { $script:scoopCheckCalls++; return ($script:scoopCheckCalls -gt 1) }
                Mock _Invoke-ScoopInstaller { }
                Install-Scoop
                $env:PATH | Should -BeLike "*$script:fakeShims*"
            } finally {
                $env:PATH = $savedPath
                Remove-Item -Recurse -Force $script:fakeShims -ErrorAction SilentlyContinue
            }
        }

        It "exposes an already-installed Scoop that is missing from the session PATH" {
            $script:fakeShims = Join-Path ([System.IO.Path]::GetTempPath()) "fledging-shims-$([System.IO.Path]::GetRandomFileName())"
            New-Item -ItemType Directory -Path $script:fakeShims -Force | Out-Null
            $savedPath = $env:PATH
            try {
                Mock _Get-ScoopShimDir { $script:fakeShims }
                Mock _Test-ScoopInstalled { $true }
                Mock _Invoke-ScoopInstaller { }
                Install-Scoop
                $env:PATH | Should -BeLike "*$script:fakeShims*"
                Should -Invoke _Invoke-ScoopInstaller -Times 0 -Exactly
            } finally {
                $env:PATH = $savedPath
                Remove-Item -Recurse -Force $script:fakeShims -ErrorAction SilentlyContinue
            }
        }
    }

    Context "Add-ScoopExtrasBucket" {
        It "adds the extras bucket when it is missing" {
            Mock _Test-ScoopBucketExists { $false }
            Mock _Add-ScoopBucket { }
            Add-ScoopExtrasBucket
            Should -Invoke _Add-ScoopBucket -Times 1 -Exactly
        }

        It "skips adding the bucket when it already exists" {
            Mock _Test-ScoopBucketExists { $true }
            Mock _Add-ScoopBucket { }
            Add-ScoopExtrasBucket
            Should -Invoke _Add-ScoopBucket -Times 0 -Exactly
        }
    }

    Context "Install-ScoopPackage" {
        It "installs the requested package" {
            Mock _Install-ScoopPackage { }
            Install-ScoopPackage -Package 'git'
            Should -Invoke _Install-ScoopPackage -Times 1 -Exactly -ParameterFilter { $Package -eq 'git' }
        }
    }
}

Describe "Get-FlutterRelease" {
    BeforeAll {
        $script:Fixture = @'
{
  "base_url": "https://storage.example.com/releases",
  "current_release": { "stable": "hashstable" },
  "releases": [
    { "hash": "hashstable", "channel": "stable", "version": "3.19.0",
      "archive": "stable/windows/flutter_windows_3.19.0-stable.zip",
      "sha256": "aaa64", "dart_sdk_arch": "x64" },
    { "hash": "hashstable", "channel": "stable", "version": "3.19.0",
      "archive": "stable/windows/flutter_windows_arm64_3.19.0-stable.zip",
      "sha256": "bbbarm", "dart_sdk_arch": "arm64" },
    { "hash": "hcold", "channel": "stable", "version": "2.0.0",
      "archive": "stable/windows/flutter_windows_2.0.0-stable.zip",
      "sha256": "cccold" }
  ]
}
'@ | ConvertFrom-Json
    }

    It "returns the stable x64 archive and sha256 when no version is requested" {
        $r = Get-FlutterRelease -Releases $script:Fixture -Arch 'x64'
        $r.Archive | Should -Be 'stable/windows/flutter_windows_3.19.0-stable.zip'
        $r.Sha256  | Should -Be 'aaa64'
    }

    It "returns the arm64 archive when arch is arm64" {
        $r = Get-FlutterRelease -Releases $script:Fixture -Arch 'arm64'
        $r.Sha256 | Should -Be 'bbbarm'
    }

    It "returns a specific requested version" {
        $r = Get-FlutterRelease -Releases $script:Fixture -Arch 'x64' -RequestedVersion '2.0.0'
        $r.Sha256 | Should -Be 'cccold'
    }

    It "treats a release with no dart_sdk_arch as x64" {
        # The 2.0.0 entry has no dart_sdk_arch — it should match x64, not arm64.
        { Get-FlutterRelease -Releases $script:Fixture -Arch 'arm64' -RequestedVersion '2.0.0' } |
            Should -Throw -ExpectedMessage '*not found*'
    }

    It "throws when the requested version does not exist" {
        { Get-FlutterRelease -Releases $script:Fixture -Arch 'x64' -RequestedVersion '9.99.99' } |
            Should -Throw -ExpectedMessage '*9.99.99*not found*'
    }
}

Describe "Get-RemoteFile" {
    It "downloads to a .part file then renames it to the destination" {
        Mock _Invoke-Download {
            param($Url, $OutFile)
            [System.IO.File]::WriteAllText($OutFile, 'payload')
        }
        $dest = Join-Path ([System.IO.Path]::GetTempPath()) "fledging-dl-$([System.IO.Path]::GetRandomFileName())"
        try {
            Get-RemoteFile -Url 'https://example.com/f' -Dest $dest
            Test-Path $dest | Should -BeTrue
            Test-Path "$dest.part" | Should -BeFalse
        } finally {
            Remove-Item -Force $dest, "$dest.part" -ErrorAction SilentlyContinue
        }
    }
}

Describe "Test-Sha256" {
    It "passes when the hash matches" {
        $f = New-TemporaryFile
        [System.IO.File]::WriteAllText($f.FullName, 'hello')
        try {
            # SHA256 of "hello" with no trailing newline
            { Test-Sha256 -Path $f.FullName -Expected '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824' } |
                Should -Not -Throw
        } finally { Remove-Item -Force $f.FullName -ErrorAction SilentlyContinue }
    }

    It "throws and removes the file on mismatch" {
        $f = New-TemporaryFile
        [System.IO.File]::WriteAllText($f.FullName, 'hello')
        { Test-Sha256 -Path $f.FullName -Expected ('0' * 64) } | Should -Throw -ExpectedMessage '*mismatch*'
        Test-Path $f.FullName | Should -BeFalse
    }
}

Describe "Get-FledgingArch" {
    It "maps X64 to x64" {
        Mock _Get-OSArchitecture { 'X64' }
        Get-FledgingArch | Should -Be 'x64'
    }
    It "maps Arm64 to arm64" {
        Mock _Get-OSArchitecture { 'Arm64' }
        Get-FledgingArch | Should -Be 'arm64'
    }
    It "throws on an unsupported architecture" {
        Mock _Get-OSArchitecture { 'X86' }
        { Get-FledgingArch } | Should -Throw -ExpectedMessage '*Unsupported architecture*'
    }
}

Describe "Initialize-Flags" {
    AfterEach {
        Remove-Item Env:\FLEDGING_NONINTERACTIVE -ErrorAction SilentlyContinue
    }

    It "passes -NoFvm through to the script flag" {
        Initialize-Flags -NoFvm -FlutterVersion '' -Headless:$false -VerboseOutput:$false
        $script:NoFvm | Should -BeTrue
    }

    It "passes -FlutterVersion through to the script flag" {
        Initialize-Flags -FlutterVersion '3.19.0' -Headless:$false -VerboseOutput:$false
        $script:FlutterVersion | Should -Be '3.19.0'
    }

    It "sets Headless when -Headless is passed" {
        Initialize-Flags -Headless -FlutterVersion '' -VerboseOutput:$false
        $script:Headless | Should -BeTrue
    }

    It "forces Headless when FLEDGING_NONINTERACTIVE=1 even without -Headless" {
        $env:FLEDGING_NONINTERACTIVE = '1'
        Initialize-Flags -Headless:$false -FlutterVersion '' -VerboseOutput:$false
        $script:Headless | Should -BeTrue
    }

    It "leaves Headless false when neither flag nor env var is set" {
        Initialize-Flags -Headless:$false -FlutterVersion '' -VerboseOutput:$false
        $script:Headless | Should -BeFalse
    }
}

Describe "utility functions" {
    Context "Test-CommandExists" {
        It "returns true for a present command" {
            Test-CommandExists 'Get-Command' | Should -BeTrue
        }
        It "returns false for a missing command" {
            Test-CommandExists 'definitely-not-a-real-cmd-xyz-abc' | Should -BeFalse
        }
    }

    Context "Invoke-Ensure" {
        It "does not throw when the script block succeeds" {
            { Invoke-Ensure -What 'ok' -Script { $true } } | Should -Not -Throw
        }
        It "throws when the script block throws" {
            { Invoke-Ensure -What 'boom' -Script { throw 'kaboom' } } | Should -Throw
        }
        It "throws when a native command exits non-zero" {
            { Invoke-Ensure -What 'false' -Script { & (Get-Command '/usr/bin/false' -ErrorAction SilentlyContinue).Source } } |
                Should -Throw -ExpectedMessage '*false*'
        }
    }

    Context "Write-Info/Warn/Err" {
        It "Write-Info emits nothing on the success (output) stream" {
            # Diagnostic output must not pollute stdout — mirrors the bash 'all to stderr' rule.
            $out = Write-Info 'hello' 6>$null
            $out | Should -BeNullOrEmpty
        }
        It "Write-Info writes the message to the information stream" {
            $info = Write-Info 'hello-info' 6>&1
            "$info" | Should -Match 'hello-info'
        }
    }

    Context "Exit-Installer" {
        It "returns without exiting when run from iex, setting LASTEXITCODE" {
            $script:IsExecutedFromIex = $true
            $global:LASTEXITCODE = 0
            Exit-Installer -Code 5 -Message 'bye'
            # Reaching this line proves it returned instead of exiting the session.
            $global:LASTEXITCODE | Should -Be 5
        }
    }
}
