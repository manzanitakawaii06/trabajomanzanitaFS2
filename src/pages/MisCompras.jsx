
import { useState, useEffect } from 'react';

function MisCompras({ usuarioLogueado }) {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

    const usuarioId = usuarioLogueado?.id || usuarioLogueado?.usuarioId;

    useEffect(() => {
        const cargarCompras = async () => {
            if (!usuarioId) {
                setError('No se pudo identificar al usuario.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

               const response = await fetch(
    `http://localhost:8080/api/ordenes/usuario/${usuarioId}`
);

                if (!response.ok) {
                    throw new Error('No se pudieron cargar tus compras.');
                }

                const data = await response.json();

                setOrdenes(Array.isArray(data) ? data : []);

            } catch (error) {
                console.error('Error al cargar compras:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        cargarCompras();
    }, [usuarioId]);

    const formatoPrecio = (valor) => {
        return Number(valor || 0).toLocaleString('es-CL');
    };

    const formatoFecha = (fecha) => {
        if (!fecha) return 'Sin fecha';

        return new Date(fecha).toLocaleString('es-CL');
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

            <div className="mb-4">
                <h1 className="fw-bold" style={{ color: '#5d4037' }}>
                    Mis compras
                </h1>

                <p className="text-muted">
                    Aquí puedes consultar el historial de tus pedidos.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-dark" />
                    <p className="mt-2">Cargando tus compras...</p>
                </div>

            ) : error ? (
                <div className="alert alert-danger">
                    {error}
                </div>

            ) : ordenes.length === 0 ? (
                <div className="card shadow-sm text-center p-5">
                    <h4>No tienes compras registradas</h4>
                    <p className="text-muted mb-0">
                        Cuando realices una compra, aparecerá aquí.
                    </p>
                </div>

            ) : (
                <div className="row g-4">

                    <div className="col-12 col-lg-5">
                        <div className="card shadow-sm p-3"
                            style={{ backgroundColor: '#fce4ec' }}>

                            <h5 className="fw-bold mb-3"
                                style={{ color: '#5d4037' }}>
                                Historial de compras ({ordenes.length})
                            </h5>

                            {ordenes.map((orden) => (
                                <button
                                    key={orden.id}
                                    type="button"
                                    className="card w-100 text-start p-3 mb-3 border-0 shadow-sm"
                                    onClick={() => setOrdenSeleccionada(orden)}
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor:
                                            ordenSeleccionada?.id === orden.id
                                                ? '#fff0f5'
                                                : '#ffffff',
                                        borderLeft:
                                            ordenSeleccionada?.id === orden.id
                                                ? '4px solid #5d4037'
                                                : '4px solid transparent'
                                    }}
                                >
                                    <div className="d-flex justify-content-between">
                                        <strong>{orden.codigoOrden}</strong>

                                        <span className={`badge bg-${colorEstado(orden.estado)}`}>
                                            {orden.estado}
                                        </span>
                                    </div>

                                    <small className="text-muted mt-2">
                                        {formatoFecha(orden.fechaCompra)}
                                    </small>

                                    <strong className="mt-2">
                                        Total: ${formatoPrecio(orden.total)}
                                    </strong>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="col-12 col-lg-7">
                        <div className="card shadow-sm p-4">

                            <h5 className="fw-bold mb-3"
                                style={{ color: '#5d4037' }}>
                                Detalle de la compra
                            </h5>

                            {ordenSeleccionada ? (
                                <>
                                    <div className="border-bottom pb-3 mb-3">
                                        <span className={`badge bg-${colorEstado(ordenSeleccionada.estado)}`}>
                                            {ordenSeleccionada.estado}
                                        </span>

                                        <p className="small mt-2 mb-1">
                                            <strong>Orden:</strong> {ordenSeleccionada.codigoOrden}
                                        </p>

                                        <p className="small mb-1">
                                            <strong>Fecha:</strong> {formatoFecha(ordenSeleccionada.fechaCompra)}
                                        </p>

                                        <p className="small mb-0">
                                            <strong>Estado de pago:</strong> {ordenSeleccionada.estadoPago}
                                        </p>
                                    </div>

                                    <h6 className="fw-bold">Productos comprados</h6>

                                    <ul className="list-group list-group-flush mb-3">
                                        {ordenSeleccionada.detalles?.map((producto) => (
                                            <li key={producto.id}
                                                className="list-group-item px-0">

                                                <div className="d-flex justify-content-between">
                                                    <div>
                                                        <strong>{producto.nombreProducto}</strong>

                                                        <p className="small text-muted mb-1">
                                                            Cantidad: {producto.cantidad}
                                                        </p>

                                                        <p className="small text-muted">
                                                            Precio unitario: ${formatoPrecio(producto.precioUnitario)}
                                                        </p>
                                                    </div>

                                                    <strong>
                                                        ${formatoPrecio(producto.subtotal)}
                                                    </strong>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="border-top pt-3">
                                        <h4 className="fw-bold text-end"
                                            style={{ color: '#5d4037' }}>
                                            Total: ${formatoPrecio(ordenSeleccionada.total)}
                                        </h4>
                                    </div>

                                    <hr />

                                    <h6 className="fw-bold">Dirección de entrega</h6>

                                    <p className="small mb-1">
                                        {ordenSeleccionada.calle}
                                    </p>

                                    {ordenSeleccionada.departamento && (
                                        <p className="small mb-1">
                                            Departamento: {ordenSeleccionada.departamento}
                                        </p>
                                    )}

                                    <p className="small mb-1">
                                        {ordenSeleccionada.comuna}, {ordenSeleccionada.region}
                                    </p>

                                    {ordenSeleccionada.indicaciones && (
                                        <p className="small mb-0">
                                            <strong>Indicaciones:</strong> {ordenSeleccionada.indicaciones}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    Selecciona una compra para consultar sus detalles.
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

export default MisCompras;
