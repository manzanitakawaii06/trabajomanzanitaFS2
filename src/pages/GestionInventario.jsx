
import { useState, useEffect } from 'react'
import { productApi } from '../Data/ConexionProducto'
import {
  validarProducto,
  validarCategoria
} from '../validaciones/validacionesProductos'
import { useNavigate } from 'react-router-dom'

function GestionInventario() {
  const navigate = useNavigate()

  const [tabActiva, setTabActiva] = useState('productos')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])

  const [modoEdicionProd, setModoEdicionProd] = useState(false)
  const [idEditandoProd, setIdEditandoProd] = useState(null)

  const [formProducto, setFormProducto] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoria: '',
    cBarras: '',
    descripcion: '',
    imagen: ''
  })

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [nombreCategoria, setNombreCategoria] = useState('')
  const [nombreAnterior, setNombreAnterior] = useState('')

  // Cargar productos y categorías desde Spring Boot
  const cargarDatos = async () => {
    try {
      const [listaProductos, listaCategorias] = await Promise.all([
        productApi.getProducts(),
        productApi.getCategories()
      ])

      setProductos(listaProductos || [])
      setCategorias(listaCategorias || [])

      // Seleccionar la primera categoría si todavía no hay una seleccionada
      if (listaCategorias?.length > 0) {
        setFormProducto(prev => ({
          ...prev,
          categoria: prev.categoria || listaCategorias[0].name
        }))
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error)
      alert(`No se pudo cargar el inventario: ${error.message}`)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Actualizar los campos del formulario
  const handleFormProductoChange = (e) => {
    const { name, value } = e.target

    setFormProducto(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Guardar o modificar un producto
  const handleSubmitProducto = async (e) => {
    e.preventDefault()

    const error = validarProducto(formProducto)

    if (error) {
      alert(error)
      return
    }

    try {
      const payload = {
        ...formProducto,
        precio: Number(formProducto.precio),
        stock: Number(formProducto.stock)
      }

      if (modoEdicionProd) {
        await productApi.updateProduct(idEditandoProd, payload)
        alert('¡Producto actualizado con éxito!')
      } else {
        await productApi.createProduct(payload)
        alert('¡Producto creado con éxito!')
      }

      await cargarDatos()
      limpiarFormProducto()
    } catch (err) {
      console.error('Error al guardar producto:', err)
      alert(`Ocurrió un error: ${err.message || 'Error en la solicitud'}`)
    }
  }

  // Limpiar el formulario de productos
  const limpiarFormProducto = () => {
    const primeraCat = categorias.length > 0
      ? categorias[0].name
      : ''

    setFormProducto({
      nombre: '',
      precio: '',
      stock: '',
      categoria: primeraCat,
      cBarras: '',
      descripcion: '',
      imagen: ''
    })

    setModoEdicionProd(false)
    setIdEditandoProd(null)
  }

  // Seleccionar un producto para modificar
  const handleEditarProducto = (prod) => {
    setModoEdicionProd(true)
    setIdEditandoProd(prod.id)

    setFormProducto({
      nombre: prod.nombre || '',
      precio: prod.precio ?? '',
      stock: prod.stock ?? '',
      categoria: prod.categoria || '',
      cBarras: prod.codigoBarras || prod.cBarras || '',
      descripcion: prod.descripcion || '',
      imagen: prod.imagen || ''
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Eliminar un producto
  const handleEliminarProducto = async (prod) => {
    if (!window.confirm(
      `¿Estás seguro de eliminar el producto "${prod.nombre}"?`
    )) {
      return
    }

    try {
      await productApi.deleteProduct(prod.id)

      alert('¡Producto eliminado con éxito!')
      await cargarDatos()

      if (idEditandoProd === prod.id) {
        limpiarFormProducto()
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err)
      alert(`No se pudo eliminar: ${err.message || 'Error de red'}`)
    }
  }

  // Seleccionar una categoría de la tabla
  const handleSelectCategoriaRow = (cat) => {
    setCategoriaSeleccionada(cat)
    setNombreCategoria(cat.name || '')
    setNombreAnterior(cat.name || '')
  }

  // Limpiar el formulario de categorías
  const limpiarFormCategoria = () => {
    setCategoriaSeleccionada(null)
    setNombreCategoria('')
    setNombreAnterior('')
  }

  // Crear o modificar una categoría
  const handleSubmitCategoria = async (e) => {
    e.preventDefault()

    const error = validarCategoria(nombreCategoria)

    if (error) {
      alert(error)
      return
    }

    try {
      if (categoriaSeleccionada) {
        await productApi.updateCategory(
          categoriaSeleccionada.id,
          nombreCategoria
        )

        alert('¡Categoría modificada con éxito!')
      } else {
        await productApi.createCategory(nombreCategoria)
        alert('¡Categoría creada con éxito!')
      }

      await cargarDatos()
      limpiarFormCategoria()
    } catch (err) {
      console.error('Error al guardar categoría:', err)
      alert(`Ocurrió un error: ${err.message || 'Error en la solicitud'}`)
    }
  }

  // Eliminar una categoría
  const handleEliminarCategoria = async () => {
    if (!categoriaSeleccionada) return

    const nombreActual = categoriaSeleccionada.name

    if (!window.confirm(
      `¿Estás seguro de eliminar la categoría "${nombreActual}"?`
    )) {
      return
    }

    try {
      await productApi.deleteCategory(categoriaSeleccionada.id)

      alert('¡Categoría eliminada con éxito!')
      await cargarDatos()
      limpiarFormCategoria()
    } catch (err) {
      console.error('Error al eliminar categoría:', err)
      alert(
        `No se pudo eliminar: ${err.message || 'Error de red'}. ` +
        'Comprueba que ningún producto esté utilizando esta categoría.'
      )
    }
  }

  return (
    <div className="container py-5">

      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{ color: '#5d4037' }}>
          Panel de Administración: Inventario
        </h2>

        <button
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{
            backgroundColor: '#fff',
            borderColor: '#5d4037',
            color: '#5d4037'
          }}
        >
          🏠 Volver al Admin Home
        </button>
      </div>

      {/* Pestañas */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 ${
              tabActiva === 'productos'
                ? 'text-white'
                : 'text-dark border border-secondary'
            }`}
            style={{
              backgroundColor:
                tabActiva === 'productos' ? '#5d4037' : 'transparent'
            }}
            onClick={() => setTabActiva('productos')}
          >
            Gestión de Productos
          </button>
        </li>

        <li className="nav-item">
          <button
            className={`nav-link fw-bold px-4 ${
              tabActiva === 'categorias'
                ? 'text-white'
                : 'text-dark border border-secondary'
            }`}
            style={{
              backgroundColor:
                tabActiva === 'categorias' ? '#5d4037' : 'transparent'
            }}
            onClick={() => setTabActiva('categorias')}
          >
            Gestión de Categorías
          </button>
        </li>
      </ul>

      {/* ================= PRODUCTOS ================= */}
      {tabActiva === 'productos' && (
        <div>

          {/* Formulario de productos */}
          <div
            className="card shadow-sm border-secondary mb-5"
            style={{ backgroundColor: '#fce4ec' }}
          >
            <div
              className="card-header text-white fw-bold py-2"
              style={{ backgroundColor: '#5d4037' }}
            >
              {modoEdicionProd
                ? 'Modificar Producto'
                : 'Agregar Nuevo Producto'}
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmitProducto}>
                <div className="row g-3">

                  <div className="col-12 col-md-6">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      Nombre del Producto
                    </label>

                    <input
                      type="text"
                      name="nombre"
                      value={formProducto.nombre}
                      onChange={handleFormProductoChange}
                      className="form-control border-secondary"
                      placeholder="Ej: Kisaragi Saya"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      Precio (CLP)
                    </label>

                    <input
                      type="number"
                      name="precio"
                      min="0"
                      value={formProducto.precio}
                      onChange={handleFormProductoChange}
                      className="form-control border-secondary"
                      placeholder="Ej: 20000"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      Stock
                    </label>

                    <input
                      type="number"
                      name="stock"
                      min="0"
                      value={formProducto.stock}
                      onChange={handleFormProductoChange}
                      className="form-control border-secondary"
                      placeholder="Ej: 15"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      Categoría
                    </label>

                    <select
                      name="categoria"
                      value={formProducto.categoria}
                      onChange={handleFormProductoChange}
                      className="form-select border-secondary w-100"
                      required
                    >
                      <option value="">Selecciona una categoría</option>

                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      Código de Barras
                    </label>

                    <input
                      type="text"
                      name="cBarras"
                      value={formProducto.cBarras}
                      onChange={handleFormProductoChange}
                      className="form-control border-secondary"
                      placeholder="Ej: 780123456789"
                      required
                    />
                  </div>

                  {/* URL de imagen */}
                  <div className="col-12">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      URL de la Imagen del Producto
                    </label>

                    <input
                      type="url"
                      name="imagen"
                      value={formProducto.imagen}
                      onChange={handleFormProductoChange}
                      className="form-control border-secondary"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />

                    {formProducto.imagen && (
                      <div className="mt-3 d-flex align-items-center gap-3">
                        <img
                          src={formProducto.imagen}
                          alt="Vista previa del producto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                          style={{
                            width: '70px',
                            height: '70px',
                            objectFit: 'cover',
                            borderRadius: '10px'
                          }}
                          className="border border-secondary shadow-sm"
                        />

                        <span className="small text-muted">
                          Vista previa de la imagen
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label
                      className="form-label small fw-bold"
                      style={{ color: '#5d4037' }}
                    >
                      Descripción
                    </label>

                    <textarea
                      name="descripcion"
                      value={formProducto.descripcion}
                      onChange={handleFormProductoChange}
                      className="form-control border-secondary"
                      rows="2"
                      placeholder="Breve descripción..."
                    />
                  </div>

                  <div className="col-12 d-flex gap-2">
                    <button
                      type="submit"
                      className="btn text-white fw-bold px-4"
                      style={{ backgroundColor: '#5d4037' }}
                      disabled={categorias.length === 0}
                    >
                      {modoEdicionProd
                        ? 'Actualizar Producto'
                        : 'Guardar Producto'}
                    </button>

                    {modoEdicionProd && (
                      <button
                        type="button"
                        onClick={limpiarFormProducto}
                        className="btn btn-secondary fw-bold px-4"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {categorias.length === 0 && (
                    <div className="col-12">
                      <p className="text-danger small mb-0">
                        Primero debes crear una categoría para registrar productos.
                      </p>
                    </div>
                  )}

                </div>
              </form>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="card shadow-sm border-secondary">
            <div
              className="card-header text-white fw-bold py-2 text-uppercase"
              style={{ backgroundColor: '#5d4037' }}
            >
              Lista de Productos Registrados
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0 align-middle">
                  <thead className="table-light border-bottom border-secondary">
                    <tr>
                      <th>Imagen</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>cBarras</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {productos.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-4 text-muted"
                        >
                          No hay productos registrados.
                        </td>
                      </tr>
                    ) : (
                      productos.map(prod => {
                        const nombreCat =
                          typeof prod.categoria === 'object'
                            ? prod.categoria?.name || ''
                            : prod.categoria || ''

                        const codigo =
                          prod.codigoBarras || prod.cBarras || 'N/A'

                        return (
                          <tr key={prod.id}>
                            <td>
                              {prod.imagen ? (
                                <img
                                  src={prod.imagen}
                                  alt={prod.nombre}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                  style={{
                                    width: '45px',
                                    height: '45px',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                  }}
                                  className="border border-secondary"
                                />
                              ) : (
                                <span className="badge bg-light text-dark border">
                                  Sin Img
                                </span>
                              )}
                            </td>

                            <td className="fw-bold">{prod.nombre}</td>

                            <td>
                              <span className="badge bg-secondary">
                                {nombreCat}
                              </span>
                            </td>

                            <td
                              className="fw-bold"
                              style={{ color: '#5d4037' }}
                            >
                              ${Number(prod.precio).toLocaleString('es-CL')}
                            </td>

                            <td>{prod.stock}</td>

                            <td className="small text-muted">{codigo}</td>

                            <td className="text-center">
                              <button
                                onClick={() => handleEditarProducto(prod)}
                                className="btn btn-sm btn-outline-dark me-2 fw-bold"
                              >
                                Modificar
                              </button>

                              <button
                                onClick={() => handleEliminarProducto(prod)}
                                className="btn btn-sm btn-danger fw-bold"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ================= CATEGORÍAS ================= */}
      {tabActiva === 'categorias' && (
        <div className="row g-4">

          {/* Tabla de categorías */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm border-0">

              <div
                className="card-header text-white d-flex justify-content-between align-items-center"
                style={{ backgroundColor: '#5d4037' }}
              >
                <span className="fw-bold text-uppercase">
                  Listado de Categorías
                </span>

                <button
                  className="btn btn-sm btn-light text-dark fw-bold"
                  onClick={limpiarFormCategoria}
                >
                  + Nueva Categoría
                </button>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nombre de la Categoría</th>
                      </tr>
                    </thead>

                    <tbody>
                      {categorias.length > 0 ? (
                        categorias.map(cat => {
                          const isSelected =
                            categoriaSeleccionada?.id === cat.id

                          return (
                            <tr
                              key={cat.id}
                              onClick={() => handleSelectCategoriaRow(cat)}
                              style={{
                                cursor: 'pointer',
                                backgroundColor: isSelected
                                  ? '#fce4ec'
                                  : 'transparent'
                              }}
                            >
                              <td className="fw-bold">{cat.id}</td>
                              <td>{cat.name}</td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-4 text-muted"
                          >
                            No hay categorías registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* Formulario de categorías */}
          <div className="col-12 col-lg-5">
            <div
              className="card shadow-sm border-0"
              style={{ backgroundColor: '#fce4ec' }}
            >

              <div
                className="card-header text-white fw-bold py-2 text-uppercase"
                style={{ backgroundColor: '#5d4037' }}
              >
                {categoriaSeleccionada
                  ? 'Modificar Categoría'
                  : 'Nueva Categoría'}
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmitCategoria}>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Nombre de la Categoría
                    </label>

                    <input
                      type="text"
                      value={nombreCategoria}
                      onChange={(e) => setNombreCategoria(e.target.value)}
                      className="form-control border-secondary"
                      placeholder="Ej: Anime, Ropa, etc."
                      required
                    />
                  </div>

                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn text-white fw-bold py-2"
                      style={{ backgroundColor: '#5d4037' }}
                    >
                      {categoriaSeleccionada
                        ? 'Modificar Categoría'
                        : 'Guardar Categoría'}
                    </button>

                    {categoriaSeleccionada && (
                      <>
                        <button
                          type="button"
                          className="btn btn-danger fw-bold py-2"
                          onClick={handleEliminarCategoria}
                        >
                          Eliminar Categoría
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm mt-1"
                          onClick={limpiarFormCategoria}
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
      )}

    </div>
  )
}

export default GestionInventario
