const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
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