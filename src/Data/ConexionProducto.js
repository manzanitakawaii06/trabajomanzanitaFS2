
const API_URL = 'http://localhost:8080/api';

let categoriasCache = [];

async function realizarSolicitud(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);

  if (respuesta.status === 204) {
    if (!respuesta.ok) {
      throw new Error('No se pudo completar la operación');
    }
    return null;
  }

  const texto = await respuesta.text();
  let datos = null;

  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }

  if (!respuesta.ok) {
    throw new Error(
      typeof datos === 'string'
        ? datos
        : datos?.message || `Error HTTP ${respuesta.status}`
    );
  }

  return datos;
}

function normalizarCategoria(categoria) {
  return {
    ...categoria,
    id: categoria.id,
    name: categoria.name,
    nombre: categoria.name
  };
}

function normalizarProducto(producto) {
  return {
    ...producto,
    categoriaId: producto.categoria?.id ?? '',
    categoria: producto.categoria?.name ?? '',
    cBarras: producto.codigoBarras ?? ''
  };
}

function obtenerCategoriaId(producto) {
  if (producto.categoriaId) {
    return Number(producto.categoriaId);
  }

  if (typeof producto.categoria === 'object' && producto.categoria?.id) {
    return Number(producto.categoria.id);
  }

  const categoriaEncontrada = categoriasCache.find(
    categoria =>
      categoria.name === producto.categoria ||
      categoria.nombre === producto.categoria
  );

  return categoriaEncontrada?.id
    ? Number(categoriaEncontrada.id)
    : null;
}

function prepararProducto(producto) {
  const categoriaId = obtenerCategoriaId(producto);

  if (!categoriaId) {
    throw new Error('Selecciona una categoría válida para el producto');
  }

  return {
    nombre: producto.nombre,
    precio: Number(producto.precio),
    stock: Number(producto.stock),
    categoria: {
      id: categoriaId
    },
    codigoBarras: producto.codigoBarras || producto.cBarras,
    descripcion: producto.descripcion || '',
    imagen: producto.imagen || ''
  };
}

export const productApi = {
  async getProducts() {
    const productos = await realizarSolicitud(`${API_URL}/productos`);
    return productos.map(normalizarProducto);
  },

  async getCategories() {
    const categorias = await realizarSolicitud(`${API_URL}/categorias`);
    categoriasCache = categorias.map(normalizarCategoria);
    return categoriasCache;
  },

  async createProduct(producto) {
    const datos = prepararProducto(producto);

    const creado = await realizarSolicitud(`${API_URL}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    return normalizarProducto(creado);
  },

  async updateProduct(id, producto) {
    // También permite recibir un único objeto que incluya su propio id.
    if (typeof id === 'object') {
      producto = id;
      id = producto.id;
    }

    if (!id) {
      throw new Error('No se encontró el ID del producto');
    }

    const datos = prepararProducto(producto);

    const actualizado = await realizarSolicitud(
      `${API_URL}/productos/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      }
    );

    return actualizado ? normalizarProducto(actualizado) : null;
  },

  async deleteProduct(producto) {
    const id = typeof producto === 'object' ? producto.id : producto;

    if (!id) {
      throw new Error('No se encontró el ID del producto');
    }

    return realizarSolicitud(`${API_URL}/productos/${id}`, {
      method: 'DELETE'
    });
  },

  async createCategory(nombreCategoria) {
    const creada = await realizarSolicitud(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nombreCategoria })
    });

    return normalizarCategoria(creada);
  },

  async updateCategory(idOAnterior, nuevoNombre) {
    const categoria = categoriasCache.find(
      cat =>
        String(cat.id) === String(idOAnterior) ||
        cat.name === idOAnterior ||
        cat.nombre === idOAnterior
    );

    const id = categoria?.id ?? idOAnterior;

    const actualizada = await realizarSolicitud(
      `${API_URL}/categorias/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nuevoNombre })
      }
    );

    return actualizada ? normalizarCategoria(actualizada) : null;
  },

  async deleteCategory(idONombre) {
    const categoria = categoriasCache.find(
      cat =>
        String(cat.id) === String(idONombre) ||
        cat.name === idONombre ||
        cat.nombre === idONombre
    );

    const id = categoria?.id ?? idONombre;

    return realizarSolicitud(`${API_URL}/categorias/${id}`, {
      method: 'DELETE'
    });
  }
};
