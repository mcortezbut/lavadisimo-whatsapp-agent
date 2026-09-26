// ============================================
// MERCADO PAGO - SMARTSHINE
// Integración Point Smart 2
// ============================================

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

const POINT_SMART_2_ID = 'NEWLAND_N950__N950NCCB05342983';

// --------------------------------------------
// Validar configuración
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

  console.log('⚠️ Solicitando cambio de terminal a PDV...');
  console.log('Terminal:', POINT_SMART_2_ID);

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

  console.log(
    'Respuesta Mercado Pago:',
    JSON.stringify(data)
  );

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
// ID de la terminal configurada
// --------------------------------------------

export function obtenerPointSmart2Id() {
  return POINT_SMART_2_ID;
}
