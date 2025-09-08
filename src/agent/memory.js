// Módulo para almacenar y acceder al historial de conversaciones
export const conversationHistories = new Map();

// Función para obtener historial por teléfono
export function getHistoryByPhone(telefono) {
  return conversationHistories.get(telefono) || [];
}

// Función para obtener historial en formato crudo para búsqueda de contexto
export function getHistoryForContext(telefono) {
  return getHistoryByPhone(telefono);
}
