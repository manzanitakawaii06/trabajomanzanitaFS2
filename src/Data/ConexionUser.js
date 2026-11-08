const API_URL = 'http://localhost:8080/api/usuarios';

export const userApi = {

    // Obtener todos los usuarios
    async getUsers() {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Error al obtener usuarios');
        }

        return await response.json();
    },

    // Obtener usuario por correo
    async getUserByEmail(email) {
        const response = await fetch(
            `${API_URL}/email/${encodeURIComponent(email)}`
        );

        if (!response.ok) {
            throw new Error('No se encontró el usuario');
        }

        return await response.json();
    },

    // Crear usuario
    async createUser(userData) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: userData.nombre,
                apellido: userData.apellido || '',
                email: userData.email,
                password: userData.password || userData.paswword,
                rol: 'cliente'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data === 'string'
                    ? data
                    : 'Error al crear usuario'
            );
        }

        return data;
    },

    // Actualizar usuario
    async updateUser(id, userData) {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar usuario');
        }

        return await response.json();
    },

    // Eliminar usuario
    async deleteUser(id) {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar usuario');
        }

        return true;
    },

    // Iniciar sesión
    async login(email, password) {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!response.ok) {
            throw new Error('Correo o contraseña incorrectos');
        }

        return await response.json();
    }
};
