import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { noticiaApi } from '../Data/ConexionBlog'

const FORM_INICIAL = {
  titulo: '',
  slug: '',
  resumen: '',
  imagenPortada: '',
  categoria: 'Novedades',
  autor: 'Equipo AnimeWord',
  destacado: false
}

const SECCION_INICIAL = { tipo: 'parrafo', contenido: '', caption: '' }

function generarSlug(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function GestionNoticias() {
  const navigate = useNavigate()

  const [noticias, setNoticias] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [tarjetaForm, setTarjetaForm] = useState({ ...FORM_INICIAL })
  const [introduccion, setIntroduccion] = useState('')
  const [secciones, setSecciones] = useState([{ ...SECCION_INICIAL }])

  const cargarNoticias = async () => {
    try {
      setLoading(true)
      setError('')
      const datos = await noticiaApi.getNoticias()
      setNoticias(Array.isArray(datos) ? datos : [])
    } catch (err) {
      console.error('Error al cargar noticias:', err)
      setError(err.message || 'No fue posible cargar las noticias.')
      setNoticias([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarNoticias()
  }, [])

  const cambiarTitulo = (e) => {
    const titulo = e.target.value
    setTarjetaForm((actual) => ({
      ...actual,
      titulo,
      slug: generarSlug(titulo)
    }))
  }

  const cambiarTarjeta = (campo, valor) => {
    setTarjetaForm((actual) => ({ ...actual, [campo]: valor }))
  }

  const agregarSeccion = (tipo) => {
    setSecciones((actuales) => [
      ...actuales,
      { tipo, contenido: '', caption: '' }
    ])
  }

  const cambiarSeccion = (indice, campo, valor) => {
    setSecciones((actuales) =>
      actuales.map((seccion, i) =>
        i === indice ? { ...seccion, [campo]: valor } : seccion
      )
    )
  }

  const eliminarSeccion = (indice) => {
    if (secciones.length === 1) {
      alert('El artículo debe tener al menos una sección.')
      return
    }
    setSecciones((actuales) => actuales.filter((_, i) => i !== indice))
  }

  const seleccionarNoticia = (noticia) => {
    setSeleccionada(noticia)
    setTarjetaForm({
      titulo: noticia.tarjeta?.titulo || '',
      slug: noticia.tarjeta?.slug || '',
      resumen: noticia.tarjeta?.resumen || '',
      imagenPortada: noticia.tarjeta?.imagenPortada || '',
      categoria: noticia.tarjeta?.categoria || 'Novedades',
      autor: noticia.tarjeta?.autor || 'Equipo AnimeWord',
      destacado: Boolean(noticia.tarjeta?.destacado)
    })
    setIntroduccion(noticia.articulo?.introduccion || '')
    setSecciones(
      noticia.articulo?.secciones?.length
        ? noticia.articulo.secciones.map((seccion) => ({
            tipo: seccion.tipo || 'parrafo',
            contenido: seccion.contenido || '',
            caption: seccion.caption || ''
          }))
        : [{ ...SECCION_INICIAL }]
    )
    setError('')
  }

  const limpiarFormulario = () => {
    setSeleccionada(null)
    setTarjetaForm({ ...FORM_INICIAL })
    setIntroduccion('')
    setSecciones([{ ...SECCION_INICIAL }])
    setError('')
  }

  const guardarNoticia = async (e) => {
    e.preventDefault()
    setError('')

    if (!tarjetaForm.titulo.trim() || !tarjetaForm.slug.trim()) {
      setError('El título de la noticia es obligatorio.')
      return
    }

    if (!tarjetaForm.imagenPortada.trim()) {
      setError('Ingresa la URL de la imagen de portada.')
      return
    }

    const payloadDTO = {
      tarjeta: {
        ...tarjetaForm,
        titulo: tarjetaForm.titulo.trim(),
        slug: tarjetaForm.slug.trim()
      },
      articulo: {
        introduccion,
        secciones: secciones
          .filter((seccion) => seccion.contenido.trim() !== '')
          .map((seccion) => ({
            ...seccion,
            tipo: seccion.tipo.toLowerCase()
          }))
      }
    }

    try {
      setGuardando(true)

      if (seleccionada) {
        await noticiaApi.updateNoticia(seleccionada.id, payloadDTO)
        alert('¡Noticia actualizada con éxito!')
      } else {
        await noticiaApi.createNoticia(payloadDTO)
        alert('¡Noticia publicada con éxito!')
      }

      await cargarNoticias()
      limpiarFormulario()
    } catch (err) {
      console.error('Error al guardar la noticia:', err)
      setError(err.message || 'No se pudo guardar la noticia.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarNoticia = async () => {
    if (!seleccionada) return

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la noticia "${seleccionada.tarjeta?.titulo}"?`
    )
    if (!confirmar) return

    try {
      setGuardando(true)
      await noticiaApi.deleteNoticia(seleccionada.id)
      alert('¡Noticia eliminada correctamente!')
      await cargarNoticias()
      limpiarFormulario()
    } catch (err) {
      console.error('Error al eliminar noticia:', err)
      setError(err.message || 'No se pudo eliminar la noticia.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h2 className="fw-bold mb-0" style={{ color: '#5d4037' }}>
          Panel de Administración: Noticias & Blog
        </h2>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{ backgroundColor: '#fff', borderColor: '#5d4037', color: '#5d4037' }}
        >
          Volver al Admin Home
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0">
            <div
              className="card-header text-white d-flex justify-content-between align-items-center"
              style={{ backgroundColor: '#5d4037' }}
            >
              <span className="fw-bold text-uppercase">
                Publicaciones ({noticias.length})
              </span>
              <button
                type="button"
                className="btn btn-sm btn-light text-dark fw-bold"
                onClick={limpiarFormulario}
              >
                + Nueva Noticia
              </button>
            </div>

            <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center py-4 text-muted">Cargando noticias...</div>
              ) : noticias.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No hay publicaciones registradas.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {noticias.map((item) => {
                    const seleccionadaActual = seleccionada?.id === item.id
                    const imagen = item.tarjeta?.imagenPortada

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => seleccionarNoticia(item)}
                        className={`list-group-item list-group-item-action p-3 ${
                          seleccionadaActual
                            ? 'bg-light border-start border-4 border-danger'
                            : ''
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {imagen ? (
                            <img
                              src={imagen}
                              alt="Portada"
                              style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                          ) : (
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center"
                              style={{ width: '60px', height: '60px' }}
                            >
                              Sin imagen
                            </div>
                          )}
                          <div className="text-start">
                            <span className="badge bg-secondary mb-1">
                              {item.tarjeta?.categoria || 'Blog'}
                            </span>
                            <h6
                              className="mb-0 fw-bold text-truncate"
                              style={{ maxWidth: '220px' }}
                            >
                              {item.tarjeta?.titulo || 'Sin título'}
                            </h6>
                            <small className="text-muted">
                              {item.tarjeta?.autor || 'Equipo AnimeWord'}
                            </small>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0" style={{ backgroundColor: '#fce4ec' }}>
            <div
              className="card-header text-white fw-bold py-2 text-uppercase"
              style={{ backgroundColor: '#5d4037' }}
            >
              {seleccionada ? 'Editar Publicación' : 'Crear Nueva Publicación'}
            </div>

            <div className="card-body">
              <form onSubmit={guardarNoticia}>
                <h5 className="fw-bold mb-3" style={{ color: '#5d4037' }}>
                  1. Datos de la Tarjeta
                </h5>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Título de la noticia</label>
                  <input
                    type="text"
                    value={tarjetaForm.titulo}
                    onChange={cambiarTitulo}
                    className="form-control border-secondary"
                    placeholder="Ej: La vitrina de Carlos..."
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Slug</label>
                  <input
                    type="text"
                    value={tarjetaForm.slug}
                    onChange={(e) => cambiarTarjeta('slug', generarSlug(e.target.value))}
                    className="form-control border-secondary"
                    required
                  />
                  <small className="text-muted">
                    Se genera automáticamente a partir del título.
                  </small>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold">Categoría</label>
                    <select
                      value={tarjetaForm.categoria}
                      onChange={(e) => cambiarTarjeta('categoria', e.target.value)}
                      className="form-select border-secondary"
                    >
                      <option value="Novedades">Novedades</option>
                      <option value="Guías">Guías</option>
                      <option value="Comunidad">Comunidad</option>
                      <option value="Reseñas">Reseñas</option>
                      <option value="Coleccionismo">Coleccionismo</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-bold">Autor</label>
                    <input
                      type="text"
                      value={tarjetaForm.autor}
                      onChange={(e) => cambiarTarjeta('autor', e.target.value)}
                      className="form-control border-secondary"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">URL de imagen de portada</label>
                  <input
                    type="url"
                    value={tarjetaForm.imagenPortada}
                    onChange={(e) => cambiarTarjeta('imagenPortada', e.target.value)}
                    className="form-control border-secondary"
                    placeholder="https://..."
                    required
                  />
                  {tarjetaForm.imagenPortada && (
                    <img
                      src={tarjetaForm.imagenPortada}
                      alt="Vista previa de portada"
                      className="mt-2 rounded border"
                      style={{ maxWidth: '150px', maxHeight: '120px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                      onLoad={(e) => { e.currentTarget.style.display = 'block' }}
                    />
                  )}
                  <small className="text-muted d-block mt-1">
                    Por ahora se utiliza una URL. La subida de archivos desde el computador
                    se incorporará cuando creemos el endpoint de imágenes en Spring Boot.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Resumen corto</label>
                  <textarea
                    value={tarjetaForm.resumen}
                    onChange={(e) => cambiarTarjeta('resumen', e.target.value)}
                    className="form-control border-secondary"
                    rows="2"
                    placeholder="Breve vista previa para el listado..."
                    required
                  />
                </div>

                <div className="form-check form-switch mb-4">
                  <input
                    id="noticiaDestacada"
                    type="checkbox"
                    checked={tarjetaForm.destacado}
                    onChange={(e) => cambiarTarjeta('destacado', e.target.checked)}
                    className="form-check-input"
                  />
                  <label className="form-check-label fw-bold" htmlFor="noticiaDestacada">
                    Mostrar como noticia destacada
                  </label>
                </div>

                <hr className="my-4" />

                <h5 className="fw-bold mb-3" style={{ color: '#5d4037' }}>
                  2. Cuerpo del artículo
                </h5>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Introducción</label>
                  <textarea
                    value={introduccion}
                    onChange={(e) => setIntroduccion(e.target.value)}
                    className="form-control border-secondary"
                    rows="3"
                    placeholder="Párrafo introductorio..."
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <label className="form-label small fw-bold mb-0">
                      Bloques de contenido
                    </label>
                    <div className="btn-group btn-group-sm">
                      <button type="button" className="btn btn-outline-dark" onClick={() => agregarSeccion('parrafo')}>
                        + Párrafo
                      </button>
                      <button type="button" className="btn btn-outline-dark" onClick={() => agregarSeccion('subtitulo')}>
                        + Subtítulo
                      </button>
                      <button type="button" className="btn btn-outline-dark" onClick={() => agregarSeccion('imagen')}>
                        + Imagen
                      </button>
                    </div>
                  </div>

                  {secciones.map((seccion, indice) => (
                    <div key={indice} className="card p-2 mb-2 border-secondary bg-white">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-dark text-uppercase">
                          {seccion.tipo} #{indice + 1}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-2 fw-bold"
                          onClick={() => eliminarSeccion(indice)}
                        >
                          Eliminar
                        </button>
                      </div>

                      {seccion.tipo === 'imagen' ? (
                        <>
                          <label className="form-label small">URL de la imagen</label>
                          <input
                            type="url"
                            value={seccion.contenido}
                            onChange={(e) => cambiarSeccion(indice, 'contenido', e.target.value)}
                            className="form-control form-control-sm border-secondary mb-2"
                            placeholder="https://..."
                          />
                          {seccion.contenido && (
                            <img
                              src={seccion.contenido}
                              alt={seccion.caption || 'Imagen del artículo'}
                              className="img-fluid rounded mb-2"
                              style={{ maxHeight: '180px', objectFit: 'contain' }}
                            />
                          )}
                          <input
                            type="text"
                            value={seccion.caption || ''}
                            onChange={(e) => cambiarSeccion(indice, 'caption', e.target.value)}
                            className="form-control form-control-sm border-secondary"
                            placeholder="Pie de foto opcional..."
                          />
                        </>
                      ) : (
                        <textarea
                          value={seccion.contenido}
                          onChange={(e) => cambiarSeccion(indice, 'contenido', e.target.value)}
                          className="form-control form-control-sm border-secondary"
                          rows={seccion.tipo === 'parrafo' ? 3 : 1}
                          placeholder={
                            seccion.tipo === 'parrafo'
                              ? 'Escribe el párrafo...'
                              : 'Escribe el subtítulo...'
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="btn text-white fw-bold py-2"
                    style={{ backgroundColor: '#5d4037' }}
                  >
                    {guardando
                      ? 'Guardando...'
                      : seleccionada
                        ? 'Guardar cambios'
                        : 'Publicar noticia'}
                  </button>

                  {seleccionada && (
                    <>
                      <button
                        type="button"
                        disabled={guardando}
                        className="btn btn-danger fw-bold py-2"
                        onClick={eliminarNoticia}
                      >
                        Eliminar publicación
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={limpiarFormulario}
                      >
                        Cancelar selección
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GestionNoticias
