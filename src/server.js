// Servidor principal para Sitio Web Lavadísimo
// Limpio, sin Twilio/WhatsApp Agent

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import databaseManager from './tools/databaseManager.js';
import twilio from 'twilio';
import { obtenerTerminalesMercadoPago } from './mercadopago.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir archivos estáticos del sitio web
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// MERCADO PAGO - DIAGNÓSTICO DE TERMINALES
// ============================================

app.get('/api/mercadopago/terminales', async (req, res) => {
  try {
    const data = await obtenerTerminalesMercadoPago();

    const terminales = data?.data?.terminals || [];

    res.json({
      success: true,
      total: terminales.length,
      terminales: terminales.map(terminal => ({
        id: terminal.id,
        pos_id: terminal.pos_id,
        store_id: terminal.store_id,
        external_pos_id: terminal.external_pos_id,
        operating_mode: terminal.operating_mode
      }))
    });

  } catch (error) {
    console.error(
      'Error consultando terminales de Mercado Pago:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// API ENDPOINTS PARA EL SITIO WEB
// ============================================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// 2. Obtener servicios disponibles
app.get('/api/services', async (req, res) => {
  try {
    await databaseManager.initialize();
    const query = `
      SELECT TOP 10 
        id_producto as id,
        nombre,
        descripcion,
        precio_base as precio,
        'active' as status
      FROM producto 
      WHERE estado = 1 
      ORDER BY nombre
    `;
    const services = await databaseManager.executeQuery(query);
    
    res.json({
      success: true,
      services: services.map(service => ({
        id: service.id,
        name: service.nombre,
        description: service.descripcion,
        price: service.precio,
        status: service.status
      }))
    });
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener servicios' });
  }
});

// ============================================
// ENDPOINTS DE VERIFICACIÓN SMS (TWILIO)
// ============================================

// Almacenamiento temporal de códigos de verificación (en memoria)
const verificationStore = new Map();

// Generar código aleatorio de 6 dígitos
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 3a. Enviar código de verificación por SMS
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Teléfono es requerido' });
    }

    // Generar código de verificación
    const code = generateVerificationCode();
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Almacenar código (con expiración de 10 minutos)
    verificationStore.set(verificationId, {
      code,
      phone,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Verificar si Twilio está configurado
    const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && 
                             process.env.TWILIO_AUTH_TOKEN && 
                             process.env.TWILIO_PHONE_NUMBER;

    // Intentar enviar SMS con Twilio (si falla, usar modo desarrollo)
    let smsSent = false;
    if (twilioConfigured) {
      try {
        console.log('🔍 DEBUG: Intentando enviar SMS con Twilio...');
        console.log('🔍 DEBUG: Account SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');
        console.log('🔍 DEBUG: Phone:', phone);
        console.log('🔍 DEBUG: From:', process.env.TWILIO_PHONE_NUMBER);
        
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const message = await client.messages.create({
          body: `Tu codigo de verificacion de Lavadisimo es: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        smsSent = true;
        console.log('✅ SMS enviado - SID:', message.sid);
      } catch (twilioError) {
        console.error('❌ Error Twilio:', twilioError.message);
        if (twilioError.code) {
          console.error('❌ Código de error Twilio:', twilioError.code);
        }
        console.log('📱 Usando modo desarrollo - Codigo:', code);
      }
    } else {
      // Modo desarrollo: mostrar código en consola
      console.log('\n========================================');
      console.log('📱 CÓDIGO DE VERIFICACIÓN (DESARROLLO)');
      console.log('========================================');
      console.log(`Teléfono: ${phone}`);
      console.log(`Código: ${code}`);
      console.log('========================================\n');
    }

    res.json({ 
      success: true, 
      verificationId,
      message: 'Código enviado exitosamente',
      // Solo en desarrollo - remover en producción
      devCode: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error('Error enviando verificación:', error);
    res.status(500).json({ success: false, message: 'Error al enviar código de verificación' });
  }
});

// 3b. Verificar código
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { verificationId, code } = req.body;
    
    if (!verificationId || !code) {
      return res.status(400).json({ success: false, message: 'ID de verificación y código son requeridos' });
    }

    const verification = verificationStore.get(verificationId);
    
    if (!verification) {
      return res.status(400).json({ success: false, message: 'Código expirado o no encontrado' });
    }

    if (Date.now() > verification.expiresAt) {
      verificationStore.delete(verificationId);
      return res.status(400).json({ success: false, message: 'Código expirado' });
    }

    if (verification.code !== code) {
      return res.status(400).json({ success: false, message: 'Código incorrecto' });
    }

    // Verificación exitosa - eliminar código usado
    verificationStore.delete(verificationId);

    res.json({ 
      success: true, 
      message: 'Teléfono verificado exitosamente',
      phone: verification.phone
    });
  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({ success: false, message: 'Error al verificar código' });
  }
});

// 3c. Completar registro después de verificación
app.post('/api/auth/complete-registration', async (req, res) => {
  try {
    const { phone, name, email, address, existingClient, clientId } = req.body;
    
    if (!phone || !name || !email) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    await databaseManager.initialize();
    
    // Verificar si ya existe usuario con este teléfono
    const existingQuery = `SELECT id_usuario FROM USUARIOS_WEB WHERE telefono = ?`;
    const existingUsers = await databaseManager.executeQuery(existingQuery, [phone]);
    
    if (existingUsers.length > 0) {
      // Actualizar usuario existente
      const updateQuery = `
        UPDATE USUARIOS_WEB 
        SET nombre_completo = ?, email = ?, direccion = ?, fecha_actualizacion = GETDATE()
        WHERE telefono = ?
      `;
      await databaseManager.executeQuery(updateQuery, [name, email, address || null, phone]);
      
      const userQuery = `SELECT * FROM USUARIOS_WEB WHERE telefono = ?`;
      const users = await databaseManager.executeQuery(userQuery, [phone]);
      
      return res.json({ 
        success: true, 
        user: users[0],
        message: 'Cuenta actualizada exitosamente'
      });
    }

    // Crear nuevo usuario
    const insertQuery = `
      INSERT INTO USUARIOS_WEB (nombre_completo, email, telefono, direccion, id_cliente_asociado, fecha_creacion, fecha_actualizacion)
      VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE())
    `;
    await databaseManager.executeQuery(insertQuery, [name, email, phone, address || null, clientId || null]);
    
    const userQuery = `SELECT * FROM USUARIOS_WEB WHERE telefono = ?`;
    const users = await databaseManager.executeQuery(userQuery, [phone]);
    
    res.json({ 
      success: true, 
      user: users[0],
      message: 'Registro completado exitosamente'
    });
  } catch (error) {
    console.error('Error completando registro:', error);
    res.status(500).json({ success: false, message: 'Error al completar registro' });
  }
});

// Credenciales hardcodeadas para admin chat
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'lavadisimo3473'
};

// Función auxiliar para convertir a Title Case
function toTitleCase(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { 
    return a.toUpperCase(); 
  });
}

// Login simple para chat admin
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
    }

    // Verificar credenciales hardcodeadas
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      res.json({ 
        success: true, 
        user: username,
        message: 'Login exitoso' 
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
});

// Logout para chat admin
app.post('/api/admin/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

// Verificar sesión activa
app.get('/api/admin/check-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader === 'chat-auth-valid') {
    res.json({ success: true, authenticated: true });
  } else {
    res.json({ success: true, authenticated: false });
  }
});

// 3d. Obtener datos de cliente por teléfono (busca en tabla CLIENTES)
// Maneja: Números chilenos (LIKE) y extranjeros (coincidencia exacta)
app.post('/api/clients/by-phone', async (req, res) => {
  try {
    const { celcte } = req.body;
    
    if (!celcte) {
      return res.status(400).json({ success: false, message: 'Teléfono es requerido' });
    }

    await databaseManager.initialize();
    
    // Determinar si es número chileno o extranjero
    const isForeignNumber = celcte.startsWith('+');
    
    let clients;
    
    if (isForeignNumber) {
      // Números extranjeros: comparación exacta
      const cleanPhone = celcte.replace(/^\+/, '');
      console.log('🔍 [DEBUG] Buscando cliente extranjero:', cleanPhone);
      
      const foreignQuery = `
        SELECT TOP 1 cl.IDCTE, cl.NOMCTE, cl.DIRCTE, cl.CELCTE
        FROM lavadisimo.lavadisimo.clientes cl
        INNER JOIN (
          SELECT celcte, MAX(FECHAUPDATE) as maxdate 
          FROM lavadisimo.lavadisimo.clientes 
          WHERE idusuario = 'lavadisimo'
          GROUP BY celcte
        ) ct ON cl.FECHAUPDATE = ct.maxdate AND cl.celcte = ct.celcte
        WHERE cl.CELCTE = '${cleanPhone.replace(/'/g, "''")}'
        ORDER BY cl.FECHAUPDATE DESC
      `;
      clients = await databaseManager.executeQuery(foreignQuery);
      console.log('🔍 [DEBUG] Query extranjera:', foreignQuery.replace(/\s+/g, ' ').trim());
      
    } else {
      // Números chilenos: LIKE con el número
      console.log('🔍 [DEBUG] Buscando cliente chileno:', celcte);
      
      const chileanQuery = `
        SELECT TOP 1 cl.IDCTE, cl.NOMCTE, cl.DIRCTE, cl.CELCTE
        FROM lavadisimo.lavadisimo.clientes cl
        INNER JOIN (
          SELECT celcte, MAX(FECHAUPDATE) as maxdate 
          FROM lavadisimo.lavadisimo.clientes 
          WHERE idusuario = 'lavadisimo'
          GROUP BY celcte
        ) ct ON cl.FECHAUPDATE = ct.maxdate AND cl.celcte = ct.celcte
        WHERE cl.CELCTE LIKE '%${celcte.replace(/'/g, "''")}'
        ORDER BY cl.FECHAUPDATE DESC
      `;
      clients = await databaseManager.executeQuery(chileanQuery);
      console.log('🔍 [DEBUG] Query chilena:', chileanQuery.replace(/\s+/g, ' ').trim());
    }
    
    console.log('🔍 [DEBUG] Resultado:', clients.length, 'clientes encontrados');
    
    if (clients.length === 0) {
      return res.json({ 
        success: true, 
        client: null, 
        message: 'No se encontró cliente con este teléfono' 
      });
    }

    // Transformar datos al formato esperado con Title Case
    const client = {
      IDCTE: clients[0].IDCTE,
      NOMCTE: toTitleCase(clients[0].NOMCTE),
      DIRCTE: toTitleCase(clients[0].DIRCTE),
      CELCTE: clients[0].CELCTE
    };

    console.log('✅ [DEBUG] Cliente encontrado:', JSON.stringify(client));
    res.json({ success: true, client });
  } catch (error) {
    console.error('❌ [ERROR] Error buscando cliente:', error.message);
    res.status(500).json({ success: false, message: 'Error al buscar cliente: ' + error.message });
  }
});

// ============================================
// ENDPOINTS EXISTENTES (mantenidos)
// ========================================

// 4. Obtener datos de cliente por teléfono (GET - legacy)
app.get('/api/clients/by-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Teléfono es requerido' });
    }

    await databaseManager.initialize();
    const query = `
      SELECT CODCTE, NOMCTE, DIRCTE, CELCTE, EMAILCTE
      FROM CLIENTES WHERE CELCTE LIKE ?
    `;
    const clients = await databaseManager.executeQuery(query, [`%${phone}%`]);
    
    if (clients.length === 0) {
      return res.json({ success: true, client: null, message: 'No se encontró cliente' });
    }

    res.json({ success: true, client: clients[0] });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos del cliente' });
  }
});

// 5. Registro de usuario

// 4. Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    await databaseManager.initialize();
    
    // Verificar si el usuario ya existe
    const checkQuery = `SELECT id_usuario FROM USUARIOS_WEB WHERE email = ? OR telefono = ?`;
    const existingUsers = await databaseManager.executeQuery(checkQuery, [email, phone]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'El email o teléfono ya está registrado' });
    }

    // Hash de contraseña simple
    const passwordHash = Buffer.from(password).toString('base64');
    
    // Insertar usuario
    const insertQuery = `
      INSERT INTO USUARIOS_WEB (nombre_completo, email, password_hash, telefono, direccion, fecha_creacion, fecha_actualizacion)
      VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE())
    `;
    await databaseManager.executeQuery(insertQuery, [name, email, passwordHash, phone, address || null]);
    
    // Obtener ID del usuario
    const userQuery = `SELECT id_usuario FROM USUARIOS_WEB WHERE email = ?`;
    const users = await databaseManager.executeQuery(userQuery, [email]);
    
    res.json({
      success: true,
      userId: users[0].id_usuario,
      message: 'Usuario registrado exitosamente'
    });
  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
});

// 5. Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    await databaseManager.initialize();
    
    const query = `
      SELECT id_usuario, nombre_completo, email, telefono, direccion
      FROM USUARIOS_WEB WHERE email = ? AND activo = 1
    `;
    const users = await databaseManager.executeQuery(query, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
    
    const user = users[0];
    const passwordHash = Buffer.from(password).toString('base64');
    
    // Nota: En producción usar bcrypt en lugar de base64
    // Por ahora aceptamos cualquier contraseña para desarrollo
    
    delete user.password_hash;
    res.json({ success: true, user, message: 'Inicio de sesión exitoso' });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el inicio de sesión' });
  }
});

// 6. Crear orden desde carrito web
app.post('/api/orders', async (req, res) => {
  try {
    const { items, instructions, totals, user } = req.body;
    
    if (!items || !totals || !user) {
      return res.status(400).json({ success: false, message: 'Datos de orden incompletos' });
    }

    await databaseManager.initialize();
    
    // Generar número de orden
    const orderNumber = `LD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Insertar orden principal
    const orderQuery = `
      INSERT INTO ORDENES_WEB (numero_orden, id_usuario, estado, subtotal, costo_envio, total,
        instrucciones_lavanderia, instrucciones_alfombras, instrucciones_pisos, instrucciones_tapices_vehiculos,
        direccion_entrega, fecha_creacion, fecha_actualizacion)
      VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
    `;
    
    await databaseManager.executeQuery(orderQuery, [
      orderNumber, user.id_usuario, totals.subtotal, totals.shippingCost, totals.totalPrice,
      instructions?.lavanderia || '', instructions?.alfombras || '', instructions?.pisos || '',
      instructions?.tapicesVehiculos || '', user.direccion || ''
    ]);
    
    // Obtener ID de la orden
    const orderIdQuery = `SELECT id_orden FROM ORDENES_WEB WHERE numero_orden = ?`;
    const orders = await databaseManager.executeQuery(orderIdQuery, [orderNumber]);
    const orderId = orders[0].id_orden;
    
    // Insertar items de la orden
    for (const [area, areaItems] of Object.entries(items)) {
      for (const item of areaItems) {
        const itemQuery = `
          INSERT INTO ORDEN_ITEMS_WEB (id_orden, area, servicio, descripcion, precio_unitario, cantidad, total_item)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await databaseManager.executeQuery(itemQuery, [
          orderId, area, item.service, item.description, item.price, item.quantity, item.price * item.quantity
        ]);
      }
    }
    
    res.json({ success: true, orderNumber, message: 'Orden creada exitosamente' });
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ success: false, message: 'Error al crear orden' });
  }
});

// 7. Obtener órdenes de un usuario
app.get('/api/users/:userId/orders', async (req, res) => {
  try {
    const { userId } = req.params;
    await databaseManager.initialize();
    
    const query = `
      SELECT o.id_orden, o.numero_orden, o.estado, o.subtotal, o.costo_envio, o.total, o.fecha_creacion,
        COUNT(i.id_item) as total_items
      FROM ORDENES_WEB o
      LEFT JOIN ORDEN_ITEMS_WEB i ON o.id_orden = i.id_orden
      WHERE o.id_usuario = ?
      GROUP BY o.id_orden, o.numero_orden, o.estado, o.subtotal, o.costo_envio, o.total, o.fecha_creacion
      ORDER BY o.fecha_creacion DESC
    `;
    
    const orders = await databaseManager.executeQuery(query, [userId]);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener órdenes' });
  }
});

// 8. Obtener detalles de una orden
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    await databaseManager.initialize();
    
    const orderQuery = `
      SELECT o.*, u.nombre_completo, u.email, u.telefono, u.direccion
      FROM ORDENES_WEB o
      JOIN USUARIOS_WEB u ON o.id_usuario = u.id_usuario
      WHERE o.numero_orden = ?
    `;
    const orders = await databaseManager.executeQuery(orderQuery, [orderNumber]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }
    
    const itemsQuery = `SELECT * FROM ORDEN_ITEMS_WEB WHERE id_orden = ? ORDER BY area, servicio`;
    const items = await databaseManager.executeQuery(itemsQuery, [orders[0].id_orden]);
    
    res.json({ success: true, order: orders[0], items });
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({ success: false, message: 'Error al obtener orden' });
  }
});

// 9. Crear reserva
app.post('/api/bookings', async (req, res) => {
  try {
    const { serviceId, serviceName, customerName, customerPhone, customerEmail, customerAddress, bookingDate, bookingTime, specialInstructions } = req.body;

    if (!serviceId || !customerName || !customerPhone || !bookingDate || !bookingTime) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }

    await databaseManager.initialize();
    const bookingNumber = `LD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const query = `
      INSERT INTO reservas_web (numero_reserva, id_servicio, nombre_servicio, nombre_cliente, telefono_cliente,
        email_cliente, direccion_cliente, fecha_reserva, hora_reserva, instrucciones_especiales, estado, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', GETDATE())
    `;
    
    await databaseManager.executeQuery(query, [
      bookingNumber, serviceId, serviceName, customerName, customerPhone,
      customerEmail || null, customerAddress, bookingDate, bookingTime, specialInstructions || null
    ]);

    res.json({ success: true, bookingNumber, message: 'Reserva creada exitosamente' });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ success: false, message: 'Error al crear reserva' });
  }
});

