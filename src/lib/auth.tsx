import {
  createContext,
  type PropsWithChildren,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AuthProvider as OidcProvider, hasAuthParams, useAuth as useOidcAuth } from 'react-oidc-context'
import { WebStorageStateStore, type User } from 'oidc-client-ts'

import { getCurrentUser, setRegistryAccessToken, type CurrentUser } from '@/lib/api'
import { readRuntimeConfig } from '@/lib/runtime-config'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  authEnabled: boolean
  status: AuthStatus
  user: CurrentUser | null
  error: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  hasAnyRole: (...roles: string[]) => boolean
}

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
    return <DevAuthProvider>{children}</DevAuthProvider>
  }

  return (
    <OidcProvider {...oidcConfig}>
      <OidcSessionBridge>{children}</OidcSessionBridge>
    </OidcProvider>
  )
}

function DevAuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    setStatus('loading')
    setError(null)
    try {
      setRegistryAccessToken(null)
      const currentUser = await getCurrentUser()
      startTransition(() => {
        setUser(currentUser)
        setStatus('authenticated')
      })
    } catch (bootstrapError) {
      startTransition(() => {
        setUser(null)
        setStatus('unauthenticated')
        setError(bootstrapError instanceof Error ? bootstrapError.message : 'Failed to initialize development identity')
      })
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled: false,
      status,
      user,
      error,
      login: async () => {},
      logout: async () => {
        void bootstrap()
      },
      hasAnyRole: (...roles: string[]) => Boolean(user && roles.some((role) => user.roles.includes(role))),
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
      setRegistryAccessToken(null)
      setUser(null)
      setStatus('unauthenticated')
      setError(oidc.error.message)
      return
    }

    if (!oidc.isAuthenticated || !oidc.user?.access_token) {
      setRegistryAccessToken(null)
      setUser(null)
      setError(null)
      if (!hasAuthParams()) {
        setStatus('unauthenticated')
      }
      return
    }

    setRegistryAccessToken(oidc.user.access_token)
    setStatus('loading')
    setError(null)

    void getCurrentUser()
      .then((currentUser) => {
        startTransition(() => {
          setUser(currentUser)
          setStatus('authenticated')
        })
      })
      .catch((bootstrapError) => {
        setRegistryAccessToken(null)
        startTransition(() => {
          setUser(null)
          setStatus('unauthenticated')
          setError(bootstrapError instanceof Error ? bootstrapError.message : 'Failed to bootstrap current user session')
        })
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
        setRegistryAccessToken(null)
        await oidc.signoutRedirect()
      },
      hasAnyRole: (...roles: string[]) => Boolean(user && roles.some((role) => user.roles.includes(role))),
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
