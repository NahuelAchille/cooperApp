// Distancia en kilometros entre dos puntos, "a vuelo de pajaro" (formula de
// Haversine). Es la que usa el buscador entre empresas para ordenar por
// cercania.
//
// Ojo: se mide entre los CENTROS de las localidades, que es lo unico que el
// sistema sabe de cada empresa. Sirve para ordenar de la mas cercana a la mas
// lejana; no es la distancia real de un local al otro, y dos empresas de la
// misma localidad dan 0.
//
// Devuelve null si falta alguno de los dos puntos: una empresa sin localidad
// cargada no esta "a 0 km", esta "sin ubicacion".

const RADIO_TIERRA_KM = 6371

const aRadianes = (grados) => grados * Math.PI / 180

const distanciaKm = (a, b) => {

  if (!a || !b) return null
  if ([a.latitud, a.longitud, b.latitud, b.longitud].some(v => v === null || v === undefined)) return null

  const lat1 = aRadianes(Number(a.latitud))
  const lat2 = aRadianes(Number(b.latitud))
  const dLat = lat2 - lat1
  const dLon = aRadianes(Number(b.longitud) - Number(a.longitud))

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  // Un decimal alcanza: es una distancia entre centros de localidades.
  return Math.round(2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h)) * 10) / 10
}

module.exports = { distanciaKm }
