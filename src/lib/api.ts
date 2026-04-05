import type { components as PlatformComponents, paths as PlatformPaths } from '@/lib/generated/platform-contracts'
import { readRuntimeConfig } from '@/lib/runtime-config'

export type VerificationVerdict = PlatformComponents['schemas']['VerificationResult']['verdict']
export type VerificationResult = PlatformComponents['schemas']['VerificationResult']
export type VerificationLookupRequest =
  PlatformPaths['/api/v1/public/verify']['post']['requestBody']['content']['application/json']

export type BackendStatus = {
  gateway: 'up' | 'down'
  registry: 'up' | 'down'
}

export type LoginRequest = PlatformComponents['schemas']['GatewayLoginRequest']
export type LoginResponse = PlatformComponents['schemas']['GatewayLoginResponse']
export type CurrentUser = PlatformComponents['schemas']['GatewayUserProfile']
export type UniversityDiploma = PlatformComponents['schemas']['GatewayUniversityDiplomaItem']
export type UniversityDiplomaList = PlatformComponents['schemas']['GatewayUniversityDiplomaList']
export type ImportAccepted = PlatformComponents['schemas']['GatewayImportAccepted']
export type ImportJob = PlatformComponents['schemas']['GatewayImportStatus']
export type ImportJobError = PlatformComponents['schemas']['GatewayImportError']
export type ImportJobErrorsResponse = PlatformComponents['schemas']['GatewayImportErrorsResponse']
export type RevokeDiplomaRequest = PlatformComponents['schemas']['GatewayRevokeRequest']
export type QrResponse = PlatformComponents['schemas']['GatewayQrResponse']
export type StudentDiploma = PlatformComponents['schemas']['GatewayStudentDiploma']
export type ShareLinkRequest = PlatformComponents['schemas']['GatewayStudentShareLinkRequest']
export type ShareLink = PlatformComponents['schemas']['GatewayStudentShareLink']

const gatewayBaseUrl = normalizeBaseUrl(readRuntimeConfig('VITE_GATEWAY_BASE_URL') ?? 'http://localhost:8080')
const registryBaseUrl = normalizeBaseUrl(readRuntimeConfig('VITE_REGISTRY_BASE_URL') ?? '')

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export async function login(payload: LoginRequest) {
  return requestJSON<LoginResponse>(`${gatewayBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function getCurrentUser() {
  return authedRequestJSON<CurrentUser>(`${gatewayBaseUrl}/api/v1/auth/me`)
}

export async function verifyDiplomaByLookup(payload: VerificationLookupRequest) {
  return requestJSON<VerificationResult>(`${gatewayBaseUrl}/api/v1/public/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function verifyDiplomaByToken(verificationToken: string) {
  return requestJSON<VerificationResult>(`${gatewayBaseUrl}/api/v1/public/verify/${encodeURIComponent(verificationToken)}`)
}

export async function resolveShareLink(shareToken: string) {
  return requestJSON<VerificationResult>(`${gatewayBaseUrl}/api/v1/public/share-links/${encodeURIComponent(shareToken)}`)
}

export async function getBackendStatus(): Promise<BackendStatus> {
  const [gateway, registry] = await Promise.allSettled([
    requestText(`${gatewayBaseUrl}/healthz`),
    registryBaseUrl ? requestText(`${registryBaseUrl}/actuator/health`) : Promise.reject(new Error('registry unavailable')),
  ])

  return {
    gateway: gateway.status === 'fulfilled' ? 'up' : 'down',
    registry: registry.status === 'fulfilled' ? 'up' : 'down',
  }
}

export async function listUniversityDiplomas(page = 1) {
  const query = new URLSearchParams({ page: String(Math.max(1, page)) })
  return authedRequestJSON<UniversityDiplomaList>(`${gatewayBaseUrl}/api/v1/university/diplomas?${query.toString()}`)
}

export async function createUniversityImport(file: File) {
  const formData = new FormData()
  formData.set('file', file)
  return authedRequestJSON<ImportAccepted>(`${gatewayBaseUrl}/api/v1/university/diplomas/upload`, {
    method: 'POST',
    body: formData,
  })
}

export async function getImportStatus(jobId: string) {
  return authedRequestJSON<ImportJob>(`${gatewayBaseUrl}/api/v1/university/imports/${encodeURIComponent(jobId)}`)
}

export async function getImportErrors(jobId: string) {
  return authedRequestJSON<ImportJobErrorsResponse>(`${gatewayBaseUrl}/api/v1/university/imports/${encodeURIComponent(jobId)}/errors`)
}

export async function revokeUniversityDiploma(diplomaId: string, reason: RevokeDiplomaRequest['reason']) {
  return authedRequestJSON<UniversityDiploma>(`${gatewayBaseUrl}/api/v1/university/diplomas/${encodeURIComponent(diplomaId)}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason } satisfies RevokeDiplomaRequest),
  })
}

export async function getUniversityQr(diplomaId: string) {
  return authedRequestJSON<QrResponse>(`${gatewayBaseUrl}/api/v1/university/diplomas/${encodeURIComponent(diplomaId)}/qr`)
}

export async function getStudentDiploma() {
  return authedRequestJSON<StudentDiploma>(`${gatewayBaseUrl}/api/v1/student/diploma`)
}

export async function createStudentShareLink(ttlSeconds: ShareLinkRequest['ttlSeconds'] = 86400) {
  return authedRequestJSON<ShareLink>(`${gatewayBaseUrl}/api/v1/student/share-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttlSeconds } satisfies ShareLinkRequest),
  })
}

export async function revokeStudentShareLink(token: string) {
  return authedRequestJSON<unknown>(`${gatewayBaseUrl}/api/v1/student/share-link/${encodeURIComponent(token)}`, {
    method: 'DELETE',
  })
}

async function authedRequestJSON<T>(input: string, init?: RequestInit): Promise<T> {
  return requestJSON<T>(input, withAuth(init))
}

async function requestJSON<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok) {
    throw new Error(await buildErrorMessage(response))
  }
  return (await response.json()) as T
}

async function requestText(input: string, init?: RequestInit): Promise<string> {
  const response = await fetch(input, init)
  if (!response.ok) {
    throw new Error(await buildErrorMessage(response))
  }
  return response.text()
}

async function buildErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string }
    if (payload?.error) {
      return payload.error
    }
  } catch {
    // ignore json decode errors and fall back to status text
  }
  return response.statusText || `request failed with status ${response.status}`
}

function withAuth(init?: RequestInit): RequestInit | undefined {
  const headers = new Headers(init?.headers ?? undefined)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return {
    ...init,
    headers,
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}
