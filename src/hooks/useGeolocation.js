import { useCallback, useEffect, useRef, useState } from 'react'
import { cities, defaultCity } from '../data/cities'

const KEY = 'tilawin-prayer-v2'

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStore(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

async function reverseGeocode(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ru`
  const response = await fetch(url)
  if (!response.ok) throw new Error('geocode failed')
  const data = await response.json()
  const city = data.city || data.locality || data.principalSubdivision
  if (city) return data.countryName ? `${city}` : city
  return 'Текущая локация'
}

function nearestCity(lat, lng) {
  let best = cities[0]
  let bestDist = Infinity
  for (const city of cities) {
    const d = (city.lat - lat) ** 2 + (city.lng - lng) ** 2
    if (d < bestDist) {
      bestDist = d
      best = city
    }
  }
  return best
}

export function useGeolocation() {
  const [state, setState] = useState(() => {
    const stored = readStore()
    if (stored.mode === 'city' && stored.cityId) {
      const city = cities.find((item) => item.id === stored.cityId) || defaultCity
      return {
        status: 'ready',
        mode: 'city',
        lat: city.lat,
        lng: city.lng,
        label: city.name,
        cityId: city.id,
        error: null,
      }
    }
    if (stored.mode === 'geo' && stored.lat && stored.lng) {
      return {
        status: 'locating',
        mode: 'geo',
        lat: stored.lat,
        lng: stored.lng,
        label: stored.label || 'Текущая локация',
        cityId: stored.cityId || defaultCity.id,
        error: null,
      }
    }
    return {
      status: 'locating',
      mode: 'geo',
      lat: defaultCity.lat,
      lng: defaultCity.lng,
      label: 'Определяем локацию…',
      cityId: defaultCity.id,
      error: null,
    }
  })

  const persist = useCallback((next) => {
    writeStore({
      mode: next.mode,
      lat: next.lat,
      lng: next.lng,
      label: next.label,
      cityId: next.cityId,
    })
  }, [])

  const ignoreGeoRef = useRef(false)

  const locate = useCallback(() => {
    ignoreGeoRef.current = false
    if (!navigator.geolocation) {
      const city = cities.find((item) => item.id === defaultCity.id) || defaultCity
      const next = {
        status: 'denied',
        mode: 'city',
        lat: city.lat,
        lng: city.lng,
        label: city.name,
        cityId: city.id,
        error: 'Геолокация недоступна',
      }
      setState(next)
      persist(next)
      return
    }

    setState((prev) => ({ ...prev, status: 'locating', error: null }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (ignoreGeoRef.current) return
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        let label = 'Текущая локация'
        try {
          label = await reverseGeocode(lat, lng)
        } catch {
          label = nearestCity(lat, lng).name
        }
        const next = {
          status: 'ready',
          mode: 'geo',
          lat,
          lng,
          label,
          cityId: nearestCity(lat, lng).id,
          error: null,
        }
        setState(next)
        persist(next)
      },
      () => {
        if (ignoreGeoRef.current) return
        setState((prev) => {
          const city = cities.find((item) => item.id === prev.cityId) || defaultCity
          const next = {
            status: 'denied',
            mode: 'city',
            lat: city.lat,
            lng: city.lng,
            label: city.name,
            cityId: city.id,
            error: 'Нет доступа к геолокации',
          }
          persist(next)
          return next
        })
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    )
  }, [persist])

  const selectCity = useCallback(
    (cityId) => {
      ignoreGeoRef.current = true
      const city = cities.find((item) => item.id === cityId) || defaultCity
      const next = {
        status: 'ready',
        mode: 'city',
        lat: city.lat,
        lng: city.lng,
        label: city.name,
        cityId: city.id,
        error: null,
      }
      setState(next)
      persist(next)
    },
    [persist],
  )

  useEffect(() => {
    locate()
    // Always prefer GPS on load; saved city is only a fallback if GPS is denied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ...state, locate, selectCity }
}
