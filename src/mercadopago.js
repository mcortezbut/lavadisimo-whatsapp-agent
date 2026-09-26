// ============================================
// MERCADO PAGO - SMARTSHINE
// Integración Point Smart 2
// ============================================

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

const POINT_SMART_2_ID = 'NEWLAND_N950__N950NCCB05342983';

// --------------------------------------------
// Access Token
// --------------------------------------------

function obtenerAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      'Falta la variable de entorno MERCADOPAGO_ACCESS_TOKEN'
    );
  }

  return token;
}

// --------------------------------------------
// Consultar terminales
// --------------------------------------------

export async function obtenerTerminalesMercadoPago() {
  const accessToken = obtenerAccessToken();

  const response = await fetch(
    `${MERCADO_PAGO_API}/terminals/v1/list?limit=50&offset=0`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('Mercado Pago GET terminals:', data);

    throw new Error(
      `Mercado Pago API ${response.status}: ${
        data.message || data.error || 'Error desconocido'
      }`
    );
  }

  return data;
}

// --------------------------------------------
// Activar modo PDV
// --------------------------------------------

export async function activarModoPDV() {
  const accessToken = obtenerAccessToken();

  const body = {
    terminals: [
      {
        id: POINT_SMART_2_ID,
        operating_mode: 'PDV'
      }
    ]
  };

  const response = await fetch(
    `${MERCADO_PAGO_API}/terminals/v1/setup`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Mercado Pago PATCH ${response.status}: ${
        data.message ||
        data.error ||
        JSON.stringify(data)
      }`
    );
  }

  return data;
}

// --------------------------------------------
// CREAR COBRO DE PRUEBA
// --------------------------------------------

export async function crearPagoPrueba(monto) {
  const accessToken = obtenerAccessToken();

  // Validación estricta para esta primera prueba
  if (!Number.isInteger(monto)) {
    throw new Error(
      'El monto debe ser un número entero'
    );
  }

  if (monto < 1 || monto > 1000) {
    throw new Error(
      'El monto de prueba debe estar entre $1 y $1.000'
    );
  }

  // UUID único para evitar duplicación del cobro
  const idempotencyKey = crypto.randomUUID();

  const externalReference =
    `SMARTSHINE_TEST_${Date.now()}`;

  const body = {
    type: 'point',

    external_reference: externalReference,

    expiration_time: 'PT10M',

    transactions: {
      payments: [
        {
          amount: String(monto)
        }
      ]
    },

    config: {
      point: {
        terminal_id: POINT_SMART_2_ID,
        print_on_terminal: 'no_ticket'
      }
    },

    description: 'Prueba SMARTSHINE Point'
  };

  console.log('');
  console.log('========================================');
  console.log('💳 CREANDO COBRO DE PRUEBA');
  console.log('========================================');
  console.log('Monto:', monto);
  console.log('Terminal:', POINT_SMART_2_ID);
  console.log('Referencia:', externalReference);
  console.log('Idempotency Key:', idempotencyKey);

  const response = await fetch(
    `${MERCADO_PAGO_API}/v1/orders`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': idempotencyKey
      },

      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  console.log(
    'Respuesta Mercado Pago:',
    JSON.stringify(data)
  );

  if (!response.ok) {
    throw new Error(
      `Mercado Pago POST ${response.status}: ${
        data.message ||
        data.error ||
        JSON.stringify(data)
      }`
    );
  }

  return data;
}

// --------------------------------------------
// ID de Point Smart 2
// --------------------------------------------

export function obtenerPointSmart2Id() {
  return POINT_SMART_2_ID;
}