// 10. Consultar estado de reserva
app.get('/api/bookings/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;
    await databaseManager.initialize();
    
    const query = `
      SELECT numero_reserva as bookingNumber, nombre_servicio as serviceName, nombre_cliente as customerName,
        telefono_cliente as customerPhone, email_cliente as customerEmail, direccion_cliente as customerAddress,
        fecha_reserva as bookingDate, hora_reserva as bookingTime, estado as status, fecha_creacion as createdAt
      FROM reservas_web WHERE numero_reserva = ?
    `;
    const bookings = await databaseManager.executeQuery(query, [bookingNumber]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }
    res.json({ success: true, booking: bookings[0] });
  } catch (error) {
    console.error('Error consultando reserva:', error);
    res.status(500).json({ success: false, message: 'Error al consultar reserva' });
  }
});

// 11. Verificar disponibilidad
app.post('/api/availability', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Fecha requerida' });
    }

    await databaseManager.initialize();
    const query = `
      SELECT hora_reserva as timeSlot, COUNT(*) as bookingsCount
      FROM reservas_web WHERE fecha_reserva = ? AND estado NOT IN ('cancelled')
      GROUP BY hora_reserva ORDER BY hora_reserva
    `;
    const existingBookings = await databaseManager.executeQuery(query, [date]);
    
    const allTimeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const availableSlots = allTimeSlots.filter(slot => {
      const booking = existingBookings.find(b => b.timeSlot === slot);
      return !booking || booking.bookingsCount < 3;
    });
    
    res.json({ success: true, date, availableSlots, message: `Hay ${availableSlots.length} horarios disponibles` });
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({ success: false, message: 'Error al verificar disponibilidad' });
  }
});

