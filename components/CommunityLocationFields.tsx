'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { PLACES_COUNTRIES } from '@/lib/countries'

interface Prediction { placeId: string; main: string; secondary: string }

/** Pull a human "area" (e.g. "Yaba, Lagos") out of Google address components. */
function areaFromComponents(components: any[]): string {
  const get = (type: string) =>
    components.find((c) => c.types?.includes(type))?.long_name as string | undefined

  const local =
    get('neighborhood') ?? get('sublocality_level_1') ?? get('sublocality')
  const city = get('locality') ?? get('administrative_area_level_2')
  const state = get('administrative_area_level_1')

  const parts = [local, city ?? state].filter(Boolean)
  // Avoid "Lagos, Lagos" style duplicates.
  return Array.from(new Set(parts)).join(', ')
}

/** Address autocomplete + auto-filled (still editable) area, submitted as form fields. */
export default function CommunityLocationFields({
  addressName = 'address',
  areaName = 'area',
  country = PLACES_COUNTRIES,
  defaultAddress = '',
  defaultArea = '',
}: {
  addressName?: string
  areaName?: string
  country?: string | string[]
  defaultAddress?: string
  defaultArea?: string
}) {
  const [address, setAddress] = useState(defaultAddress)
  const [area, setArea] = useState(defaultArea)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [open, setOpen] = useState(false)
  const [warn, setWarn] = useState('')

  const svc = useRef<any>(null)
  const places = useRef<any>(null)
  const token = useRef<any>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadGoogleMaps()
      .then((g) => {
        svc.current = new g.maps.places.AutocompleteService()
        places.current = new g.maps.places.PlacesService(document.createElement('div'))
        token.current = new g.maps.places.AutocompleteSessionToken()
      })
      .catch(() => setWarn('Address suggestions are unavailable, you can still type the address manually.'))
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const query = (input: string) => {
    if (!svc.current || input.trim().length < 2) { setPredictions([]); return }
    svc.current.getPlacePredictions(
      { input, sessionToken: token.current, componentRestrictions: country ? { country } : undefined },
      (res: any[] | null, status: string) => {
        if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
          setWarn(`Google Places error: ${status}`)
        }
        setPredictions((res ?? []).map((p) => ({
          placeId: p.place_id,
          main: p.structured_formatting?.main_text ?? p.description,
          secondary: p.structured_formatting?.secondary_text ?? '',
        })))
      }
    )
  }

  const handleInput = (text: string) => {
    setAddress(text)
    setOpen(true)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => query(text), 250)
  }

  const select = (p: Prediction) => {
    setOpen(false)
    setPredictions([])
    if (!places.current) { setAddress(p.secondary ? `${p.main}, ${p.secondary}` : p.main); return }
    places.current.getDetails(
      { placeId: p.placeId, fields: ['formatted_address', 'address_components'], sessionToken: token.current },
      (place: any, status: string) => {
        const g = (window as any).google
        token.current = new g.maps.places.AutocompleteSessionToken()
        if (status === 'OK' && place) {
          setAddress(place.formatted_address ?? p.main)
          const a = areaFromComponents(place.address_components ?? [])
          if (a) setArea(a)
        } else {
          setAddress(p.secondary ? `${p.main}, ${p.secondary}` : p.main)
        }
      }
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div ref={boxRef} className="relative">
        <label className="block text-sm font-medium mb-1.5">Address</label>
        <input
          type="text"
          name={addressName}
          value={address}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => address.length >= 2 && predictions.length > 0 && setOpen(true)}
          placeholder="Start typing an address…"
          autoComplete="off"
          className="field"
        />

        {open && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-md shadow-lg z-30 overflow-hidden max-h-72 overflow-y-auto">
            {predictions.map((p) => (
              <button
                key={p.placeId}
                type="button"
                onClick={() => select(p)}
                className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-subtle/60 transition-colors border-b border-border last:border-0"
              >
                <svg className="w-4 h-4 text-secondary mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-primary truncate">{p.main}</span>
                  {p.secondary && <span className="block text-xs text-secondary truncate">{p.secondary}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {warn && <p className="text-xs text-amber-600 mt-1.5">{warn}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Area</label>
        <input
          type="text"
          name={areaName}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Yaba, Lagos."
          className="field"
        />
        <p className="text-xs text-secondary mt-1.5">Filled from the address, edit if needed.</p>
      </div>
    </div>
  )
}
