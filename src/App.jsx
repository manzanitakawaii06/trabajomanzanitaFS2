
import { useState } from 'react';
import {
    Routes,
    Route,
    useLocation,
    useNavigate,
    Navigate
} from 'react-router-dom';

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import MisCompras from './pages/MisCompras.jsx';
import Navbar from './components/barraNavegacion.jsx';
import Footer from './components/Footer.jsx';

import Index from './pages/Index.jsx';
import Nosotros from './pages/Nosotros';
import Ventas from './pages/Productos.jsx';
import Registro from './pages/Registro';
import Login from './pages/Login';
import Blog from './pages/Blog';
import ArticuloBlog from './pages/ArticuloBlog.jsx';
import Contacto from './pages/Contacto';
import Carrito from './pages/Carrito';
import ResultadoPago from './pages/ResultadoPago.jsx';
import DetalleProducto from './pages/DetalleProducto.jsx';

import GestionInventario from './pages/GestionInventario.jsx';
import NavbarAdmin from './components/NavbarAdmin.jsx';
import AdminHome from './pages/AdminHome';
import AdminUser from './pages/AdminUser';
import GestionNoticia from './pages/GestionNoticia.jsx';
import BoletasAdmind from './pages/BoletasAdmind.jsx';

import { carritoApi } from './Data/ConexionCarrito';


