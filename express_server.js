// << Requirements >>
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const generateRandomString = () => Math.random().toString(36).slice(7);

// Database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// << Server Settings/middlewares >>
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// << Routes(endpoint) >>
// Homepage
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


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  if (!longURL) {
    return res.status(400).send("Pass the longURL");
  }

  let shortURL = generateRandomString();

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  console.log(templateVars);
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

// << Listener >>
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});