// << Requirements >>
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
// Helper functions imported from helper.js
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");



// Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  cb0345: {
    longURL: "https://www.lighthouselabs.ca/",
    userID: "userRandomID"
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
}));



/*
*
* << Routes(endpoint) >>
*
*/

/*
* <<< ROOT ROUTE>>>
*/

app.get("/", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});
app.get("/urls.json", (req, res) => {
  res.json(userDatabase);
});



/*
* <<< HOMEPAGE ROUTE >>>
*/

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
* <<< REDIRECT >>>
*/

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
* <<< UPDATE & DELETE >>>
*/

// UPDATE ROUTE

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
    return res.status(401).send("You don't own this url! Check your list or register new url");
  }
  
  urlDatabase[shortURL].longURL = newlongURL;
  res.redirect("/urls");
});


// DELETE

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
* <<< LOG IN/OUT ROUTES >>>
*/

// LOGIN ROUTE
// Get requset for log in page

app.get("/login", (req, res) => {
  // Error Handler

  // Case 1 - if user logged in, send them back to homepage
  if (req.session["user_id"]) {
    return res.redirect("/urls");
  }

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
    req.session["user_id"] = userInfo.id;
    // redirect to the homepage if user successfully login
    res.redirect("/urls");
  } else {
    res.status(403).send("Please enter the correct password");
  }
});


// LOGOUT ROUTE

app.post("/logout", (req, res) => {
  console.log(`User: ${req.session["user_id"]} logged out!`);
  req.session["user_id"] = null;
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
  
  // Error Handler
  // Case 1 - User not logged in, but request to generate shortURL(curl -x) => send them error message
  if (!req.session["user_id"]) {
    return res.status(401).send("Wrong path");
  }
  // Case 2 - If longURL doesn't exsist, send the error message
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
  // Error Handler
  
  // Case 1 - If url does not exsist, send the error message
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("Wrong path! URL doesn't exsist");
  }
  
  const longURL =  urlDatabase[shortURL].longURL;

  const templateVars = {
    shortURL,
    longURL,
    user: userDatabase[req.session["user_id"]],
    urls: urlsForUser(urlDatabase, req.session["user_id"]),
  };
  
  // Case 2 - If shortURL exsist, is user logged in? If not, send the error message
  if (!req.session["user_id"]) {
    return res.status(401).send(`You don't have a permission! If you have the account, Please <a href="/login">Login</a>`);
  }
  
  // Case 3 - Is user logged in but not owns the URL, send the error message
  if (req.session["user_id"] !== urlDatabase[shortURL].userID) {
    return res.status(401).render("urls_error", templateVars);
  }
  
  // Happy path
  if (req.session["user_id"] === urlDatabase[shortURL].userID) {
    return res.render("urls_show", templateVars);
  }
});



// <<< Listener >>>

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});