const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;
const { supabase, pool } = require('./db'); // Asegúrate de que db.js exporta 'supabase' y 'pool' correctamente

// Middleware para habilitar CORS
app.use(cors());
// Middleware para parsear el cuerpo de las peticiones como JSON
app.use(express.json());

// Clave secreta para firmar los tokens JWT
const JWT_SECRET = 'factiodb'; // ¡Clave secreta para JWT! Considera usar una variable de entorno.

// Middleware para verificar el token JWT de admin_empresa
const authenticateAdminEmpresa = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Autenticación requerida' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { data: admin, error } = await supabase
            .from('admin_empresa')
            .select('id_admin')
            .eq('id_admin', decoded.adminId)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Autenticación inválida' });
        }

        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ====================== AUTENTICACIÓN DE ADMIN_EMPRESA ======================
app.post('/admin/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        const { data: existingAdmin, error: existingAdminError } = await supabase
            .from('admin_empresa')
            .select('id_admin')
            .eq('cod_usuario', email) // Asumiendo que el email se guarda en cod_usuario
            .single();

        if (existingAdminError && existingAdminError.code !== 'PGRST116') { // PGRST116 = No rows found, which is expected
            throw existingAdminError;
        }


        if (existingAdmin) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Primero crea el usuario en la tabla 'usuario' si aún no existe (puede que ya exista si es un cliente)
        // Nota: Esta lógica puede variar dependiendo de cómo manejas usuarios vs admin_empresa
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .insert([{ cod_usuario: email, Email: email, Nombre: 'Admin Empresa' }]) // Asumiendo campos minimos de usuario
            .select('cod_usuario')
            .single()
            .onConflict('cod_usuario') // Si el usuario ya existe, no hagas nada (o actualiza si es necesario)
            .ignore(); // O .update(...) si necesitas actualizar algo

        if (usuarioError && usuarioError.code !== '23505') { // 23505 = duplicate key, handled by onConflict
            console.error('Error creating or finding user for admin:', usuarioError.message);
            // Decide cómo manejar si el usuario ya existe pero no se actualiza/selecciona correctamente
        }

        // Luego crea la entrada en admin_empresa
        const { data: newAdmin, error: newAdminError } = await supabase
            .from('admin_empresa')
            .insert([{ cod_usuario: email, password: hashedPassword }]) // Usa el mismo cod_usuario
            .select('id_admin, cod_usuario')
            .single(); // Asumimos que solo insertas uno

        if (newAdminError) {
            // Si falla la inserción en admin_empresa, considera eliminar la entrada de usuario si la creaste aquí
            console.error('Error creating admin_empresa:', newAdminError.message);
            throw newAdminError;
        }


        res.status(201).json({ message: 'Administrador creado exitosamente', admin: newAdmin });

    } catch (err) {
        console.error('Signup Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        const { data: admin, error: adminError } = await supabase
            .from('admin_empresa')
            .select('id_admin, cod_usuario, password')
            .eq('cod_usuario', email) // Asumiendo que el email se guarda en cod_usuario
            .single();

        if (adminError && adminError.code !== 'PGRST116') { // PGRST116 = No rows found
            throw adminError;
        }


        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ adminId: admin.id_admin }, JWT_SECRET, { expiresIn: '1h' }); // Expira en 1 hora

        res.json({ token });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Ejemplo de ruta protegida para administradores de empresa
app.get('/admin/protected', authenticateAdminEmpresa, (req, res) => {
    res.json({ message: `Ruta protegida para el administrador de empresa con ID: ${req.adminId}` });
});

