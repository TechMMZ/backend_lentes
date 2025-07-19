import mercadopago from 'mercadopago';

// Configuración inicial
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN, // Pon tu token en .env
});

export const crearPago = async (req, res) => {
    try {
        const { carrito } = req.body;

        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío.' });
        }

        const preference = {
            items: carrito.map((item) => ({
                title: item.nombre,
                unit_price: Number(item.precio),
                quantity: item.cantidad,
                currency_id: 'PEN', // Cambia según tu país (ARS, CLP, MXN)
            })),
            back_urls: {
                success: `${process.env.FRONTEND_URL}/pago-exitoso`,
                failure: `${process.env.FRONTEND_URL}/pago-fallido`,
                pending: `${process.env.FRONTEND_URL}/pago-pendiente`,
            },
            auto_return: 'approved',
        };

        const response = await mercadopago.preferences.create(preference);

        res.json({
            id: response.body.id,
            init_point: response.body.init_point, // URL para redirigir
        });
    } catch (error) {
        console.error('Error creando preferencia:', error);
        res.status(500).json({ error: 'Hubo un problema creando el pago.' });
    }
};
