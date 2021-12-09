// << Requirements >>
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const generateRandomString = () => Math.random().toString(36).slice(7);

// Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

// <<< LOG IN >>>
app.post("/login", (req, res) => {
  const userID = req.body.username;

  res.cookie("username", userID);

  res.redirect("/urls");
});

// <<< LOGOUT ROUTE >>>
app.post("/logout", (req, res) => {
  res.clearCookie("username");
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
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
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