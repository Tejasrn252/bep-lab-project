<#
push-to-github.ps1
Helper script to initialize a git repo (if needed), set remote to the provided GitHub URL,
commit current files (including the .gitignore we added), and push the `main` branch to origin.

Usage (PowerShell):
    cd "C:\Users\TEJAS 252\bep-lab-project"
    .\push-to-github.ps1

Important: This script does not create GitHub credentials. If you use HTTPS, you'll be prompted
for credentials (use a PAT for password). For SSH, ensure your key is added to GitHub and
`ssh-agent` is running.
#>

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $repoPath
Write-Host "Working in: $repoPath"

# Check for git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is not installed or not in PATH. Install Git for Windows: https://git-scm.com/download/win and re-open PowerShell."
    exit 1
}

# Initialize repo if needed
if (-not (Test-Path .git)) {
    Write-Host "No .git found — initializing repository..."
    git init
} else {
    Write-Host ".git exists — skipping git init"
}

# Set remote origin to the requested URL
$remoteUrl = 'https://github.com/Tejasrn252/bep-lab-project.git'
$existingRemote = git remote | Out-String
if (-not $existingRemote.Trim()) {
    Write-Host "Adding origin: $remoteUrl"
    git remote add origin $remoteUrl
} else {
    Write-Host "Setting origin to: $remoteUrl"
    git remote set-url origin $remoteUrl
}

# Stage changes
Write-Host "Staging all files..."
git add -A

# Commit (allow empty so initial commit is created if necessary)
$commitMessage = 'chore: sync workspace to https://github.com/Tejasrn252/bep-lab-project'
Write-Host "Committing with message: $commitMessage"
# If there's nothing to commit, --allow-empty ensures a commit is still created
git commit -m "$commitMessage" --allow-empty

# Ensure branch is main
Write-Host "Ensuring branch name is 'main'"
git branch -M main

# Push and capture output
Write-Host "Pushing to origin main (this may prompt for credentials)..."
$push = git push -u origin main 2>&1
$pushExit = $LASTEXITCODE
Write-Host $push

if ($pushExit -eq 0) {
    Write-Host "Push succeeded."
    exit 0
}

# If push failed, give common remediation steps
Write-Host "Push failed with exit code $pushExit. Common fixes:"
Write-Host "- Authentication error: create a Personal Access Token (PAT) and use it as your password for HTTPS pushes. See: https://github.com/settings/tokens"
Write-Host "  Or set up SSH keys and change remote: git remote set-url origin git@github.com:Tejasrn252/bep-lab-project.git"
Write-Host "- Non-fast-forward / unrelated histories: run one of the following after reviewing remote contents:"
Write-Host "    git pull --rebase origin main    # brings remote changes into yours"
Write-Host "    OR (if you truly want to overwrite remote): git push --force origin main"
Write-Host "Paste the exact error output here so I can recommend the precise command."
exit $pushExit
