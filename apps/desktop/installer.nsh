; Custom NSIS installer script for AI File Cleanup
; This script adds custom pages and functionality to the Windows installer

!macro customHeader
  ; Add custom header macro if needed
!macroend

!macro preInit
  ; Run before installer initialization
  SetRegView 64
!macroend

!macro customInit
  ; Custom initialization
!macroend

!macro customInstall
  ; Custom installation steps
  ; Create application data directory
  CreateDirectory "$APPDATA\AI File Cleanup"
  
  ; Write registry keys for file associations (optional)
  ; WriteRegStr HKCU "Software\AI File Cleanup" "InstallPath" "$INSTDIR"
!macroend

!macro customUnInstall
  ; Custom uninstallation steps
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AI File Cleanup"
  DeleteRegKey HKCU "Software\AI File Cleanup"
  
  ; Remove application data (optional, based on user choice)
  ; RMDir /r "$APPDATA\AI File Cleanup"
!macroend

!macro customInstallMode
  ; Custom install mode
!macroend

; Custom welcome page text
!macro customWelcomePage
  ; Add custom text to welcome page if needed
!macroend

; Custom finish page
!macro customFinishPage
  ; Add custom text to finish page
!macroend