function MainLayout({
    carrito,
    agregarAlCarro,
    eliminarDelCarro,
    vaciarCarrito,
    usuario,
    setUsuario
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const isAdmin = usuario?.rol === 'administrador';
    const esAdmin = isAdmin || location.pathname.startsWith('/admin');

    const estatusGeneral = {
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    };

    const handleLogout = () => {
        setUsuario(null);
        localStorage.removeItem('usuarioLogueado');
        navigate('/');
    };

    return (
        <div style={estatusGeneral}>

            <div className="d-print-none">
                {esAdmin ? (
                    <NavbarAdmin onLogout={handleLogout} />
                ) : (
                    <Navbar
                        carrito={carrito}
                        usuario={usuario}
                    />
                )}
            </div>

            <main className="container pt-4" style={{ flexGrow: 1 }}>
                <Routes>

                    {/* RUTAS DE ADMINISTRADOR */}

                    <Route
                        path="/admin"
                        element={
                            isAdmin
                                ? <AdminHome />
                                : <Navigate to="/Login" replace />
                        }
                    />

                    <Route
                        path="/admin/usuarios"
                        element={
                            isAdmin
                                ? <AdminUser />
                                : <Navigate to="/Login" replace />
                        }
                    />

                    <Route
                        path="/admin/inventario"
                        element={
                            isAdmin
                                ? <GestionInventario />
                                : <Navigate to="/Login" replace />
                        }
                    />

                    <Route
                        path="/admin/noticias"
                        element={
                            isAdmin
                                ? <GestionNoticia />
                                : <Navigate to="/Login" replace />
                        }
                    />

                    <Route
                        path="/admin/boletas"
                        element={
                            isAdmin
                                ? <BoletasAdmind />
                                : <Navigate to="/Login" replace />
                        }
                    />


                    {/* PRODUCTOS */}

                    <Route
                        path="/producto/:id"
                        element={
                            <DetalleProducto
                                onAgregarAlCarro={agregarAlCarro}
                            />
                        }
                    />

                    <Route
                        path="/"
                        element={
                            <Index onAgregarAlCarro={agregarAlCarro} />
                        }
                    />

                    <Route
                        path="/nosotros"
                        element={<Nosotros />}
                    />

                    <Route
                        path="/Ventas"
                        element={
                            <Ventas
                                onAgregarAlCarro={agregarAlCarro}
                                carrito={carrito}
                            />
                        }
                    />


                    {/* CARRITO */}

                    <Route
                        path="/carrito"
                        element={
                            <Carrito
                                carrito={carrito}
                                onEliminarDelCarro={eliminarDelCarro}
                                usuarioLogueado={usuario}
                            />
                        }
                    />


                    {/* HISTORIAL DE COMPRAS */}

                    <Route
                        path="/MisCompras"
                        element={
                            usuario
                                ? <MisCompras usuarioLogueado={usuario} />
                                : <Navigate to="/Login" replace />
                        }
                    />


                    {/* RESULTADO DEL PAGO */}

                    <Route
                        path="/resultado-pago"
                        element={
                            <ResultadoPago
                                onVaciarCarrito={vaciarCarrito}
                                usuarioLogueado={usuario}
                            />
                        }
                    />


                    {/* LOGIN Y REGISTRO */}

                    <Route
                        path="/Registro"
                        element={<Registro />}
                    />

                    <Route
                        path="/Login"
                        element={
                            <Login
                                onLogin={(datosUsuario) => {
                                    setUsuario(datosUsuario);

                                    localStorage.setItem(
                                        'usuarioLogueado',
                                        JSON.stringify(datosUsuario)
                                    );
                                }}
                            />
                        }
                    />


                    {/* BLOG Y CONTACTO */}

                    <Route
                        path="/Blog"
                        element={<Blog />}
                    />

                    <Route
                        path="/Blog/:id"
                        element={<ArticuloBlog />}
                    />

                    <Route
                        path="/Contacto"
                        element={<Contacto />}
                    />


                    {/* RUTA POR DEFECTO */}

                    <Route
                        path="*"
                        element={<Index />}
                    />

                </Routes>
            </main>

            <div className="d-print-none">
                <Footer />
            </div>

        </div>
    );
}


function App() {

    const [carrito, setCarrito] = useState([]);

    const [usuario, setUsuario] = useState(() => {
        try {
            const guardado = localStorage.getItem('usuarioLogueado');

            return guardado ? JSON.parse(guardado) : null;

        } catch (e) {
            console.error('Error al leer localStorage:', e);
            return null;
        }
    });


    // AGREGAR PRODUCTOS AL CARRITO

    const agregarAlCarro = async (producto, cantidad = 1) => {

        const usuarioId = usuario?.id || usuario?.usuarioId;

        if (!usuarioId) {
            alert('Debes iniciar sesión antes de agregar productos al carrito.');
            return;
        }

        const productoId = Number(producto.id);
        const cantidadAgregar = Number(cantidad);

        if (!productoId || cantidadAgregar <= 0) {
            alert('No se pudo identificar el producto o su cantidad.');
            return;
        }

        try {

            await carritoApi.agregarProducto(
                usuarioId,
                productoId,
                cantidadAgregar
            );

            setCarrito((prevCarrito) => {

                const existente = prevCarrito.find(
                    item => Number(item.id) === productoId
                );

                const stockDisponible = Number(producto.stock) || 0;

                if (existente) {

                    const nuevaCantidad = existente.cantidad + cantidadAgregar;

                    if (nuevaCantidad > stockDisponible) {
                        return prevCarrito;
                    }

                    return prevCarrito.map(item =>
                        Number(item.id) === productoId
                            ? { ...item, cantidad: nuevaCantidad }
                            : item
                    );
                }

                if (cantidadAgregar > stockDisponible) {
                    return prevCarrito;
                }

                return [
                    ...prevCarrito,
                    { ...producto, cantidad: cantidadAgregar }
                ];
            });

            alert('Producto agregado correctamente al carrito.');

        } catch (error) {

            console.error('Error al agregar al carrito:', error);

            alert(error.message || 'No se pudo agregar el producto al carrito.');
        }
    };


    // ELIMINAR PRODUCTOS DEL CARRITO

    const eliminarDelCarro = async (indexParaBorrar) => {

        const producto = carrito[indexParaBorrar];
        const usuarioId = usuario?.id || usuario?.usuarioId;

        if (!producto || !usuarioId) return;

        try {

            await carritoApi.eliminarProducto(usuarioId, producto.id);

            setCarrito(prev =>
                prev.filter((_, index) => index !== indexParaBorrar)
            );

        } catch (error) {

            console.error('Error al eliminar producto:', error);

            alert(error.message);
        }
    };


    // VACIAR CARRITO DESPUÉS DE UNA COMPRA EXITOSA

    const vaciarCarrito = () => {
        setCarrito([]);
    };


    return (
        <MainLayout
            carrito={carrito}
            agregarAlCarro={agregarAlCarro}
            eliminarDelCarro={eliminarDelCarro}
            vaciarCarrito={vaciarCarrito}
            usuario={usuario}
            setUsuario={setUsuario}
        />
    );
}

export default App;
