
import { useEffect, useState, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import TablaProductos, { formatear } from '../components/TablaProductos'

const API_URL = 'http://localhost:8080/api/ordenes'

function ResultadoPago({ onVaciarCarrito, usuarioLogueado }) {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [correoEnviado, setCorreoEnviado] = useState(false)
  const [ticketGenerado, setTicketGenerado] = useState('')
  const [estadoProceso, setEstadoProceso] = useState('procesando')
  const [errorProceso, setErrorProceso] = useState('')

  const procesadoRef = useRef(false)

  const cliente = state?.cliente || {}
  const tarjeta = state?.tarjeta || {}
  const items = state?.items || []
  const total = state?.total || 0
  const nroCompra = state?.nroCompra || ''

  // Comprobar si se ingresaron datos de tarjeta.
  const camposTarjeta = [
    tarjeta.numeroTarjeta,
    tarjeta.nombreTitular,
    tarjeta.rut,
    tarjeta.expiracion,
    tarjeta.cvv
  ]

  const tarjetaVacia = camposTarjeta.every(
    campo => !String(campo || '').trim()
  )

  const exito = !tarjetaVacia

  useEffect(() => {
    const procesarCompra = async () => {
      if (!state || !exito || procesadoRef.current) {
        return
      }

      procesadoRef.current = true

      try {
        // 1. Obtener el usuario que inició sesión.
        let usuarioActivo = usuarioLogueado

        if (!usuarioActivo) {
          const guardado = localStorage.getItem('usuarioLogueado')

          if (guardado) {
            try {
              usuarioActivo = JSON.parse(guardado)
            } catch {
              usuarioActivo = null
            }
          }
        }

        const usuarioId =
          usuarioActivo?.id ??
          usuarioActivo?.usuarioId ??
          usuarioActivo?.userId

        if (!usuarioId) {
          throw new Error(
            'No se pudo identificar al usuario. Cierra sesión e inicia sesión nuevamente.'
          )
        }

        // 2. Preparar los datos que espera Spring Boot.
        const datosEntrega = {
          nombreCliente: cliente.nombre || '',
          apellidoCliente: cliente.apellidos || '',
          correoCliente: cliente.correo || '',
          calle: cliente.calle || '',
          departamento: cliente.departamento || '',
          region: cliente.region || '',
          comuna: cliente.comuna || '',
          indicaciones: cliente.indicaciones || ''
        }

        // 3. Registrar la compra en Spring Boot.
        const respuesta = await fetch(
          `${API_URL}/usuario/${usuarioId}/checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEntrega)
          }
        )

        const texto = await respuesta.text()

        let orden = null

        try {
          orden = texto ? JSON.parse(texto) : null
        } catch {
          orden = null
        }

        if (!respuesta.ok) {
          throw new Error(
            typeof orden === 'string'
              ? orden
              : orden?.message ||
                texto ||
                'No se pudo registrar la compra.'
          )
        }

        if (!orden || !orden.id) {
          throw new Error(
            'El servidor respondió, pero no devolvió los datos de la orden.'
          )
        }

        // 4. Mostrar el código real generado por Spring Boot.
        setTicketGenerado(
          orden.codigoOrden || `ORDEN-${orden.id}`
        )

        // 5. Vaciar el carrito local después del checkout exitoso.
        onVaciarCarrito?.()

        setEstadoProceso('exito')

      } catch (error) {
        console.error('Error al registrar la compra:', error)

        setErrorProceso(
          error.message || 'Ocurrió un error al procesar la compra.'
        )

        setEstadoProceso('error')
      }
    }

    procesarCompra()
  }, [state, exito, usuarioLogueado, cliente, onVaciarCarrito])

  // Si alguien entra directamente sin los datos de compra.
  if (!state) {
    return <Navigate to="/" replace />
  }

  const dato = (label, valor) => (
    <div className="mb-2">
      <div className="fw-semibold">{label}</div>
      <div>{valor || '—'}</div>
    </div>
  )

  let usuarioEnPantalla = usuarioLogueado

  if (!usuarioEnPantalla) {
    try {
      const guardado = localStorage.getItem('usuarioLogueado')

      if (guardado) {
        usuarioEnPantalla = JSON.parse(guardado)
      }
    } catch {
      usuarioEnPantalla = null
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">

          <div
            className="card text-dark shadow-lg border-secondary p-4"
            style={{ backgroundColor: '#fce4ec' }}
          >

            {/* Compra sin datos de tarjeta */}
            {tarjetaVacia && (
              <div className="alert alert-danger">
                <h2 className="mb-1">
                  No se pudo realizar el pago.
                </h2>

                <p className="mb-0">
                  Los datos de la tarjeta estaban vacíos.
                  Tu carrito sigue guardado.
                </p>
              </div>
            )}

            {/* Compra en proceso */}
            {!tarjetaVacia && estadoProceso === 'procesando' && (
              <div className="alert alert-info">
                <h2 className="mb-1">
                  Procesando compra...
                </h2>

                <p className="mb-0">
                  Estamos registrando tu orden. No cierres esta página.
                </p>
              </div>
            )}

            {/* Compra registrada correctamente */}
            {estadoProceso === 'exito' && (
              <div className="alert alert-success">
                <h2 className="mb-1">
                  Ticket / N° Orden: {ticketGenerado}
                </h2>

                <p className="mb-0 fw-semibold">
                  Se ha registrado tu compra con éxito.
                  N° {nroCompra}
                </p>
              </div>
            )}

            {/* Error al registrar la compra */}
            {estadoProceso === 'error' && (
              <div className="alert alert-danger">
                <h2 className="mb-1">
                  No se pudo registrar tu compra.
                </h2>

                <p className="mb-0">
                  {errorProceso}
                </p>

                <p className="mt-2 mb-0">
                  No se ha vaciado tu carrito local.
                  Comprueba el estado de la orden antes de volver a intentarlo.
                </p>
              </div>
            )}

            {(tarjetaVacia || estadoProceso === 'error') && (
              <div className="mb-4 d-print-none">
                <button
                  className="btn btn-danger fw-bold px-4 py-2"
                  onClick={() =>
                    navigate('/carrito', {
                      state: { cliente }
                    })
                  }
                >
                  VOLVER AL CARRITO
                </button>
              </div>
            )}

            <div className="row mt-2">

              <div className="col-md-6">
                {dato('Nombre', cliente.nombre)}
                {dato('Apellidos', cliente.apellidos)}
                {dato('Correo', cliente.correo)}

                <div className="mb-2">
                  <div className="fw-semibold">
                    Estado de sesión
                  </div>

                  <div>
                    {usuarioEnPantalla
                      ? `Logueado como: ${usuarioEnPantalla.nombre || ''} (${usuarioEnPantalla.email || usuarioEnPantalla.correo || ''})`
                      : 'No logueado'}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <h5 className="fw-bold">
                  Dirección de entrega de los productos
                </h5>

                {dato('Calle', cliente.calle)}
                {dato('Departamento (opcional)', cliente.departamento)}
                {dato('Región', cliente.region)}
                {dato('Comuna', cliente.comuna)}
                {dato('Indicaciones', cliente.indicaciones)}
              </div>

            </div>

            <div className="mt-3">
              <TablaProductos items={items} />
            </div>

            <h3 className="fw-bold mt-4">
              {estadoProceso === 'exito'
                ? 'Total pagado:'
                : 'Total a pagar:'} {' '}
              {formatear(total)}
            </h3>

            {estadoProceso === 'exito' && (
              <div className="d-flex gap-2 mt-3 d-print-none">

                <button
                  className="btn btn-dark fw-bold"
                  onClick={() => window.print()}
                >
                  Imprimir boleta en PDF
                </button>

                <button
                  className="btn btn-outline-dark fw-bold"
                  onClick={() => setCorreoEnviado(true)}
                >
                  Enviar boleta por email
                </button>

                <button
                  className="btn btn-primary fw-bold ms-auto"
                  onClick={() => navigate('/')}
                >
                  Volver al Inicio
                </button>

              </div>
            )}

            {correoEnviado && estadoProceso === 'exito' && (
              <div className="alert alert-info mt-3 d-print-none">
                La función de envío por correo todavía no está conectada.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultadoPago
