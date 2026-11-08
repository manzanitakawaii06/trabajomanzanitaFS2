
const API_URL = 'http://localhost:8080/api/ordenes';

export const documentoApi = {
  async listarDocumentos() {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error('Error al obtener las órdenes');
    }

    return await response.json();
  },

  async obtenerDocumento(id) {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
      throw new Error('No se pudo obtener la orden');
    }

    return await response.json();
  },

  async obtenerPorCodigo(codigo) {
    const response = await fetch(
      `${API_URL}/codigo/${encodeURIComponent(codigo)}`
    );

    if (!response.ok) {
      throw new Error('No se pudo encontrar la orden');
    }

    return await response.json();
  }
};
