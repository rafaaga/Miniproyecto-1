import { useState, useEffect } from 'react';
import "../assets/styles/RegistroVentas.css";
import axios from 'axios';

function RegistroVentas() {
    const apiUrl = import.meta.env.VITE_API_URL;

    const [nombreProducto, setNombreProducto] = useState('');
    const [producto, setProducto] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [maximo, setMaximo] = useState();
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [cliente, setCliente] = useState('');
    const [empleado, setEmpleado] = useState('');
    const [medioPago, setMedioPago] = useState('');
    const [idBanco, setIdBanco] = useState('');
    const [productos, setProductos] = useState([]);
    const [productosVenta, setProductosVenta] = useState([]); // Almacenar múltiples productos
    const [empleados, setEmpleados] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [clienteData, setClienteData] = useState(0);
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');

    const fechaActual = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        axios.get(`${apiUrl}/api/producto/`)
            .then(response => {
                setProductos(response.data);
            })
            .catch(error => {
                console.error('Error obteniendo los productos:', error);
            });

        axios.get(`${apiUrl}/api/empleado/`)
            .then(response => {
                setEmpleados(response.data);
            })
            .catch(error => {
                console.error('Error obteniendo los empleados:', error);
            });

        axios.get(`${apiUrl}/api/banco/`)
            .then(response => {
                setBancos(response.data);
            })
            .catch(error => {
                console.error('Error obteniendo los bancos:', error);
            });
    }, []);

    const handleProductoChange = (e) => {
        const productoSeleccionado = productos.find(prod => prod.IdProducto === parseInt(e.target.value));
        setProducto(e.target.value);
        if (productoSeleccionado) {
            setNombreProducto(productoSeleccionado.NombreProducto);
            setPrecioUnitario(productoSeleccionado.ValorUnidad);
            setMaximo(productoSeleccionado.Cantidad);
        } else {
            setPrecioUnitario('');
        }
    };

    const agregarProducto = () => {
        if (producto && cantidad && precioUnitario && cantidad <= maximo) {
            const nuevoProducto = {
                IdProducto: producto,
                NombreProducto: nombreProducto,
                Cantidad: cantidad,
                PrecioUnitario: precioUnitario,
                Total: cantidad * precioUnitario // Calcular el total por producto
            };
            setProductosVenta([...productosVenta, nuevoProducto]);
            setProducto('');
            setCantidad('');
            setPrecioUnitario('');
            setMaximo(0);
        } else {
            alert("Verifica que hayas seleccionado un producto, una cantidad válida y que esté disponible en inventario.");
        }
    };

    const eliminarProducto = (index) => {
        const nuevosProductosVenta = productosVenta.filter((_, i) => i !== index);
        setProductosVenta(nuevosProductosVenta);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        alert("Generado con éxito");

        try {
            const nuevoCliente = {
                IdCliente: cliente,
                NombreCliente: nombre,
                DireccionCliente: direccion
            };

            const venta = {
                IdCliente: cliente,
                IdEmpleado: empleado,
                Fecha: fechaActual,
                MedioPago: medioPago,
                IdBanco: medioPago === 'Tarjeta' || medioPago === 'Transferencia' ? idBanco : 4
            };

            if (!clienteData.NombreCliente) {
                await axios.post(`${apiUrl}/api/cliente/`, nuevoCliente);
                console.log("Cliente creado correctamente");
            }

            const response = await axios.post(`${apiUrl}/api/factura/`, venta);

            for (const prodVenta of productosVenta) {
                const productoFactura = {
                    IdFactura: response.data.IdFactura,
                    IdProducto: parseInt(prodVenta.IdProducto),
                    Cantidad: prodVenta.Cantidad
                };
                console.log(productoFactura);
                await axios.post(`${apiUrl}/api/productofactura/`, productoFactura);

                const nuevaCantidad = maximo - prodVenta.Cantidad;
                await axios.patch(`${apiUrl}/api/producto/${prodVenta.IdProducto}/`, {
                    Cantidad: nuevaCantidad
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (nuevaCantidad < 1) {
                    await axios.post(`${apiUrl}/api/enviar-email/`, {
                        destinatario: "juanrx1904@gmail.com",
                        asunto: "Inventario agotado",
                        email: `El producto ${prodVenta.NombreProducto} se ha agotado actualmente en el inventario.`,
                    });
                }
            }

            console.log('Venta registrada:', response.data);

            // Restablecer el formulario después de la venta
            setCliente('');
            setEmpleado('');
            setMedioPago('');
            setIdBanco('');
            setMaximo();
            setClienteData(0);
            setNombreProducto('');
            setProductosVenta([]); // Vaciar la lista de productos
        } catch (error) {
            console.error('Error registrando la venta:', error);
        }
    };

    const buscarCliente = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`${apiUrl}/api/cliente/${cliente}/`);
            setClienteData(response.data);
        } catch (error) {
            setClienteData([]);
            console.error('Cliente no encontrado:', error);
        }
    };

    function renderizarFormulario() {
        if (clienteData !== 0) {
            return (
                <>
                    {clienteData.NombreCliente ? 
                        <h3>{clienteData.NombreCliente}</h3> : 
                        <>
                            <div className="form-group">
                                <h3>Cliente no encontrado</h3>
                                <label>Nombre del cliente:</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                                <label>Dirección del cliente:</label>
                                <input
                                    type="text"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    }
                    <div className="form-group">
                        <label>Empleado:</label>
                        <select
                            value={empleado}
                            onChange={(e) => setEmpleado(e.target.value)}
                            required
                        >
                            <option value="">Selecciona un empleado</option>
                            {empleados.map(emp => (
                                <option key={emp.IdEmpleado} value={emp.IdEmpleado}>
                                    {emp.NombreEmpleado}
                                </option>
                            ))}
                        </select>
                        {empleado && (
                            <span className="empleado-id">ID Empleado: {empleado}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Método de Pago:</label>
                        <select
                            value={medioPago}
                            onChange={(e) => setMedioPago(e.target.value)}
                            required
                        >
                            <option value="">Selecciona un método de pago</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </div>
                    {(medioPago === 'Tarjeta' || medioPago === 'Transferencia') && (
                        <div className="form-group">
                            <label>Banco:</label>
                            <select
                                value={idBanco}
                                onChange={(e) => setIdBanco(e.target.value)}
                                required
                            >
                                <option value="">Selecciona un banco</option>
                                {bancos.map(banco => (
                                    <option key={banco.IdBanco} value={banco.IdBanco}>
                                        {banco.NombreBanco}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <p>Total: {productosVenta.reduce((acc, prod) => acc + prod.Total, 0)}</p>
                    
                    <button type="submit" className="submit-button">Registrar Venta</button>
                </>
            );
        }
    }

    return (
        <div className="registro-ventas-container">
            <h2>Registrar Venta</h2>
            <p>Fecha Actual: {fechaActual}</p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Producto:</label>
                    <select
                        value={producto}
                        onChange={handleProductoChange}
                        required
                    >
                        <option value="">Selecciona un producto</option>
                        {productos.filter(prod => prod.Cantidad > 0).map(prod => (
                            <option key={prod.IdProducto} value={prod.IdProducto}>
                                {prod.NombreProducto}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Cantidad:</label>
                    <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                            const valor = parseInt(e.target.value, 10);

                            // Aceptar valores mayores a 0 sin bloquear
                            if (!isNaN(valor)) {
                                setCantidad(valor); 
                            }
                        }}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Precio Unitario:</label>
                    <input
                        type="number"
                        value={precioUnitario}
                        onChange={(e) => setPrecioUnitario(e.target.value)}
                        readOnly
                    />
                </div>
                <button type="button" onClick={agregarProducto}>Agregar Producto</button>

                <h3>Productos en la factura:</h3>
                <ul>
                    {productosVenta.map((prod, index) => (
                        <li key={index}>
                            {prod.NombreProducto} - Cantidad: {prod.Cantidad} - Precio: {prod.PrecioUnitario} - Total: {prod.Total}
                            <button type="button" onClick={() => eliminarProducto(index)}>Eliminar</button>
                        </li>
                    ))}
                </ul>

                <h4>Total de la factura: {productosVenta.reduce((acc, prod) => acc + prod.Total, 0)}</h4>

                <div className="form-group">
                    <label>Cédula del cliente:</label>
                    <input
                        type="text"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        required
                    />
                </div>
                <button onClick={buscarCliente} className="boton-buscar">Buscar cliente</button>
                {renderizarFormulario()}
            </form>
        </div>
    );
}

export default RegistroVentas;
