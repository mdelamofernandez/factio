const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
const { supabase, pool } = require('./db');

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ====================== CLIENTES ======================
app.get('/clientes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cliente')
            .select(`
                cod_usuario,
                Edad,
                Estudios_Trabajo,
                Orientacion_sexual,
                usuario:cod_usuario(Email, Nombre)
            `);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/clientes/:id', async (req, res) => {
    const { Edad, Estudios_Trabajo, Orientacion_sexual } = req.body;

    if (!Edad || !Estudios_Trabajo || !Orientacion_sexual) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    try {
        const { data: clienteData, error: clienteError } = await supabase
            .from('cliente')
            .update({ Edad, Estudios_Trabajo, Orientacion_sexual })
            .eq('cod_usuario', req.params.id)
            .select();

        if (clienteError) throw clienteError;
        res.json(clienteData[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================== EMPRESAS ======================
app.get('/empresas/:nif/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo)
            `)
            .eq('NIF', req.params.nif);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================== EVENTOS ======================
app.get('/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo),
                empresa:NIF(Nombre)
            `);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/eventos/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo, Direccion),
                empresa:NIF(Nombre)
            `)
            .eq('cod_evento', req.params.id)
            .single();

        if (error) throw error;
        data ? res.json(data) : res.status(404).json({ error: "Evento no encontrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/eventos/:id', async (req, res) => {
    const { nombre, hora_inicio, hora_finalizacion } = req.body;

    try {
        const { data, error } = await supabase
            .from('evento')
            .update({ nombre, hora_inicio, hora_finalizacion })
            .eq('cod_evento', req.params.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================== LOCALES ======================
app.get('/locales/:id/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                empresa:NIF(Nombre)
            `)
            .eq('cod_local', req.params.id);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor Supabase escuchando en http://localhost:${port}`);
});