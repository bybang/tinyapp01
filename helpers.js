// Helper functions


// get userID object when email passed in
const getUserByEmail = (userDatabase, email) => {
  let userInfo = Object.values(userDatabase);

  for (let user of userInfo) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
};


// get urls(object) if urlDatabase[url] object's id matches passed in id
const urlsForUser = (urlDatabase, id) => {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
};

// generates 6 digit random string
const generateRandomString = () => Math.random().toString(36).slice(2, 8);

module.exports = { getUserByEmail, urlsForUser, generateRandomString };