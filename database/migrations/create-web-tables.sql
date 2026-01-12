-- Tabla de usuarios web
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='USUARIOS_WEB' AND xtype='U')
BEGIN
    CREATE TABLE USUARIOS_WEB (
        id_usuario INT IDENTITY(1,1) PRIMARY KEY,
        nombre_completo NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        telefono NVARCHAR(20) NOT NULL UNIQUE,
        direccion NVARCHAR(200),
        region NVARCHAR(50) DEFAULT 'Coquimbo',
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    )
END
GO

-- Tabla de órdenes web
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ORDENES_WEB' AND xtype='U')
BEGIN
    CREATE TABLE ORDENES_WEB (
        id_orden INT IDENTITY(1,1) PRIMARY KEY,
        numero_orden NVARCHAR(50) NOT NULL UNIQUE,
        id_usuario INT NOT NULL,
        estado NVARCHAR(20) DEFAULT 'pendiente',
        subtotal DECIMAL(10,2) DEFAULT 0,
        costo_envio DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        instrucciones_lavanderia NVARCHAR(500),
        instrucciones_alfombras NVARCHAR(500),
        instrucciones_pisos NVARCHAR(500),
        instrucciones_tapices_vehiculos NVARCHAR(500),
        direccion_entrega NVARCHAR(200),
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS_WEB(id_usuario)
    )
END
GO

-- Tabla de items de órdenes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ORDEN_ITEMS_WEB' AND xtype='U')
BEGIN
    CREATE TABLE ORDEN_ITEMS_WEB (
        id_item INT IDENTITY(1,1) PRIMARY KEY,
        id_orden INT NOT NULL,
        area NVARCHAR(50) NOT NULL,
        servicio NVARCHAR(100) NOT NULL,
        descripcion NVARCHAR(200),
        precio_unitario DECIMAL(10,2) DEFAULT 0,
        cantidad INT DEFAULT 1,
        total_item DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (id_orden) REFERENCES ORDENES_WEB(id_orden)
    )
END
GO

-- Tabla de reservas web
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RESERVAS_WEB' AND xtype='U')
BEGIN
    CREATE TABLE RESERVAS_WEB (
        id_reserva INT IDENTITY(1,1) PRIMARY KEY,
        numero_reserva NVARCHAR(50) NOT NULL UNIQUE,
        id_servicio INT,
        nombre_servicio NVARCHAR(100),
        nombre_cliente NVARCHAR(100) NOT NULL,
        telefono_cliente NVARCHAR(20) NOT NULL,
        email_cliente NVARCHAR(100),
        direccion_cliente NVARCHAR(200),
        fecha_reserva DATE NOT NULL,
        hora_reserva NVARCHAR(10) NOT NULL,
        instrucciones_especiales NVARCHAR(500),
        metodo_pago NVARCHAR(50),
        precio_estimado DECIMAL(10,2) DEFAULT 0,
        estado NVARCHAR(20) DEFAULT 'pending',
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    )
END
GO

-- Tabla de pagos web
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PAGOS_WEB' AND xtype='U')
BEGIN
    CREATE TABLE PAGOS_WEB (
        id_pago INT IDENTITY(1,1) PRIMARY KEY,
        numero_reserva NVARCHAR(50) NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        metodo_pago NVARCHAR(50) NOT NULL,
        id_transaccion NVARCHAR(100),
        email_cliente NVARCHAR(100),
        nombre_cliente NVARCHAR(100),
        estado NVARCHAR(20) DEFAULT 'pending',
        fecha_pago DATETIME DEFAULT GETDATE()
    )
END
GO
-- Índices para mejorar rendimiento
