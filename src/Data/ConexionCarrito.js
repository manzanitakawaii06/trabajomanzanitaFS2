
const API_URL = 'http://localhost:8080/api/carritos';

export const carritoApi = {
    // Obtener el carrito de un usuario
    async obtenerCarrito(usuarioId) {
        const response = await fetch(
            `${API_URL}/usuario/${usuarioId}`
        );

        if (!response.ok) {
            throw new Error('No se pudo obtener el carrito');
        }

        return await response.json();
    },

    // Agregar un producto al carrito
    async agregarProducto(usuarioId, productoId, cantidad) {
        const response = await fetch(
            `${API_URL}/usuario/${usuarioId}/productos`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productoId: Number(productoId),
                    cantidad: Number(cantidad)
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'No se pudo agregar el producto');
        }

        return await response.json();
    },

    // Modificar cantidad
    async actualizarCantidad(usuarioId, productoId, cantidad) {
        const response = await fetch(
            `${API_URL}/usuario/${usuarioId}/productos/${productoId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cantidad: Number(cantidad) })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'No se pudo actualizar la cantidad');
        }

        return await response.json();
    },

    // Eliminar un producto
    async eliminarProducto(usuarioId, productoId) {
        const response = await fetch(
            `${API_URL}/usuario/${usuarioId}/productos/${productoId}`,
            { method: 'DELETE' }
        );

        if (!response.ok && response.status !== 404) {
            throw new Error('No se pudo eliminar el producto');
        }
    },

    // Vaciar carrito
    async vaciarCarrito(usuarioId) {
        const response = await fetch(
            `${API_URL}/usuario/${usuarioId}`,
            { method: 'DELETE' }
        );

        if (!response.ok && response.status !== 404) {
            throw new Error('No se pudo vaciar el carrito');
        }
    }
};
