# Agente de WhatsApp para Lavadísimo

Un agente inteligente de WhatsApp que permite a los clientes consultar precios de productos y verificar el estado de sus órdenes en tiempo real.

## 🚀 Características

- **Consulta de precios**: Los clientes pueden preguntar por precios de productos específicos
- **Verificación de estado**: Consulta el estado de órdenes por número de orden o teléfono
- **Integración con WhatsApp**: Funciona a través de Twilio WhatsApp Business API
- **Base de datos SQL Server**: Conecta con la base de datos existente de Lavadísimo
- **IA conversacional**: Utiliza OpenAI GPT-3.5-turbo para respuestas naturales

## 📋 Requisitos previos

- Node.js 20.19.4 o superior
- Cuenta de Twilio con WhatsApp Business API configurada
- Base de datos SQL Server con las tablas PRODUCTOS y ORDENES
- API Key de OpenAI

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/mcortezbut/lavadisimo-whatsapp-agent.git
cd lavadisimo-whatsapp-agent
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración de Twilio para WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_SANDBOX_NUMBER=whatsapp:+14155238886

# Configuración de OpenAI
OPENAI_API_KEY=tu_openai_api_key_aqui

# Configuración de Base de Datos SQL Server
DB_HOST=tu_servidor_sql_server
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=lavadisimo_db

# Puerto del servidor
PORT=3000
```

## 🗄️ Estructura de Base de Datos

El agente espera las siguientes tablas en SQL Server:

### Tabla PRODUCTOS
```sql
CREATE TABLE PRODUCTOS (
    NOMPROD NVARCHAR(255),
    PRECIO DECIMAL(10,2)
);
```

### Tabla ORDENES
```sql
CREATE TABLE ORDENES (
    NUMERO_ORDEN NVARCHAR(50),
    ESTADO NVARCHAR(100),
    FECHA_INGRESO DATETIME,
    FECHA_ENTREGA DATETIME,
    TELEFONO_CLIENTE NVARCHAR(20)
);
```

## 🚀 Uso

### Desarrollo
```bash
npm start
```

### Producción
```bash
npm run prod
```

El servidor se ejecutará en el puerto 3000 (o el especificado en PORT).

## 📱 Configuración de WhatsApp

1. **Configurar webhook en Twilio**
   - URL del webhook: `https://tu-dominio.com/webhook`
   - Método: POST

2. **Probar en Twilio Sandbox**
   - Envía `join [palabra-clave]` al número sandbox
   - Comienza a chatear con el agente

## 💬 Ejemplos de uso

### Consultar precios
```
Cliente: "¿Cuánto cuesta lavar una camisa?"
Agente: "Lavado camisa: $2500"
```

### Verificar estado de orden
```
Cliente: "¿Cómo va mi orden 12345?"
Agente: "Orden 12345: En proceso. Entrega: 15/01/2025"
```

## 🔧 Estructura del proyecto

```
lavadisimo-whatsapp-agent/
├── src/
│   ├── server.js              # Servidor Express principal
│   └── agent/
│       ├── manager.js         # Configuración del agente IA
│       └── tools/
│           ├── index.js       # Exportación de herramientas
│           ├── precioTool.js  # Herramienta consulta precios
│           └── estadoTool.js  # Herramienta verificar estado
├── package.json
├── .env.example
└── README.md
```

## 🛡️ Seguridad

- Las consultas SQL utilizan parámetros para prevenir inyección SQL
- Timeout configurado para evitar consultas largas
- Validación de entrada con Zod schemas
- Logs detallados para monitoreo

## 🚨 Solución de problemas

### Error de conexión a base de datos
- Verifica las credenciales en `.env`
- Asegúrate de que el servidor SQL Server esté accesible
- Revisa la configuración de firewall

### Webhook no recibe mensajes
- Verifica que la URL del webhook sea accesible públicamente
- Usa ngrok para desarrollo local: `ngrok http 3000`
- Confirma la configuración en Twilio Console

### Respuestas del agente incorrectas
- Revisa los logs del servidor
- Verifica que las tablas de base de datos tengan datos
- Confirma que la API Key de OpenAI sea válida

## 📈 Monitoreo

El agente incluye logs detallados:
- Mensajes entrantes y salientes
- Consultas a base de datos
- Errores y excepciones
- Tiempo de respuesta

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico, contacta a: [tu-email@lavadisimo.com]

---

Desarrollado con ❤️ para Lavadísimo
