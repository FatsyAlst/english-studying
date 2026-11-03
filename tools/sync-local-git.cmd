@echo off
rem ---------------------------------------------------------------------------
rem  Run this after Claude's monthly sync (or any sync pushed from the cloud).
rem  It brings this folder's local git (branch + index) up to date with GitHub.
rem  Your files are NOT touched: only git's bookkeeping moves to match GitHub.
rem ---------------------------------------------------------------------------
cd /d "%~dp0.."
echo Fetching from GitHub...
git fetch origin || goto :failed
git merge-base --is-ancestor HEAD origin/main
if errorlevel 1 (
  echo.
  echo Your local branch has commits that are not on GitHub, so nothing was changed.
  echo Push or merge them first, then run this again.
  goto :end
)
git reset --quiet --mixed origin/main
echo.
echo Done. Local git now matches GitHub.
echo Anything listed below changed after the sync (new work) or is left over:
git status --short
goto :end
:failed
echo.
echo git fetch failed. Check your internet connection and try again.
:end
echo.
pause
