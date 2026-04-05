type RuntimeEnv = {
  VITE_GATEWAY_BASE_URL?: string
  VITE_REGISTRY_BASE_URL?: string
  VITE_AUTH_ENABLED?: string
  VITE_OIDC_AUTHORITY?: string
  VITE_OIDC_ISSUER?: string
  VITE_OIDC_CLIENT_ID?: string
  VITE_OIDC_REDIRECT_URI?: string
  VITE_OIDC_POST_LOGOUT_REDIRECT_URI?: string
}

declare global {
  interface Window {
    __DIASOFT_ENV__?: RuntimeEnv
  }
}

const runtimeEnv = typeof window !== 'undefined' ? window.__DIASOFT_ENV__ ?? {} : {}

export function readRuntimeConfig(key: keyof RuntimeEnv) {
  return runtimeEnv[key] ?? import.meta.env[key]
}
