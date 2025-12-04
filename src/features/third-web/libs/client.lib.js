import { createThirdwebClient } from "thirdweb";

// Función para limpiar comillas de las variables de entorno
const cleanEnvVar = (value) => {
  if (!value) return value;
  // Remover comillas dobles al inicio y final si existen
  return value.replace(/^["']|["']$/g, '').trim();
};

// Obtener client ID de las variables de entorno
// En Create React App, las variables deben empezar con REACT_APP_
const clientId = cleanEnvVar(process.env.REACT_APP_CLIENT_ID);

let client = null;

if (clientId) {
  try {
    client = createThirdwebClient({
      clientId: clientId,
    });
  } catch (error) {
    console.error('[Thirdweb] Error al crear cliente:', error);
  }
} else {
  console.warn('[Thirdweb] REACT_APP_CLIENT_ID no está definido. El botón Connect Wallet no funcionará.');
}

export { client };
