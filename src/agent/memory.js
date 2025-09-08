// Módulo para almacenar y acceder al historial de conversaciones
export const conversationHistories = new Map();

// Función para obtener historial por teléfono
export function getHistoryByPhone(telefono) {
  return conversationHistories.get(telefono) || [];
}

// Función para convertir historial a formato de texto para búsqueda de contexto
export function getHistoryForContext(telefono) {
  const history = getHistoryByPhone(telefono);
  return history.map(msg => {
    if (typeof msg === 'object') {
      return msg.role === 'human' ? `Cliente: ${msg.content}` : `Agente: ${msg.content}`;
    }
    return msg;
  });
}
