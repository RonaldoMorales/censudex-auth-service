const blocklist = new Set();

const addToBlocklist = (token) => {
  blocklist.add(token);
};

const isBlocked = (token) => {
  return blocklist.has(token);
};

const clearExpiredTokens = () => {
  blocklist.clear();
};

module.exports = {
  addToBlocklist,
  isBlocked,
  clearExpiredTokens
};