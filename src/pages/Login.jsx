import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userApi } from '../Data/ConexionUser'
import { documentoApi } from '../Data/ConexionBoletas'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from "jwt-decode"

function Login({ onLogin }) {
    const navigate = useNavigate()
    const [usuarioActual, setUsuarioActual] = useState(null)
    const [historialDetallado, setHistorialDetallado] = useState([])
    const [cargandoHistorial, setCargandoHistorial] = useState(false)

    const [formData, setFormData] = useState({
        correo: '',
        password: ''
    })
    const [errors, setErrors] = useState({})
    const [mensajeExito, setMensajeExito] = useState(false)

    // Al cargar el componente, traemos el usuario fresco de PostgreSQL y las boletas de MongoDB
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const guardado = localStorage.getItem('usuarioLogueado')
                if (guardado) {
                    const usuarioLocal = JSON.parse(guardado)
                    const email = usuarioLocal.email || usuarioLocal.correo

                    if (email) {
                        setCargandoHistorial(true)
                        
                        // 1. Obtenemos el usuario fresco desde PostgreSQL
                        const usuarioFresquito = await userApi.getUserByEmail(email)
                        setUsuarioActual(usuarioFresquito)
                        localStorage.setItem('usuarioLogueado', JSON.stringify(usuarioFresquito))

                        // 2. Traemos TODAS las boletas/documentos de MongoDB
                        const todasLasBoletas = await documentoApi.listarDocumentos()
                        
                        // 3. Filtramos solo aquellas boletas cuyos tickets pertenezcan al historial del usuario
                        const ticketsUsuario = usuarioFresquito.historialCompras || []
                        
                        const boletasDelUsuario = todasLasBoletas.filter(doc => {
                            const ticketDoc = doc.tikect || doc._id
                            return ticketsUsuario.includes(ticketDoc)
                        })

                        setHistorialDetallado(boletasDelUsuario)
                    }
                }
            } catch (e) {
                console.error("Error al sincronizar el usuario o las boletas:", e)
            } finally {
                setCargandoHistorial(false)
            }
        }

        cargarDatosUsuario()
    }, [])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        let nuevosErrores = {}

        if (!formData.correo.trim()) {
            nuevosErrores.correo = 'El correo es requerido.'
        }
        if (!formData.password) {
            nuevosErrores.password = 'La contraseña es requerida.'
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrors(nuevosErrores)
            setMensajeExito(false)
            return
        }

        try {
            const resultado = await userApi.login(formData.correo, formData.password)
            const usuarrio = await userApi.getUserByEmail(formData.correo)
            
            if (resultado) {
                const esAdmin = usuarrio.rol === 'administrador'

                setMensajeExito(true)
                setErrors({})
                
                localStorage.setItem('usuarioLogueado', JSON.stringify(usuarrio))
                setUsuarioActual(usuarrio)

                if (onLogin) {
                    onLogin(usuarrio)
                }
                
                setTimeout(() => {
                    if (esAdmin) {
                        navigate('/admin')
                    } else {
                        navigate('/')
                    }
                }, 1500)
            } else {
                setErrors({ correo: 'Correo o contraseña incorrectos.' })
                setMensajeExito(false)
            }
        } catch (error) {
            console.error("Error en el login:", error)
            setErrors({ correo: 'Correo o contraseña incorrectos, o el usuario no está registrado.' })
            setMensajeExito(false)
        }
    }

    // 2. Función para manejar el login exitoso con Google
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential)
            const correoGoogle = decoded.email

            // Buscamos si el correo de Google existe en tu base de datos
            const usuarrio = await userApi.getUserByEmail(correoGoogle)

            if (usuarrio) {
                const esAdmin = usuarrio.rol === 'administrador'
                setMensajeExito(true)
                setErrors({})
                
                localStorage.setItem('usuarioLogueado', JSON.stringify(usuarrio))
                setUsuarioActual(usuarrio)

                if (onLogin) {
                    onLogin(usuarrio)
                }
                
                setTimeout(() => {
                    if (esAdmin) {
                        navigate('/admin')
                    } else {
                        navigate('/')
                    }
                }, 1500)
            } else {
                // Si Google nos da OK pero el correo no está en tu DB
                setErrors({ correo: 'Este correo de Google no está registrado en nuestro sistema. Por favor, regístrate primero.' })
                setMensajeExito(false)
            }
        } catch (error) {
            console.error("Error validando el usuario de Google en la base de datos:", error)
            setErrors({ correo: 'Error al iniciar sesión con Google. ¿El usuario está registrado?' })
            setMensajeExito(false)
        }
    }

    const handleCerrarSesion = () => {
        localStorage.removeItem('usuarioLogueado')
        setUsuarioActual(null)
        setHistorialDetallado([])
        if (onLogin) {
            onLogin(null)
        }
        navigate('/Login')
    }

    const formatear = (valor) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor || 0)
    }

    // SI YA HAY UN USUARIO LOGUEADO, MOSTRAMOS SU PANEL
    if (usuarioActual) {
        const listaTickets = usuarioActual.historialCompras || []

        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-10 col-lg-8">
                        <div className="card shadow-lg border-secondary p-4" style={{ backgroundColor: '#fce4ec' }}>
                            <div className="d-flex align-items-center mb-4 border-bottom pb-3 border-secondary-subtle">
                                <div>
                                    <h3 className="text-dark fw-bold mb-1">¡Hola, {usuarioActual.nombre || 'Usuario'}!</h3>
                                    <p className="text-muted mb-0 small">Sesión activa: {usuarioActual.email || usuarioActual.correo}</p>
                                </div>
                                <button 
                                    onClick={handleCerrarSesion}
                                    className="btn btn-danger fw-bold ms-auto px-4 py-2"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>

                            <h5 className="fw-bold text-dark mb-3">🛍️ Tus Boletas e Historial de Compras</h5>
                            
                            {cargandoHistorial ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-dark" role="status">
                                        <span className="visually-hidden">Cargando historial...</span>
                                    </div>
                                    <p className="small text-muted mt-2">Buscando tus boletas en el sistema...</p>
                                </div>
                            ) : listaTickets.length > 0 ? (
                                <div className="accordion shadow-sm" id="accordionHistorial">
                                    {listaTickets.map((idTicket, index) => {
                                        const boletaMatcheada = historialDetallado.find(
                                            b => (b.tikect && b.tikect === idTicket) || (b._id && b._id === idTicket)
                                        )

                                        const productos = boletaMatcheada?.productos || []
                                        const totalCompra = boletaMatcheada?.total || 0

                                        return (
                                            <div className="accordion-item border-secondary mb-2" key={index}>
                                                <h2 className="accordion-header" id={`heading-${index}`}>
                                                    <button 
                                                        className="accordion-button collapsed fw-bold text-dark" 
                                                        type="button" 
                                                        data-bs-toggle="collapse" 
                                                        data-bs-target={`#collapse-${index}`} 
                                                        aria-expanded="false" 
                                                        aria-controls={`collapse-${index}`}
                                                        style={{ backgroundColor: '#fff0f3' }}
                                                    >
                                                        <div className="d-flex justify-content-between w-100 pe-3 align-items-center">
                                                            <span>🎫 Ticket N°: <span className="text-primary">{idTicket}</span></span>
                                                            <span className="badge bg-dark text-white px-3 py-2">Total: {formatear(totalCompra)}</span>
                                                        </div>
                                                    </button>
                                                </h2>
                                                <div 
                                                    id={`collapse-${index}`} 
                                                    className="accordion-collapse collapse" 
                                                    aria-labelledby={`heading-${index}`} 
                                                    data-bs-parent="#accordionHistorial"
                                                >
                                                    <div className="accordion-body bg-white">
                                                        <h6 className="fw-bold text-secondary mb-3">📦 Productos adquiridos:</h6>
                                                        {productos.length > 0 ? (
                                                            <div className="table-responsive">
                                                                <table className="table table-sm table-bordered align-middle">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th>Producto</th>
                                                                            <th>Categoría</th>
                                                                            <th className="text-center">Cantidad</th>
                                                                            <th className="text-end">Precio Unit.</th>
                                                                            <th className="text-end">total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {productos.map((prod, pIndex) => (
                                                                            <tr key={pIndex}>
                                                                                <td className="fw-semibold">{prod.nombre}</td>
                                                                                <td><span className="badge bg-secondary">{prod.categoria}</span></td>
                                                                                <td className="text-center">{prod.cantidad}</td>
                                                                                <td className="text-end">{formatear(prod.precioU)}</td>
                                                                                <td className="text-end fw-bold">{formatear(prod.cantidad * prod.precioU)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="alert alert-warning small mb-0">
                                                                No se encontró el detalle de productos para esta boleta.
                                                            </div>
                                                        )}
                                                        <div className="d-flex justify-content-end mt-2">
                                                            <span className="fw-bold text-dark">Monto Pagado Total: {formatear(totalCompra)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="alert alert-info text-center mb-0">
                                    Aún no tienes compras registradas en tu historial. ¡Anímate a explorar la tienda!
                                </div>
                            )}

                            <div className="text-center mt-4">
                                <button 
                                    onClick={() => navigate('/')} 
                                    className="btn text-white fw-bold px-4 py-2"
                                    style={{ backgroundColor: '#5d4037' }}
                                >
                                    Ir a la Tienda
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // SI NO ESTÁ LOGUEADO, MOSTRAMOS EL FORMULARIO NORMAL
    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6 text-center">
                    
                    <div className="mb-3 d-flex justify-content-center">
                        <img 
                            src="/img/logoPAGINA.jpg"
                            alt="Logo AnimeWord"
                            className="rounded-circle shadow-sm"
                            style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                        />
                    </div>
                    
                    <h3 className="text-dark fw-bold mb-4">AnimeWord</h3>

                    <div className="card shadow-lg border-secondary text-start" style={{ backgroundColor: '#fce4ec' }}>
                        
                        <div className="card-header text-white fw-bold border-secondary py-2 text-uppercase" style={{ backgroundColor: '#5d4037' }}>
                            inicio de sesión
                        </div>

                        <div className="card-body p-4">
                            {mensajeExito && (
                                <div className="alert alert-success text-center" role="alert">
                                    ¡Inicio de sesión exitoso! Redirigiendo...
                                </div>
                            )}
                            
                            {errors.correo && typeof errors.correo === 'string' && errors.correo.includes('Google') && (
                                <div className="alert alert-danger text-center" role="alert">
                                    {errors.correo}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate>
                                
                                <div className="mb-3">
                                    <label className="form-label text-uppercase small fw-bold" style={{ color: '#5d4037' }}>Correo</label>
                                    <input 
                                        type="email" 
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        className={`form-control border-secondary ${errors.correo ? 'is-invalid' : ''}`}
                                        placeholder="ejemplo@duoc.cl"
                                    />
                                    {errors.correo && !errors.correo.includes('Google') && <div className="invalid-feedback">{errors.correo}</div>}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-uppercase small fw-bold" style={{ color: '#5d4037' }}>Contraseña</label>
                                    <input 
                                        type="password" 
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`form-control border-secondary ${errors.password ? 'is-invalid' : ''}`}
                                        placeholder="Tu contraseña"
                                    />
                                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                </div>

                                <div className="d-flex justify-content-center mb-3">
                                    <button 
                                        type="submit" 
                                        className="btn text-white fw-bold px-5 py-2 w-50" 
                                        style={{ backgroundColor: '#5d4037', border: '1px solid #fce4ec' }}
                                    >
                                        Iniciar sesión
                                    </button>
                                </div>
                                
                                {/* 3. Separador visual y Botón de Google */}
                                <div className="d-flex align-items-center my-3">
                                    <hr className="flex-grow-1 border-secondary" />
                                    <span className="mx-2 text-muted small fw-bold">O INGRESA CON</span>
                                    <hr className="flex-grow-1 border-secondary" />
                                </div>
                                
                                <div className="d-flex justify-content-center mb-3">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => {
                                            setErrors({ correo: 'Error de comunicación con Google.' })
                                        }}
                                        theme="filled_blue"
                                        shape="pill"
                                        text="signin_with"
                                    />
                                </div>

                                <div className="text-center mt-4 border-top pt-3 border-secondary-subtle">
                                    <p className="small mb-1 text-muted">¿No tienes una cuenta todavía?</p>
                                    <Link to="/Registro" className="fw-bold text-decoration-none" style={{ color: '#5d4037' }}>
                                        Regístrate aquí
                                    </Link>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login