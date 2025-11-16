// Conjunto en memoria para almacenar tokens invalidados (por logout)
const blocklist = new Set();

// Agrega un token a la lista de tokens bloqueados
const addToBlocklist = (token) => {
  blocklist.add(token);
};

// Verifica si un token ya fue invalidado
const isBlocked = (token) => {
  return blocklist.has(token);
};

// Limpia todos los tokens en la blocklist (solo para mantenimiento manual)
const clearExpiredTokens = () => {
  blocklist.clear();
};

module.exports = {
  addToBlocklist,
  isBlocked,
  clearExpiredTokens
};