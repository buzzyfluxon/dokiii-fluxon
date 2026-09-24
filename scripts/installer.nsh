!macro DOKIII_FIND_PROCESS _RESULT
  nsExec::Exec `%SYSTEMROOT%\System32\cmd.exe /c tasklist /FI "IMAGENAME eq ${APP_EXECUTABLE_FILENAME}" /FO csv | %SYSTEMROOT%\System32\find.exe "${APP_EXECUTABLE_FILENAME}"`
  Pop ${_RESULT}
!macroend

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

      nsExec::Exec `%SYSTEMROOT%\System32\taskkill.exe /F /IM "${APP_EXECUTABLE_FILENAME}"`
      Pop $R2
      Sleep 800

      !insertmacro DOKIII_FIND_PROCESS $R0
      ${if} $R0 == 0
        ${if} $R1 < 5
          Goto dokiii_kill
        ${endIf}
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(appCannotBeClosed)" /SD IDCANCEL IDRETRY dokiii_kill
        Quit
      ${endIf}
  ${endIf}
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.dokiii"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.${PRODUCT_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.dokiii.app"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "electron.app.dokiii"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "electron.app.${PRODUCT_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "com.dokiii.app"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "${PRODUCT_FILENAME}"

    ${if} $installMode == "all"
      SetShellVarContext current
    ${endIf}
    Delete "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\${PRODUCT_FILENAME}.lnk"
    ${if} $installMode == "all"
      SetShellVarContext all
    ${endIf}
  ${endIf}
!macroend
