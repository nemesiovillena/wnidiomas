// Payload API client for Astro
// This file provides helper functions to fetch data from Payload CMS

const PAYLOAD_API_URL = import.meta.env.PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000/api'

interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

/**
 * Fetch data from Payload CMS
 */
async function fetchPayload<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PAYLOAD_API_URL}/${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch from Payload: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get current locale from URL or default to 'es'
 */
function getCurrentLocale(): string {
  // El locale lo obtendremos de Astro en los componentes
  // Por defecto español
  return 'es'
}

/**
 * Get all documents from a collection
 */
export async function getAll<T>(collection: string, query: Record<string, any> = {}, locale?: string): Promise<T[]> {
  const params = new URLSearchParams()

  // Añadir locale si se proporciona
  if (locale) {
    params.append('locale', locale)
  }

  if (query.where) {
    params.append('where', JSON.stringify(query.where))
  }
  if (query.sort) {
    params.append('sort', query.sort)
  }
  if (query.limit) {
    params.append('limit', query.limit.toString())
  }
  if (query.depth) {
    params.append('depth', query.depth.toString())
  }

  const queryString = params.toString()
  const endpoint = `${collection}${queryString ? `?${queryString}` : ''}`

  const data = await fetchPayload<PayloadResponse<T>>(endpoint)
  return data.docs
}

/**
 * Get a single document by ID
 */
export async function getById<T>(collection: string, id: string, depth = 1, locale?: string): Promise<T> {
  const localeParam = locale ? `&locale=${locale}` : ''
  return fetchPayload<T>(`${collection}/${id}?depth=${depth}${localeParam}`)
}

/**
 * Get a single document by slug
 */
export async function getBySlug<T>(collection: string, slug: string, depth = 1, locale?: string): Promise<T | null> {
  const data = await getAll<T>(collection, {
    where: { slug: { equals: slug } },
    limit: 1,
    depth,
  }, locale)
  return data[0] || null
}

/**
 * Get a global singleton
 */
export async function getGlobal<T>(slug: string, depth = 1, locale?: string): Promise<T> {
  const localeParam = locale ? `&locale=${locale}` : ''
  return fetchPayload<T>(`globals/${slug}?depth=${depth}${localeParam}`)
}

// Specific helpers for common queries

export const getDishes = (active = true, locale?: string) =>
  getAll('platos', {
    where: active ? { activo: { equals: true } } : {},
    sort: 'orden',
    depth: 2,
  }, locale)

export const getDishesByCategory = (categoryId: string, active = true, locale?: string) =>
  getAll('platos', {
    where: {
      categoria: { equals: categoryId },
      ...(active ? { activo: { equals: true } } : {}),
    },
    sort: 'orden',
    depth: 2,
  }, locale)

export const getCategories = (active = true, locale?: string) =>
  getAll('categorias', {
    where: active ? { activa: { equals: true } } : {},
    sort: 'orden',
  }, locale)

export const getMenus = (active = true, locale?: string) =>
  getAll('menus', {
    where: active ? { activo: { equals: true } } : {},
    sort: 'orden',
    depth: 1,
  }, locale)

export const getSpaces = (active = true, locale?: string) =>
  getAll('espacios', {
    where: active ? { activo: { equals: true } } : {},
    sort: 'orden',
    depth: 1,
  }, locale)

export const getActiveBanners = (position?: string, locale?: string) => {
  const now = new Date().toISOString()
  const where: any = {
    activo: { equals: true },
    fechaInicio: { less_than_equal: now },
    fechaFin: { greater_than_equal: now },
  }

  if (position) {
    where.posicion = { equals: position }
  }

  return getAll('banners', {
    where,
    sort: '-prioridad',
    depth: 1,
  }, locale)
}

export const getHomepage = (locale?: string) => getGlobal('pagina-inicio', 2, locale)
export const getSiteSettings = (locale?: string) => getGlobal('configuracion-sitio', 1, locale)
