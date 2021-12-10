// << Requirements >>
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const generateRandomString = () => Math.random().toString(36).slice(2, 8);
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session')

// Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("test", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("1234", 10)
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "user3@example.com",
    password: bcrypt.hashSync("qwer", 10)
  },
};

// Helper functions

const getUserByEmail = (userDatabase, email) => {
  for (let userID in userDatabase) {
    if (userDatabase[userID].email === email) {
      return userDatabase[userID];
    }
  }
  return undefined;
};

const urlsForUser = (urlDatabase, id) => {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
};

/*
* << Server Settings/middlewares >>
*/
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



/*
*
* << Routes(endpoint) >>
*
*/

// <<< ROOT >>>
app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json("urlDatabase");
});


// <<< HOMEPAGE >>>

app.get("/urls", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session["user_id"]],
    urls: urlsForUser(urlDatabase, req.session["user_id"]),
  };
  res.render("urls_index", templateVars);
});



/*
* <<< REGISTER ROUTE >>>
*/

// Get request for rendering register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session["user_id"]],
  };
  // if user is logged in, redirect to the homepage
  if (req.session["user_id"]) {
    res.redirect("/urls");
  }
  res.render("urls_registration", templateVars);
});

// Post request for register new user
app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const newEmail = req.body["email"];
  const newPassword = req.body["password"];
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  // Error Handler

  // edge case 1 - empty email or password
  if (newEmail === "" || hashedPassword === "") {
    return res.status(400).send("Please enter a correct input");
  }

  // edge case 2 - exsisting email

  if (getUserByEmail(userDatabase, newEmail)) {
    return res.status(400).send("The Email is already registered! Please log in or select different email address");
  }

  for (let user in userDatabase) {
    if (user !== newUserId) {
      userDatabase[newUserId] = {
        id: newUserId,
        email: newEmail,
        password: hashedPassword,
      };
    }
  }

  req.session["user_id"] = newUserId;
  // console.log(userDatabase);
  
  res.redirect("/urls");
});




/*
* <<< new shortURL Generator >>>
*/

// Get request; Renders the template urls_new
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session["user_id"]],
  };
  
  // if user is not logged in, redirect them to the homepage
  if (!req.session["user_id"]) {
    return res.redirect("/login");
  }
  
  res.render("urls_new", templateVars);
});

// Post request for new shortURL
app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  let shortURL = generateRandomString();
  
  // if users are not logged in, they can't use the generator. Redirect them to the login page
  if (!req.session["user_id"]) {
    return res.status(401).send("Wrong path");
  }
  // if long URL did not passed to the generator
  if (!longURL) {
    return res.status(400).send("Pass the longURL");
  }
  
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session["user_id"]
  };
  
  res.redirect(`/urls/${shortURL}`);
});

// A page after generate the shortURL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL =  urlDatabase[shortURL].longURL;
  
  const templateVars = {
    shortURL,
    longURL,
    user: userDatabase[req.session["user_id"]]
  };
  
  // check if user logged in. Users can't see the urls that is not belong to them
  if (!req.session["user_id"]) {
    return res.status(401).render("urls_show", templateVars);
  }
  
  
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  // check if shortURL exsist
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    // if shortURL not exsist, send them error(page)
    res.redirect("https://http.cat/400");
  }
});

/*
* <<< DELETE >>>
*/

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  
  // Error Handler
  // Case 1 - Is user logged in? If not, send the error message
  if (!req.session["user_id"]) {
    return res.status(401).send("You don't have a permission");
  }
  // Case 2 - if given URL is not exsist, return error message
  if (!shortURL) {
    return res.status(404).send("Wrong path! URL doesn't exsist");
  }
  // Case 3 - if user doesn't own the url, return error message
  if (req.session["user_id"] && urlDatabase[shortURL].userID !== req.session["user_id"]) {
    return res.status(401).send("You don't own this url check url list or register new url");
  }
  delete urlDatabase[shortURL];
  
  res.redirect("/urls");
});

/*
* <<< UPDATE >>>
*/

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newlongURL = req.body.newlongURL;
  
  // Error Handler
  // Case 1 - Is user logged in? If not, send the error message
  if (!req.session["user_id"]) {
    return res.status(401).send("You don't have a permission");
  }
  // Case 2 - if given URL is not exsist, return error message
  if (!shortURL) {
    return res.status(404).send("Wrong path! URL doesn't exsist");
  }
  // Case 3 - if user doesn't own the url, return error message
  if (req.session["user_id"] && urlDatabase[shortURL].userID !== req.session["user_id"]) {
    return res.status(401).send("You don't own this url check url list or register new url");
  }
  
  urlDatabase[shortURL].longURL = newlongURL;
  res.redirect("/urls");
});



/*
* <<< LOG IN/OUT ROUTES >>>
*/

// LOGIN ROUTE
// Get requset for log in page
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session["user_id"]],
  };
  res.render("urls_login", templateVars);
});

// Post requset for log in to the app
app.post("/login", (req, res) => {
  const userEmail = req.body["email"];
  const userPassword = req.body["password"];
  let userInfo = getUserByEmail(userDatabase, userEmail);
  
  // Check if email is exsisting in our Database and send a message if not
  if (userInfo === undefined) {
    return res.status(403).send("This email is not registered!");
  }
  // check email and password are matches to the inside of that special user ID
  if (userInfo.email === userEmail && bcrypt.compareSync(userPassword, userInfo.password)) {
    req.session["user_id"] = userInfo.id
    // redirect to the homepage if user successfully login
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect password!");
  }
});

// LOGOUT ROUTE
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/urls");
});


// <<< Listener >>>
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});