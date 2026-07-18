export function normalizeRoles(user) {
  return (user?.roles || [])
    .map((rol) => {
      if (typeof rol === 'string') return rol
      return rol?.nombreRol || rol?.name || ''
    })
    .map((rol) => rol.toUpperCase())
    .filter(Boolean)
}

export function getRoleFlags(user) {
  const roles = normalizeRoles(user)
  const isAdmin = roles.some((rol) => rol.includes('ADMIN') || rol.includes('FAC_ADMIN'))
  const isCajero = roles.some((rol) => rol.includes('CAJERO') || rol.includes('FAC_CAJERO'))

  return { roles, isAdmin, isCajero, hasAnyRole: isAdmin || isCajero }
}
