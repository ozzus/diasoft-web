import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from 'oidc-client-ts'
import { AuthProvider as OidcProvider, hasAuthParams, useAuth as useOidcAuth } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'

import { getCurrentUser, login as loginRequest, setAccessToken, type CurrentUser, type LoginRequest } from '@/lib/api'
import { readRuntimeConfig } from '@/lib/runtime-config'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  authEnabled: boolean
  status: AuthStatus
  user: CurrentUser | null
  error: string | null
  login: (credentials?: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasAnyRole: (...roles: string[]) => boolean
}

const accessTokenStorageKey = 'diasoft-web.access-token'
const returnUrlStorageKey = 'diasoft-web.return-url'
const authEnabled = readRuntimeConfig('VITE_AUTH_ENABLED') === 'true'
const authority = readRuntimeConfig('VITE_OIDC_AUTHORITY') ?? readRuntimeConfig('VITE_OIDC_ISSUER') ?? ''
const clientId = readRuntimeConfig('VITE_OIDC_CLIENT_ID') ?? ''
const redirectUri = readRuntimeConfig('VITE_OIDC_REDIRECT_URI') ?? `${window.location.origin}/`
const postLogoutRedirectUri = readRuntimeConfig('VITE_OIDC_POST_LOGOUT_REDIRECT_URI') ?? `${window.location.origin}/`

const AuthContext = createContext<AuthContextValue | null>(null)

const oidcConfig = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  post_logout_redirect_uri: postLogoutRedirectUri,
  response_type: 'code',
  scope: 'openid profile email offline_access',
  automaticSilentRenew: true,
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: (user?: User | void) => {
    const stateValue = user && typeof user.state === 'object' && user.state !== null ? user.state : null
    const returnTo = typeof stateValue?.returnTo === 'string' ? stateValue.returnTo : sessionStorage.getItem(returnUrlStorageKey) ?? '/'
    sessionStorage.removeItem(returnUrlStorageKey)
    window.history.replaceState({}, document.title, normalizeReturnUrl(returnTo))
  },
  onSignoutCallback: () => {
    window.location.assign('/')
  },
}

export function AuthProvider({ children }: PropsWithChildren) {
  if (!authEnabled) {
    return <PasswordAuthProvider>{children}</PasswordAuthProvider>
  }

  return (
    <OidcProvider {...oidcConfig}>
      <OidcSessionBridge>{children}</OidcSessionBridge>
    </OidcProvider>
  )
}

function PasswordAuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    const token = window.localStorage.getItem(accessTokenStorageKey)
    if (!token) {
      setAccessToken(null)
      setStatus('unauthenticated')
      setUser(null)
      setError(null)
      return
    }

    setAccessToken(token)
    setStatus('loading')
    setError(null)

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setStatus('authenticated')
    } catch (bootstrapError) {
      clearStoredSession()
      setUser(null)
      setStatus('unauthenticated')
      setError(bootstrapError instanceof Error ? bootstrapError.message : 'Не удалось восстановить сессию')
    }
  }

  async function login(credentials?: LoginRequest) {
    if (!credentials) {
      throw new Error('Требуются логин, пароль и роль')
    }

    setStatus('loading')
    setError(null)

    try {
      const response = await loginRequest(credentials)
      window.localStorage.setItem(accessTokenStorageKey, response.accessToken)
      setAccessToken(response.accessToken)
      setUser(response.user)
      setStatus('authenticated')
    } catch (loginError) {
      clearStoredSession()
      setUser(null)
      setStatus('unauthenticated')
      setError(loginError instanceof Error ? loginError.message : 'Ошибка авторизации')
      throw loginError
    }
  }

  async function logout() {
    clearStoredSession()
    setUser(null)
    setStatus('unauthenticated')
    setError(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled: false,
      status,
      user,
      error,
      login,
      logout,
      hasAnyRole: (...roles: string[]) => Boolean(user && roles.includes(user.role)),
    }),
    [error, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function OidcSessionBridge({ children }: PropsWithChildren) {
  const oidc = useOidcAuth()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (oidc.isLoading || oidc.activeNavigator) {
      setStatus('loading')
      return
    }

    if (oidc.error) {
      setAccessToken(null)
      setUser(null)
      setStatus('unauthenticated')
      setError(oidc.error.message)
      return
    }

    if (!oidc.isAuthenticated || !oidc.user?.access_token) {
      setAccessToken(null)
      setUser(null)
      setError(null)
      if (!hasAuthParams()) {
        setStatus('unauthenticated')
      }
      return
    }

    setAccessToken(oidc.user.access_token)
    setStatus('loading')
    setError(null)

    void getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch((bootstrapError) => {
        setAccessToken(null)
        setUser(null)
        setStatus('unauthenticated')
        setError(bootstrapError instanceof Error ? bootstrapError.message : 'Не удалось восстановить сессию')
      })
  }, [oidc.activeNavigator, oidc.error, oidc.isAuthenticated, oidc.isLoading, oidc.user?.access_token])

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled: true,
      status,
      user,
      error,
      login: async () => {
        sessionStorage.setItem(returnUrlStorageKey, window.location.pathname + window.location.search + window.location.hash)
        await oidc.signinRedirect({
          state: {
            returnTo: window.location.pathname + window.location.search + window.location.hash,
          },
        })
      },
      logout: async () => {
        setAccessToken(null)
        await oidc.signoutRedirect()
      },
      hasAnyRole: (...roles: string[]) => Boolean(user && roles.includes(user.role)),
    }),
    [error, oidc, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

function normalizeReturnUrl(value: string) {
  if (!value.startsWith('/')) {
    return '/'
  }
  return value
}

function clearStoredSession() {
  window.localStorage.removeItem(accessTokenStorageKey)
  setAccessToken(null)
}
