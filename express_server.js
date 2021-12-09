// << Requirements >>
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const generateRandomString = () => Math.random().toString(36).slice(2, 8);

// Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "test"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "1234"
  }
};

const getUserByEmail = (userDatabase, email) => {
  for (let userID in userDatabase) {
    if (userDatabase[userID].email === email) {
      return true;
    }
    return false;
  }
};

// << Server Settings/middlewares >>
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

// << Routes(endpoint) >>
//
app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json("urlDatabase");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});
app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

// << Homepage >>
app.get("/urls", (req, res) => {
  console.log(req.cookies);
  const templateVars = {
    urls: urlDatabase,
    user: userDatabase[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

// <<< REGISTER ROUTE >>>
// Get request for rendering register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]],
  };
  res.render("urls_registration", templateVars);
});

// Post request for register new user
app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const newEmail = req.body["email"];
  const newPassword = req.body["password"];

  // Error Handler

  // edge case 1 - empty email or password
  if (newEmail === "" || newPassword === "") {
    return res.status(400).send("Please enter a correct input");
  }

  // edge case 2 - exsisting email

  if (getUserByEmail(newEmail)) {
    return res.status(400).send("The Email is already registered! Please log in or select different email address");
  }

  for (let user in userDatabase) {
    if (user !== newUserId) {
      userDatabase[newUserId] = {
        id: newUserId,
        email: newEmail,
        password: newPassword,
      };
    }
  }

  res.cookie("user_id", newUserId);
  // console.log(userDatabase);
  
  res.redirect("/urls");
});

// <<< LOG IN >>>
app.post("/login", (req, res) => {
  const user_id = req.cookies["user_id"];

  res.cookie("user_id", user_id);

  res.redirect("/urls");
});

// <<< LOGOUT ROUTE >>>
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


// <<< new shortURL Generator >>>
// Post request for new shortURL
app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  let shortURL = generateRandomString();

  if (!longURL) {
    return res.status(400).send("Pass the longURL");
  }

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

// Get request; Renders the template urls_new
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// <<< DELETE >>>
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// <<< UPDATE >>>
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newlongURL = req.body.newlongURL;

  urlDatabase[shortURL] = newlongURL;
  res.redirect("/urls");
});



// << Listener >>
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});