const getUserByEmail = function(email, database) {
  for (let id in database) {
    if (database[id].email === email) {
      let user = id;
      return user;
    }
  }
  return undefined;
};

module.exports = getUserByEmail;