// ====================== CLIENTES ======================
// MODIFICADA: Incluye la ubicación (latitude, longitude) del usuario relacionado
app.get('/clientes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cliente')
            .select(`
                cod_usuario,
                Edad,
                Estudios_Trabajo,
                Orientacion_sexual,
                usuario:cod_usuario(
                    Email,
                    Nombre,
                    -- Añadir selección de coordenadas del usuario desde la tabla usuario
                    location::geometry -> ST_Y as latitude,
                    location::geometry -> ST_X as longitude
                )
            `);

        if (error) throw error;
        // Cada objeto cliente ahora tendrá un objeto 'usuario' con 'latitude' y 'longitude'
        res.json(data);
    } catch (err) {
        console.error('Error fetching clients:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/clientes/:id', async (req, res) => {
    const { Edad, Estudios_Trabajo, Orientacion_sexual } = req.body;

    // Puedes añadir validación aquí si necesitas que todos los campos estén presentes
    // if (!Edad || !Estudios_Trabajo || !Orientacion_sexual) {
    //     return res.status(400).json({ error: "Todos los campos son requeridos" });
    // }

    try {
        // Solo actualiza los campos que se proporcionan en el body
        const updateData = {};
        if (Edad !== undefined) updateData.Edad = Edad;
        if (Estudios_Trabajo !== undefined) updateData.Estudios_Trabajo = Estudios_Trabajo;
        if (Orientacion_sexual !== undefined) updateData.Orientacion_sexual = Orientacion_sexual;

        // Si no hay campos para actualizar, retorna un mensaje o error
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar" });
        }


        const { data: clienteData, error: clienteError } = await supabase
            .from('cliente')
            .update(updateData)
            .eq('cod_usuario', req.params.id) // Asumimos que el ID del cliente es cod_usuario
            .select(); // Opcional: seleccionar los datos actualizados

        if (clienteError) throw clienteError;

        if (!clienteData || clienteData.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        res.json(clienteData[0]);
    } catch (err) {
        console.error('Error updating client:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ====================== USUARIOS (Rutas de Ubicación) ======================

// Ruta para actualizar la ubicación de un usuario específico
// Espera en el body: { latitude: number, longitude: number }
// El ID del usuario a actualizar viene en el parámetro URL :cod_usuario
// !!! IMPORTANTE: Implementa AUTENTICACIÓN/AUTORIZACIÓN aquí para asegurar que
// un usuario solo pueda actualizar SU PROPIA ubicación o que solo un admin pueda hacerlo.
app.put('/usuarios/:cod_usuario/location', async (req, res) => {
    const usuarioCod = req.params.cod_usuario;
    const { latitude, longitude } = req.body;

    // --- PENDIENTE DE IMPLEMENTAR AUTENTICACIÓN/AUTORIZACIÓN ---
    // Ej: Verificar si el usuario autenticado (por JWT u otro método) es el mismo que usuarioCod
    // if (req.user.cod_usuario !== usuarioCod) {
    //    return res.status(403).json({ error: 'No tienes permiso para actualizar esta ubicación' });
    // }
    // --- FIN PENDIENTE ---

    // Validar que se enviaron latitud y longitud
    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Valid latitude and longitude numbers are required' });
    }

    try {
        // Construir el valor del campo 'location' en formato WKT (Well-Known Text)
        // PostGIS y PostgREST pueden parsear este formato directamente
        // IMPORTANTE: POINT espera (longitude, latitude)
        const locationPointWkt = `POINT(${longitude} ${latitude})`;

        const { data, error } = await supabase
            .from('usuario') // Actualizar la tabla 'usuario'
            .update({ location: locationPointWkt })
            .eq('cod_usuario', usuarioCod) // Filtrar por el cod_usuario
            .select('cod_usuario, location::geometry -> ST_Y as latitude, location::geometry -> ST_X as longitude'); // Opcional: selecciona la ubicación actualizada para confirmar

        if (error) {
            console.error('Error updating user location:', error.message);
            throw new Error(`Database error updating location: ${error.message}`);
        }


        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado con ese código' });
        }

        res.json(data[0]); // Retorna el usuario actualizado con su nueva ubicación

    } catch (err) {
        console.error('Unhandled error updating user location:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Ruta para encontrar usuarios dentro de un radio específico
// Espera en los query params: ?lat=...&lon=...&radius=... (radius en metros)
// Opcional: Puedes proteger esta ruta si solo usuarios autenticados pueden buscar cercanos
app.get('/usuarios/nearby', async (req, res) => {
    const { lat, lon, radius } = req.query; // Recibe latitud, longitud y radio de los query params

    // Validar parámetros
    if (lat === undefined || lon === undefined || radius === undefined) {
        return res.status(400).json({ error: 'Parameters lat, lon, and radius are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMeters = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMeters) || radiusInMeters < 0) {
        return res.status(400).json({ error: 'Invalid parameters: lat, lon must be numbers, radius must be a non-negative number.' });
    }

    try {
        // Crear el punto de referencia en formato WKT para la consulta PostGIS
        // ST_SetSRID(ST_MakePoint(longitude, latitude), SRID) - aunque con WKT simple y filter basta
        const centerPointWkt = `POINT(${longitude} ${latitude})`; // WKT format

        // Usar el operador 'st_dwithin' de PostGIS a través del filtro de Supabase
        // El operador st_dwithin para GEOGRAPHY espera (punto_referencia, distancia_en_metros)
        const { data, error } = await supabase
            .from('usuario') // Consulta la tabla 'usuario'
            .select(`
                cod_usuario,
                Email,
                Nombre, -- Asumiendo que Nombre está en la tabla usuario
                -- Seleccionar coordenadas de los usuarios encontrados
                location::geometry -> ST_Y as latitude,
                location::geometry -> ST_X as longitude
            `)
            .not('location', 'is', null) // Opcional: Excluir usuarios sin ubicación registrada
            // st_dwithin es el operador PostGIS, ${centerPointWkt}, ${radiusInMeters} son los argumentos
            .filter('location', 'st_dwithin', `${centerPointWkt}, ${radiusInMeters}`);

        if (error) {
            console.error('Error fetching nearby users:', error.message);
            // Los errores de PostGIS pueden ser tricky. Asegúrate de que el SQL generado sea válido.
            // Si esto se vuelve complejo, considera crear una RPC/Función de Base de Datos en Supabase.
            throw new Error(`Database error finding nearby users: ${error.message}`);
        }

        // Los datos contendrán los usuarios encontrados dentro del radio, con sus coordenadas.
        res.json(data);

    } catch (err) {
        console.error('Unhandled error fetching nearby users:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// ====================== EMPRESAS ======================
// Esta sección no necesita cambios ya que no interactúa directamente con la ubicación del usuario
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
        console.error('Error fetching company events:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ====================== EVENTOS ======================
// Estas rutas no necesitan cambios ya que no interactúan directamente con la ubicación del usuario
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
        console.error('Error fetching all events:', err.message);
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

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            throw error;
        }


        data ? res.json(data) : res.status(404).json({ error: "Evento no encontrado" });
    } catch (err) {
        console.error('Error fetching event by ID:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/eventos/:id', async (req, res) => {
    const { nombre, hora_inicio, hora_finalizacion } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
    if (hora_finalizacion !== undefined) updateData.hora_finalizacion = hora_finalizacion;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    try {
        const { data, error } = await supabase
            .from('evento')
            .update(updateData)
            .eq('cod_evento', req.params.id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Evento no encontrado para actualizar" });
        }

        res.json(data[0]);
    } catch (err) {
        console.error('Error updating event:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ====================== LOCALES ======================
// Esta ruta no necesita cambios ya que no interactúa directamente con la ubicación del usuario
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
        console.error('Error fetching local events:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Evita enviar detalles sensibles en producción
    const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
    res.status(500).json({
        error: 'Error interno del servidor',
        detalles: errorMessage
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor Supabase escuchando en http://localhost:${port}`);
});