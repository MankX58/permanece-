import { useAuth0 } from '@auth0/auth0-react'

export function useApi() {
  const { getIdTokenClaims } = useAuth0()

  async function api(ruta, metodo = 'GET', datos) {
    const sesion = await getIdTokenClaims()

    const respuesta = await fetch('/api' + ruta, {
      method: metodo,
      headers: {
        Authorization: 'Bearer ' + sesion.__raw,
        'Content-Type': 'application/json',
      },
      body: datos ? JSON.stringify(datos) : undefined,
    })

    if (respuesta.status === 401) {
      throw new Error('Tu sesión expiró. Cierra sesión y vuelve a entrar.')
    }

    let resultado = null
    try {
      resultado = await respuesta.json()
    } catch {
      resultado = null
    }

    if (!respuesta.ok) {
      throw new Error(resultado?.mensaje || 'No se pudo conectar con el servidor.')
    }

    return resultado
  }

  // Descarga un archivo del servidor (con la sesión del usuario) y lo guarda con el nombre que indica.
  api.descargar = async (ruta) => {
    const sesion = await getIdTokenClaims()
    const respuesta = await fetch('/api' + ruta, {
      headers: { Authorization: 'Bearer ' + sesion.__raw },
    })

    if (!respuesta.ok) {
      let mensaje = null
      try {
        mensaje = (await respuesta.json()).mensaje
      } catch {
        mensaje = null
      }
      throw new Error(mensaje || 'No se pudo descargar el archivo.')
    }

    const nombre = /filename="([^"]+)"/.exec(respuesta.headers.get('Content-Disposition') || '')?.[1] || 'informe.xlsx'
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(await respuesta.blob())
    enlace.download = nombre
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  return api
}
