export type VerificationVerdict = 'valid' | 'revoked' | 'expired' | 'not_found'

export const stats = [
  {
    label: 'Projected diplomas',
    value: '412,980',
    description: 'Read-model coverage across connected universities.',
  },
  {
    label: 'Share links today',
    value: '2,148',
    description: 'Student-to-employer links resolved through the gateway.',
  },
  {
    label: 'Propagation p95',
    value: '18s',
    description: 'Registry revoke events reaching the public contour.',
  },
]

export const importJobs = [
  { id: 'IMP-1049', university: 'ITMO', rows: '10,000', status: 'ready', startedAt: '11:10' },
  { id: 'IMP-1050', university: 'Bauman', rows: '4,200', status: 'processing', startedAt: '11:24' },
  { id: 'IMP-1051', university: 'MIPT', rows: '1,100', status: 'ready', startedAt: '11:38' },
] as const

export const diplomaRows = [
  {
    token: 'verify-9f4e',
    universityCode: 'ITMO',
    diplomaNumber: 'D-2026-0042',
    ownerNameMask: 'A*** S***',
    program: 'AI Systems Architecture',
    verdict: 'valid' as VerificationVerdict,
  },
  {
    token: 'verify-0c7d',
    universityCode: 'BMSTU',
    diplomaNumber: 'D-2024-1177',
    ownerNameMask: 'M*** P***',
    program: 'Embedded Platforms',
    verdict: 'revoked' as VerificationVerdict,
  },
]

export function getVerificationByToken(token?: string) {
  return diplomaRows.find((item) => item.token === token) ?? diplomaRows[0]
}

export function getShareVerification(token?: string) {
  if (token === 'expired-share') {
    return { ...diplomaRows[0], verdict: 'expired' as VerificationVerdict }
  }
  return diplomaRows[0]
}
