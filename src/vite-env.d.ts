/// <reference types="vite/client" />

// Typed access to the app's build-time environment variables. This also
// declares `import.meta.env` so the editor stops reporting
// "Property 'env' does not exist on type 'ImportMeta'".
interface ImportMetaEnv {
  /** Public base URL of the FastAPI backend (e.g. https://eqa.ims-zm.online/api/) */
  readonly VITE_API_URL: string;
  /** Reports base URL (same as the API until XtraReports is deployed) */
  readonly VITE_REPORT_URL: string;
  /** Optional secondary API base */
  readonly VITE_LOCAL_API_URL: string;
  /** "true" shows the admin dev tools (e.g. the phase-jump card) */
  readonly VITE_ENABLE_DEV_TOOLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
