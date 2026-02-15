Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & Replace(WScript.ScriptFullName, ".vbs", ".bat") & Chr(34), 1, False

' Open browser after a brief delay
WScript.Sleep 3000
WshShell.Run "http://localhost:3000", 1, False
