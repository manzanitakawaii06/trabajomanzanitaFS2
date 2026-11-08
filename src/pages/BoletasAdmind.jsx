
import { useState, useEffect } from 'react';
import { documentoApi } from '../Data/ConexionBoletas';
import { useNavigate } from 'react-router-dom';

function BoletasAdmind() {
  const navigate = useNavigate();

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  useEffect(() => {
    const cargarDocumentos = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await documentoApi.listarDocumentos();

        setDocumentos(data || []);

      } catch (error) {
        console.error('Error al cargar órdenes:', error);
        setError('No fue posible cargar las órdenes. Comprueba que Spring Boot esté funcionando.');
      } finally {
        setLoading(false);
      }
    };

    cargarDocumentos();
  }, []);

  const formatoPrecio = (valor) => {
    return Number(valor || 0).toLocaleString('es-CL');
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleString('es-CL');
  };

  const nombreCompleto = (orden) => {
    return `${orden.nombreCliente || ''} ${orden.apellidoCliente || ''}`.trim();
  };

  const colorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'procesando':
        return 'warning';
      case 'enviado':
        return 'info';
      case 'entregado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container py-5">

      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">
            Gestión de Boletas y Pedidos
          </h1>

          <p className="text-muted mb-0">
            Vista general de las compras registradas en el sistema.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="btn btn-outline-dark fw-bold shadow-sm"
          style={{
            backgroundColor: '#fff',
            borderColor: '#5d4037',
            color: '#5d4037'
          }}
        >
          Volver al Admin Home
        </button>
      </div>

      {/* Contenido */}
      <div className="row">

        {/* Lista de órdenes */}
        <div className="col-12 col-lg-7">
          <div
            className="card shadow-sm border-secondary p-3"
            style={{ backgroundColor: '#fce4ec' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0" style={{ color: '#5d4037' }}>
                Lista de órdenes
              </h4>

              <span className="badge bg-dark">
                {documentos.length} compras
              </span>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-dark" role="status" />
                <p className="mt-2 text-muted">Cargando órdenes...</p>
              </div>

            ) : error ? (
              <div className="alert alert-danger">
                {error}
              </div>

            ) : documentos.length === 0 ? (
              <p className="text-muted text-center py-4">
                No hay compras registradas en el sistema.
              </p>

            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle bg-white rounded overflow-hidden">

                  <thead className="table-dark">
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documentos.map((doc) => (
                      <tr
                        key={doc.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setDocumentoSeleccionado(doc)}
                      >
                        <td>
                          <strong className="small">
                            {doc.codigoOrden}
                          </strong>
                          <br />
                          <small className="text-muted">
                            {formatoFecha(doc.fechaCompra)}
                          </small>
                        </td>

                        <td className="small">
                          {nombreCompleto(doc)}
                        </td>

                        <td>
                          <span className={`badge bg-${colorEstado(doc.estado)}`}>
                            {doc.estado}
                          </span>
                        </td>

                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary fw-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocumentoSeleccionado(doc);
                            }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detalle de la orden */}
        <div className="col-12 col-lg-5 mt-4 mt-lg-0">
          <div className="card shadow-sm border-secondary p-4 bg-white">

            <h4 className="fw-bold mb-3" style={{ color: '#5d4037' }}>
              Detalle de la compra
            </h4>

            {documentoSeleccionado ? (
              <div>

                {/* Datos generales */}
                <div className="mb-3 border-bottom pb-3">

                  <span className="badge bg-dark mb-2">
                    {documentoSeleccionado.estado}
                  </span>

                  <p className="small mb-1">
                    <strong>Código:</strong>{' '}
                    {documentoSeleccionado.codigoOrden}
                  </p>

                  <p className="small mb-1">
                    <strong>ID de orden:</strong>{' '}
                    {documentoSeleccionado.id}
                  </p>

                  <p className="small mb-1">
                    <strong>Fecha:</strong>{' '}
                    {formatoFecha(documentoSeleccionado.fechaCompra)}
                  </p>

                  <p className="small mb-1">
                    <strong>Estado de pago:</strong>{' '}
                    {documentoSeleccionado.estadoPago}
                  </p>

                </div>

                {/* Datos del cliente */}
                <div className="mb-3 border-bottom pb-3">

                  <h6 className="fw-bold">
                    Información del cliente
                  </h6>

                  <p className="small mb-1">
                    <strong>Nombre:</strong>{' '}
                    {nombreCompleto(documentoSeleccionado)}
                  </p>

                  <p className="small mb-1">
                    <strong>Correo:</strong>{' '}
                    {documentoSeleccionado.correoCliente}
                  </p>

                </div>

                {/* Datos de entrega */}
                <div className="mb-3 border-bottom pb-3">

                  <h6 className="fw-bold">
                    Dirección de entrega
                  </h6>

                  <p className="small mb-1">
                    <strong>Calle:</strong>{' '}
                    {documentoSeleccionado.calle}
                  </p>

                  {documentoSeleccionado.departamento && (
                    <p className="small mb-1">
                      <strong>Departamento:</strong>{' '}
                      {documentoSeleccionado.departamento}
                    </p>
                  )}

                  <p className="small mb-1">
                    <strong>Región:</strong>{' '}
                    {documentoSeleccionado.region}
                  </p>

                  <p className="small mb-1">
                    <strong>Comuna:</strong>{' '}
                    {documentoSeleccionado.comuna}
                  </p>

                  {documentoSeleccionado.indicaciones && (
                    <p className="small mb-1">
                      <strong>Indicaciones:</strong>{' '}
                      {documentoSeleccionado.indicaciones}
                    </p>
                  )}

                </div>

                {/* Productos */}
                <h6 className="fw-bold mb-2">
                  Productos comprados
                </h6>

                <ul className="list-group list-group-flush mb-3 small">

                  {documentoSeleccionado.detalles?.map((prod) => (
                    <li
                      key={prod.id}
                      className="list-group-item px-0"
                    >

                      <div className="d-flex justify-content-between align-items-start">

                        <div>
                          <strong>{prod.nombreProducto}</strong>

                          <p className="text-muted mb-1">
                            Cantidad: {prod.cantidad}
                          </p>

                          <p className="text-muted mb-0">
                            Precio unitario: ${formatoPrecio(prod.precioUnitario)}
                          </p>
                        </div>

                        <strong>
                          ${formatoPrecio(prod.subtotal)}
                        </strong>

                      </div>

                    </li>
                  ))}

                </ul>

                {/* Total */}
                <div className="border-top pt-3">

                  <h4
                    className="fw-bold text-end"
                    style={{ color: '#5d4037' }}
                  >
                    Total: ${formatoPrecio(documentoSeleccionado.total)}
                  </h4>

                </div>

              </div>

            ) : (
              <div className="text-center py-5 text-muted">
                <p>
                  Selecciona una orden de la tabla para ver todos sus datos.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default BoletasAdmind;
