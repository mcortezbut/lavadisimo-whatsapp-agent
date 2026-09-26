// ============================================
// MERCADO PAGO - PRUEBA DE TERMINALES
// SMARTSHINE / LAVADISIMO
// ============================================

export async function obtenerTerminalesMercadoPago() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'Falta la variable de entorno MERCADOPAGO_ACCESS_TOKEN'
    );
  }

  const response = await fetch(
    'https://api.mercadopago.com/terminals/v1/list?limit=50&offset=0',
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
    console.error('Mercado Pago respondió con error:', data);

    throw new Error(
      `Mercado Pago API ${response.status}: ${
        data.message || data.error || 'Error desconocido'
      }`
    );
  }

  return data;
}
