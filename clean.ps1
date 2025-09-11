# clean.ps1 - Cleanup script for React Native + Gradle builds on Windows

Write-Host "Stopping Gradle daemons..."
./gradlew --stop

Write-Host "Killing any lingering Java/Gradle processes..."
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process gradle -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Removing Gradle caches..."
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\daemon" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\native" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\wrapper" -ErrorAction SilentlyContinue

Write-Host "Cleaning Android build folders..."
Remove-Item -Recurse -Force ".\android\app\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".\android\.gradle" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".\android\build" -ErrorAction SilentlyContinue

Write-Host "Cleaning Node modules & lock files..."
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
Remove-Item -Force "yarn.lock" -ErrorAction SilentlyContinue

Write-Host "Cleanup complete ✅"