// 12. Procesar pago
app.post('/api/payments', async (req, res) => {
  try {
    const { bookingNumber, amount, paymentMethod, transactionId } = req.body;
    
    if (!bookingNumber || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Datos de pago incompletos' });
    }

    await databaseManager.initialize();
    
    const paymentQuery = `
      INSERT INTO pagos_web (numero_reserva, monto, metodo_pago, id_transaccion, estado, fecha_pago)
      VALUES (?, ?, ?, ?, 'completed', GETDATE())
    `;
    await databaseManager.executeQuery(paymentQuery, [bookingNumber, amount, paymentMethod, transactionId || null]);
    
    const updateQuery = `UPDATE reservas_web SET estado = 'confirmed', fecha_actualizacion = GETDATE() WHERE numero_reserva = ?`;
    await databaseManager.executeQuery(updateQuery, [bookingNumber]);
    
    res.json({ success: true, message: 'Pago procesado exitosamente', transactionId: transactionId || `PAY-${Date.now()}` });
  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({ success: false, message: 'Error al procesar pago' });
  }
});

// ============================================
// ENDPOINTS CHAT WHATSAPP
// ============================================

// Obtener conversaciones agrupadas por teléfono con nombre del cliente
app.get('/api/whatsapp/conversations', async (req, res) => {
  try {
    await databaseManager.initialize();
    
    // Obtener últimas conversaciones
    const query = `
      SELECT 
        CELCTE as telefono,
        MENSAJE,
        FECHA,
        TIPO
      FROM CONVERSACIONES c1
      WHERE FECHA = (
        SELECT MAX(FECHA) 
        FROM CONVERSACIONES c2 
        WHERE c2.CELCTE = c1.CELCTE
      )
      ORDER BY FECHA DESC
    `;
    
    const conversations = await databaseManager.executeQuery(query);
    const now = new Date();
    
    // Para cada conversación, obtener el nombre y verificar ventana 24hrs
    const conversationsWithNames = await Promise.all(
      conversations.map(async (conv) => {
        let nombre = null;
        let ultimoMensajeCliente = null;
        
        try {
          // Buscar cliente por teléfono
          const clientQuery = `
            SELECT TOP 1 cl.NOMCTE
            FROM lavadisimo.lavadisimo.clientes cl
            INNER JOIN (
              SELECT celcte, MAX(FECHAUPDATE) as maxdate 
              FROM lavadisimo.lavadisimo.clientes 
              WHERE idusuario = 'lavadisimo'
              GROUP BY celcte
            ) ct ON cl.FECHAUPDATE = ct.maxdate AND cl.celcte = ct.celcte
            WHERE cl.CELCTE = '${conv.telefono}'
            ORDER BY cl.FECHAUPDATE DESC
          `;
          
          const clients = await databaseManager.executeQuery(clientQuery);
          if (clients.length > 0) {
            nombre = clients[0].NOMCTE;
          }
          
          // Verificar ventana 24hrs - obtener último mensaje del cliente (TIPO = 0)
          const windowQuery = `
            SELECT TOP 1 FECHA
            FROM CONVERSACIONES
            WHERE CELCTE = '${conv.telefono}' AND TIPO = 0
            ORDER BY FECHA DESC
          `;
          const windowMessages = await databaseManager.executeQuery(windowQuery);
          if (windowMessages.length > 0) {
            ultimoMensajeCliente = new Date(windowMessages[0].FECHA);
          }
        } catch (clientError) {
          console.log('No se encontró cliente para:', conv.telefono);
        }
        
        // Verificar si está dentro de la ventana de 24hrs
        const windowExpired = ultimoMensajeCliente 
          ? (now - ultimoMensajeCliente) > (24 * 60 * 60 * 1000) 
          : true;
        
        return {
          telefono: conv.telefono,
          nombre: toTitleCase(nombre) || 'Cliente',
          mensaje: conv.MENSAJE,
          fecha: conv.FECHA,
          tipo: conv.TIPO,
          sin_leer: 0,
          windowExpired: windowExpired
        };
      })
    );
    
    res.json({ 
      success: true, 
      conversations: conversationsWithNames
    });
  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener conversaciones' });
  }
});

