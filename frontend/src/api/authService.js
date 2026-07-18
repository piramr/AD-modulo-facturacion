const AUTH_TOKEN_KEY = 'facturacion-auth-token'
const AUTH_USER_KEY = 'facturacion-auth-user'
const SEGURIDAD_GRAPHQL_URL =
  import.meta.env.VITE_SEGURIDAD_GRAPHQL_URL || 'https://proyecto-moduloseguridad.onrender.com/graphql'
const SEGURIDAD_API_URL = (
  import.meta.env.VITE_SEGURIDAD_API_URL ||
  SEGURIDAD_GRAPHQL_URL.replace(/\/graphql\/?$/, '')
).replace(/\/$/, '')

async function requestSeguridad(query, variables = {}, token = '') {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`

  const response = await fetch(SEGURIDAD_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'No fue posible comunicarse con Seguridad.')
  }
  return json.data
}

async function requestSeguridadRest(path, body) {
  const response = await fetch(`${SEGURIDAD_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'No fue posible completar la solicitud en Seguridad.')
  }

  return json
}

export function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

export function getStoredUser() {
  const raw = window.localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeSession({ token, user }) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  if (user) window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
}

export function isAuthenticated() {
  return Boolean(getStoredToken())
}

export async function login(username, password) {
  const mutation = `
    mutation FacturacionLogin($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        success
        token
        message
      }
    }
  `

  const data = await requestSeguridad(mutation, { username, password })
  const result = data?.login

  if (!result?.success || !result?.token) {
    throw new Error(result?.message || 'Credenciales invalidas.')
  }

  const user = await getCurrentUser(result.token).catch(() => ({
    userName: username,
    roles: [],
  }))

  storeSession({ token: result.token, user })
  return { token: result.token, user, message: result.message }
}

export async function getCurrentUser(token = getStoredToken()) {
  const query = `
    query FacturacionMe {
      me {
        id
        userName
        email
        cedula
        estado
        roles {
          idRol
          nombreRol
          estadoRol
          funciones {
            idFuncion
            nombreFuncion
            estadoFuncion
          }
        }
      }
    }
  `

  const data = await requestSeguridad(query, {}, token)
  return data?.me || null
}

export async function requestPasswordResetCode(email) {
  return requestSeguridadRest('/api/auth/forgot-password/', { email })
}

export async function resetPassword({ email, codigo, newPassword }) {
  return requestSeguridadRest('/api/auth/reset-password/', {
    email,
    codigo,
    new_password: newPassword,
  })
}
