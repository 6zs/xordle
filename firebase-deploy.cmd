npm run build
xcopy build firebase-build /E/H/y
powershell -Command "(gc firebase-build/index.html) -replace '/xordle/', '/' | Out-File -encoding ASCII firebase-build/index.html"
firebase deploy
