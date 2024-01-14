const getUserByEmail = function(email, database) {
  for (id in database) {
    if (database[id].email === email) {
      let user = id;
      return user;
    }
  }
  return undefined;
};

module.exports = getUserByEmail;