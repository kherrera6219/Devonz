# Windows Desktop Governance

> **Status**: Released
> **Version**: 2026.1

Devonz for Windows follows strict governance patterns to ensure secure, native-class operation.

## 1. MSIX Packaging
Our primary distribution format is MSIX (Windows App Package).
-   **Security**: MSIX packages are signed and run in a lightweight app container.
-   **Updates**: Managed via Windows App Installer or custom background check.
-   **Uninstallation**: Full cleanup of app data, unless the user opts to keep logs/persistence.

## 2. NSIS Governance (Legacy/Backup)
-   **Silent Install**: Supported via `/S` flag for enterprise deployment.
-   **Port Resolution**: The installer checks for port 3000 availability.
-   **Credential Manager**: Native integration with Windows Credential Manager for API keys.

## 3. Auto-Update Policy
1.  **Check**: On startup, the app queries the version manifest.
2.  **Download**: Updates are downloaded in the background to a secure temp folder.
3.  **Apply**: User is prompted to restart; the MSIX provider handles the atomic swap.

## 4. Port Conflict System
If port 3000 is occupied, the app invokes `PortResolution.findAvailablePort()` and notifies the user of the new local URL.
