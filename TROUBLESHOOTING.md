# Solución de Problemas - Agente WhatsApp Lavadísimo

## 🚨 Error de Autenticación Twilio (Error 401)

### Síntomas
```
❌ Error: Authenticate RestException [Error]: Authenticate
status: 401, code: 20003
```

### Posibles Causas y Soluciones

#### 1. **Credenciales Incorrectas**
**Verificar:**
- Account SID debe comenzar con `AC`
- Auth Token debe ser el correcto (no el Test Auth Token)

**Solución:**
1. Ve a https://console.twilio.com
2. En el Dashboard principal, copia:
   - **Account SID** (comienza con AC...)
   - **Auth Token** (haz clic en "Show" para verlo)
3. Actualiza las variables en Render

#### 2. **Usando Credenciales de Test en lugar de Live**
**Problema:** Twilio tiene credenciales de test y live separadas.

**Solución:**
- Asegúrate de usar las credenciales **Live** (no Test)
- Las credenciales de test no funcionan para WhatsApp

#### 3. **Espacios o Caracteres Especiales**
**Problema:** Variables de entorno con espacios al inicio/final.

**Solución:**
- Verifica que no haya espacios antes/después de las credenciales
- Copia y pega directamente desde Twilio Console

#### 4. **Cuenta Twilio Suspendida o con Problemas**
**Verificar:**
- Estado de la cuenta en Twilio Console
- Saldo disponible
- Verificación de cuenta completada

#### 5. **Región Incorrecta**
**Problema:** Algunas cuentas Twilio están en regiones específicas.

**Solución:**
Si tu cuenta está en una región específica, modifica el código:

```javascript
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  {
    region: 'sydney', // o la región correspondiente
    edge: 'sydney'
  }
);
```

### 🔧 Debugging Paso a Paso

1. **Verificar Variables de Entorno**
   ```bash
   # En Render, ve a Environment y verifica:
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_SANDBOX_NUMBER=whatsapp:+14155238886
   ```

2. **Probar Credenciales Manualmente**
   - Ve a Twilio Console
   - Intenta enviar un mensaje de prueba desde la consola
   - Si falla ahí, el problema es con la cuenta Twilio

3. **Verificar Logs de Inicio**
   Los logs deben mostrar:
   ```
   🔍 Verificando credenciales de Twilio...
   TWILIO_ACCOUNT_SID: Configurado (ACxxxxxxxx...)
   TWILIO_AUTH_TOKEN: Configurado (xxxxxxxxxx...)
   🔍 Probando conexión con Twilio...
   ✅ Conexión con Twilio exitosa: [Nombre de cuenta]
   ```

### 🎯 Solución Temporal Implementada

El agente ahora incluye una **respuesta alternativa con TwiML** que funciona incluso si la API de Twilio falla:

```javascript
// Si falla la API de Twilio, usa TwiML
const twimlResponse = `
  <Response>
    <Message>${responseText}</Message>
  </Response>
`;
res.status(200).type('text/xml').send(twimlResponse);
```

Esto significa que **el agente seguirá funcionando** y respondiendo mensajes mientras se resuelve el problema de autenticación.

### 📞 Contactar Soporte Twilio

Si ninguna solución funciona:

1. Ve a https://support.twilio.com
2. Crea un ticket con:
   - Account SID
   - Descripción del error
   - Logs del error
   - Confirmación de que las credenciales son correctas

### ✅ Verificación Final

Una vez solucionado, deberías ver en los logs:
```
✅ Conexión con Twilio exitosa: [Nombre de cuenta]
✅ Mensaje enviado exitosamente via Twilio API
```

---

## 🔄 Otras Soluciones Comunes

### Error de Base de Datos
Si hay errores de conexión a SQL Server:
- Verificar credenciales de DB en variables de entorno
- Confirmar que el servidor SQL Server esté accesible
- Revisar configuración de firewall

### Error de OpenAI
Si hay errores con OpenAI:
- Verificar API Key válida
- Confirmar saldo disponible en cuenta OpenAI
- Revisar límites de rate limiting

### Webhook No Recibe Mensajes
- Verificar URL del webhook en Twilio Console
- Confirmar que la URL sea accesible públicamente
- Usar ngrok para desarrollo local
