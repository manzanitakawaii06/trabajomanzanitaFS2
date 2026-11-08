
const API_URL = 'http://localhost:8080/api/noticias';

// Convierte la respuesta de Spring Boot al formato que utiliza React.
const adaptarNoticia = (noticia) => {
  if (!noticia) return null;

  return {
    id: noticia.id,
    createdAt: noticia.createdAt,
    updatedAt: noticia.updatedAt,

    tarjeta: {
      titulo: noticia.titulo || '',
      slug: noticia.slug || '',
      resumen: noticia.resumen || '',
      imagenPortada: noticia.imagenPortada || '',
      categoria: noticia.categoria || 'Novedades',
      autor: noticia.autor || 'Equipo AnimeWord',
      destacado: Boolean(noticia.destacado)
    },

    articulo: {
      introduccion: noticia.articulo?.introduccion || '',
      secciones: noticia.articulo?.secciones || []
    }
  };
};

const leerRespuesta = async (response) => {
  const texto = await response.text();

  let resultado = null;

  if (texto) {
    try {
      resultado = JSON.parse(texto);
    } catch {
      resultado = texto;
    }
  }

  if (!response.ok) {
    const mensaje =
      typeof resultado === 'string'
        ? resultado
        : resultado?.message || 'Error en la solicitud al servidor';

    throw new Error(mensaje);
  }

  return resultado;
};

export const noticiaApi = {

  // Obtener todas las noticias.
  getNoticias: async () => {
    const response = await fetch(API_URL);
    const data = await leerRespuesta(response);

    return Array.isArray(data)
      ? data.map(adaptarNoticia)
      : [];
  },

  // Obtener una noticia por su slug.
  getNoticiaBySlug: async (slug) => {
    const response = await fetch(
      `${API_URL}/slug/${encodeURIComponent(slug)}`
    );

    if (response.status === 404) return null;

    const data = await leerRespuesta(response);

    return adaptarNoticia(data);
  },

  // Crear una noticia.
  createNoticia: async (payloadDTO) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadDTO)
    });

    const data = await leerRespuesta(response);

    return adaptarNoticia(data);
  },

  // Actualizar una noticia utilizando su ID.
  updateNoticia: async (id, payloadDTO) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadDTO)
    });

    const data = await leerRespuesta(response);

    return adaptarNoticia(data);
  },

  // Eliminar una noticia utilizando su ID.
  deleteNoticia: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    await leerRespuesta(response);

    return true;
  }
};
