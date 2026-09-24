; Custom NSIS hooks for the DOKIII installer/uninstaller.
; Wired up through `nsis.include` in electron-builder.yml.
;
; Why this exists
; ---------------
; DOKIII draws its dock AND all desktop widgets inside one transparent
; window owned by DOKIII.exe. If the uninstaller fails to stop that process,
; the files get deleted but the widgets stay on screen until reboot.
;
; electron-builder's stock "is the app running?" check
;   1. asks the app to close politely (WM_CLOSE) - DOKIII intercepts that
;      and just hides its window, and
;   2. finds/kills the process with a `USERNAME eq %USERNAME%` filter, which
;      can miss the process (tasklist compares against DOMAIN\user).
; If the check misses, the uninstaller happily deletes files under a running
; app. The macro below replaces the stock check with a hard, verified kill.

!macro DOKIII_FIND_PROCESS _RESULT
  ; Result is "0" when at least one DOKIII.exe process exists.
  nsExec::Exec `%SYSTEMROOT%\System32\cmd.exe /c tasklist /FI "IMAGENAME eq ${APP_EXECUTABLE_FILENAME}" /FO csv | %SYSTEMROOT%\System32\find.exe "${APP_EXECUTABLE_FILENAME}"`
  Pop ${_RESULT}
!macroend

; Used by both the installer (upgrades) and the uninstaller.
!macro customCheckAppRunning
  !insertmacro DOKIII_FIND_PROCESS $R0
  ${if} $R0 == 0
    ${ifNot} ${isUpdated}
      MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "$(appRunning)" /SD IDOK IDOK dokiii_stop
      Quit
    ${endIf}

    dokiii_stop:
    DetailPrint `Closing running "${PRODUCT_NAME}"...`

    StrCpy $R1 0
    dokiii_kill:
      IntOp $R1 $R1 + 1

      ; /F = force (the app swallows polite close requests).
      ; No /T: the Electron helper processes are all named DOKIII.exe, so
      ; matching by image name already gets them, and /T could also take
      ; down an uninstaller that was launched from the app.
      nsExec::Exec `%SYSTEMROOT%\System32\taskkill.exe /F /IM "${APP_EXECUTABLE_FILENAME}"`
      Pop $R2
      Sleep 800

      ; Verify it is really gone before any file is touched.
      !insertmacro DOKIII_FIND_PROCESS $R0
      ${if} $R0 == 0
        ${if} $R1 < 5
          Goto dokiii_kill
        ${endIf}
        ; Still alive after several tries (e.g. running elevated).
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(appCannotBeClosed)" /SD IDCANCEL IDRETRY dokiii_kill
        Quit
      ${endIf}
  ${endIf}
!macroend

; Runs at the end of the uninstall section.
!macro customUnInstall
  ; Do NOT touch autostart during an update: the old version's uninstaller
  ; runs on every update and the app relaunches afterwards.
  ${ifNot} ${isUpdated}
    ; app.setLoginItemSettings() stores a value under HKCU\...\Run (named
    ; after the app user model id) plus a StartupApproved entry. Without this
    ; the machine keeps a dangling autostart entry pointing at a deleted exe.
    ; Value names are case-insensitive; several candidates are removed because
    ; the name depends on how Electron derived the app name.
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.dokiii"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.${PRODUCT_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.dokiii.app"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "electron.app.dokiii"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "electron.app.${PRODUCT_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "com.dokiii.app"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "${PRODUCT_FILENAME}"

    ; Legacy Startup-folder shortcut from older versions (per-user folder).
    ${if} $installMode == "all"
      SetShellVarContext current
    ${endIf}
    Delete "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\${PRODUCT_FILENAME}.lnk"
    ${if} $installMode == "all"
      SetShellVarContext all
    ${endIf}
  ${endIf}
!macroend