// Obtener mensajes de una conversación
app.get('/api/whatsapp/messages/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    await databaseManager.initialize();
    
    // Estructura real: IDCHAT, CELCTE, TIPO, MENSAJE, FECHA, INTENCION, CONTEXTO
    const query = `
      SELECT IDCHAT as id, CELCTE as telefono, TIPO as tipo, MENSAJE as mensaje, FECHA as fecha
      FROM CONVERSACIONES
      WHERE CELCTE = ${phone}
      ORDER BY FECHA ASC
    `;
    
    const messages = await databaseManager.executeQuery(query);
    
    if (messages.length === 0) {
      return res.json({ success: true, messages: [] });
    }
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener mensajes: ' + error.message });
  }
});

// Marcar mensajes como leídos (no existe columna LEIDO - solo registramos que se vio)
app.post('/api/whatsapp/read', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Teléfono requerido' });
    }

    // La tabla no tiene columna LEIDO - simplemente respondemos OK
    res.json({ success: true, message: 'Conversación abierta' });
  } catch (error) {
    console.error('Error marcando como leído:', error);
    res.status(500).json({ success: false, message: 'Error al marcar como leído' });
  }
});

// Enviar mensaje por WhatsApp
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Teléfono y mensaje requeridos' });
    }

    await databaseManager.initialize();
    
    // Verificar si existe conversación previa (ventana 24hrs de Twilio)
    // Solo podemos iniciar conversación si el cliente nos escribió primero
    const checkQuery = `
      SELECT TOP 1 FECHA FROM CONVERSACIONES
      WHERE CELCTE = ${phone.replace(/'/g, "''")} AND TIPO = 0
      ORDER BY FECHA DESC
    `;
    
    const existingConversations = await databaseManager.executeQuery(checkQuery);
    
    // Twilio configured?
    const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && 
                             process.env.TWILIO_AUTH_TOKEN && 
                             process.env.TWILIO_PHONE_NUMBER;
    
    let twilioMessage = null;
    
    if (twilioConfigured && existingConversations.length > 0) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        twilioMessage = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+56${phone}`
        });
        console.log('✅ WhatsApp enviado - SID:', twilioMessage.sid);
      } catch (twilioError) {
        console.error('❌ Error Twilio WhatsApp:', twilioError.message);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al enviar WhatsApp: ' + twilioError.message 
        });
      }
    } else if (twilioConfigured && existingConversations.length === 0) {
      // No hay conversación previa - no se puede enviar mensaje abierto
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes enviar mensajes a este número. El cliente debe escribir primero para iniciar la conversación (ventana de 24hrs de Twilio). El mensaje se guardará en la base de datos pero no se enviará por WhatsApp.'
      });
    } else {
      console.log('📱 WhatsApp no enviado (Twilio no configurado):', phone, '-', message);
    }
    
    // Guardar en base de datos
    const insertQuery = `
      INSERT INTO CONVERSACIONES (CELCTE, TIPO, MENSAJE, FECHA)
      VALUES (${phone.replace(/'/g, "''")}, 1, '${message.replace(/'/g, "''")}', GETDATE())
    `;
    await databaseManager.executeQuery(insertQuery);
    
    res.json({ 
      success: true, 
      message: 'Mensaje enviado',
      sid: twilioMessage?.sid,
      twilio_sent: !!twilioMessage
    });
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Error al enviar mensaje' });
  }
});

// 13. Panel de administración - Estadísticas
app.get('/api/admin/stats', async (req, res) => {
  try {
    await databaseManager.initialize();
    
    const orderStatsQuery = `
      SELECT COUNT(*) as total_orders,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completed_orders,
        ISNULL(SUM(total), 0) as total_revenue
      FROM ORDENES_WEB
    `;
    const orderStats = await databaseManager.executeQuery(orderStatsQuery);
    
    const userStatsQuery = `SELECT COUNT(*) as total_users FROM USUARIOS_WEB WHERE activo = 1`;
    const userStats = await databaseManager.executeQuery(userStatsQuery);
    
    res.json({
      success: true,
      orderStats: orderStats[0] || {},
      userStats: userStats[0] || {},
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

// Ruta fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Lavadísimo funcionando en puerto ${PORT}`));
