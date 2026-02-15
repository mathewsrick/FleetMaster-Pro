import * as service from './contact.services';
export const submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }
        await service.sendContactEmail(name, email, message);
        res.json({ success: true, message: 'Mensaje enviado correctamente.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al enviar el mensaje. Intente más tarde.' });
    }
};
