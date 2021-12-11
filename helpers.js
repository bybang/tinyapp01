// Helper functions

// get userID object when email passed in
const getUserByEmail = (userDatabase, email) => {
  let userObj = Object.values(userDatabase);

  for (let user of userObj) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// 

module.exports = { getUserByEmail, };