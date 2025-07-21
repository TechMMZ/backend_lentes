import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicialización del cliente
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN, // Token en .env
});

export const crearPago = async (req, res) => {
    try {
        const { carrito } = req.body;

        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío.' });
        }

        const preference = new Preference(client);

        const body = {
            items: carrito.map((item) => ({
                title: item.nombre,
                unit_price: Number(item.precio),
                quantity: item.cantidad,
                currency_id: 'PEN',
            })),
            back_urls: {
                success: `${process.env.FRONTEND_URL}/pago-exitoso`,
                failure: `${process.env.FRONTEND_URL}/pago-fallido`,
                pending: `${process.env.FRONTEND_URL}/pago-pendiente`,
            },
            auto_return: 'approved',
        };

        const response = await preference.create({ body });

        res.json({
            id: response.id,
            init_point: response.init_point,
        });
    } catch (error) {
        console.error('Error creando preferencia:', error);
        res.status(500).json({ error: 'Hubo un problema creando el pago.' });
    }
};
