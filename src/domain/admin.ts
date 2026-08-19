export const ADMIN_EMAIL = 'mattheus.l08@gmail.com'

export function canManageTeams(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL
}
