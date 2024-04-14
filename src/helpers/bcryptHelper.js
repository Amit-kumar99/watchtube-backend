const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

const verifyPassword = async (password, hashedPassword) => {
  const isMatched = await bcrypt.compare(password, hashedPassword);
  return isMatched;
}

module.exports = {
  hashPassword,
  verifyPassword
}