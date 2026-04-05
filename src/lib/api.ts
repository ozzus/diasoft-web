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

export type CurrentUser = PlatformComponents['schemas']['RegistryCurrentUser']
export type University = PlatformComponents['schemas']['RegistryUniversity']
export type ImportJob = PlatformComponents['schemas']['RegistryImportJob']
export type ImportJobError = PlatformComponents['schemas']['RegistryImportJobError']
export type RegistryDiploma = PlatformComponents['schemas']['RegistryDiploma']
export type RegistryDiplomaList = PlatformComponents['schemas']['RegistryDiplomaList']
export type ShareLink = PlatformComponents['schemas']['RegistryShareLink']
export type RevokeDiplomaRequest = PlatformComponents['schemas']['RegistryRevokeRequest']
export type ShareLinkRequest = PlatformComponents['schemas']['RegistryShareLinkRequest']

const gatewayBaseUrl = normalizeBaseUrl(readRuntimeConfig('VITE_GATEWAY_BASE_URL') ?? 'http://localhost:8080')
export const registryBaseUrl = normalizeBaseUrl(readRuntimeConfig('VITE_REGISTRY_BASE_URL') ?? 'http://localhost:8081')

let registryAccessToken: string | null = null

export function setRegistryAccessToken(token: string | null) {
  registryAccessToken = token
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

export async function getCurrentUser() {
  return registryRequestJSON<CurrentUser>(`${registryBaseUrl}/api/v1/me`)
}

export async function getBackendStatus(): Promise<BackendStatus> {
  const [gateway, registry] = await Promise.allSettled([
    requestText(`${gatewayBaseUrl}/healthz`),
    requestText(`${registryBaseUrl}/api/v1/ping`),
  ])

  return {
    gateway: gateway.status === 'fulfilled' ? 'up' : 'down',
    registry: registry.status === 'fulfilled' ? 'up' : 'down',
  }
}

export async function listUniversities() {
  return registryRequestJSON<University[]>(`${registryBaseUrl}/api/v1/universities`)
}

export async function listUniversityImportJobs(universityId: string) {
  return registryRequestJSON<ImportJob[]>(`${registryBaseUrl}/api/v1/universities/${encodeURIComponent(universityId)}/imports`)
}

export async function createUniversityImport(universityId: string, file: File) {
  const formData = new FormData()
  formData.set('file', file)
  return registryRequestJSON<ImportJob>(`${registryBaseUrl}/api/v1/universities/${encodeURIComponent(universityId)}/imports`, {
    method: 'POST',
    body: formData,
  })
}

export async function getImportErrors(importJobId: string) {
  return registryRequestJSON<ImportJobError[]>(`${registryBaseUrl}/api/v1/imports/${encodeURIComponent(importJobId)}/errors`)
}

type ListUniversityDiplomasParams = {
  page?: number
  universityId?: string
}

export async function listUniversityDiplomas(params: ListUniversityDiplomasParams = {}) {
  const query = new URLSearchParams()
  if (params.page && params.page > 0) {
    query.set('page', String(params.page))
  }
  if (params.universityId) {
    query.set('universityId', params.universityId)
  }

  const suffix = query.size ? `?${query.toString()}` : ''
  return registryRequestJSON<RegistryDiplomaList>(`${registryBaseUrl}/api/v1/university/diplomas${suffix}`)
}

export async function revokeUniversityDiploma(diplomaId: string, reason: RevokeDiplomaRequest['reason']) {
  return registryRequestJSON<RegistryDiploma>(
    `${registryBaseUrl}/api/v1/university/diplomas/${encodeURIComponent(diplomaId)}/revoke`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason } satisfies RevokeDiplomaRequest),
    },
  )
}

export async function listStudentDiplomas() {
  return registryRequestJSON<RegistryDiploma[]>(`${registryBaseUrl}/api/v1/student/diplomas`)
}

export async function createStudentShareLink(diplomaId: string, maxViews?: ShareLinkRequest['maxViews']) {
  const payload: ShareLinkRequest = maxViews ? { maxViews } : {}
  return registryRequestJSON<ShareLink>(
    `${registryBaseUrl}/api/v1/student/diplomas/${encodeURIComponent(diplomaId)}/share-links`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
}

async function registryRequestJSON<T>(input: string, init?: RequestInit): Promise<T> {
  return requestJSON<T>(input, withRegistryAuth(init))
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

function withRegistryAuth(init?: RequestInit): RequestInit | undefined {
  const headers = new Headers(init?.headers ?? undefined)
  if (registryAccessToken) {
    headers.set('Authorization', `Bearer ${registryAccessToken}`)
  }

  return {
    ...init,
    headers,
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}
