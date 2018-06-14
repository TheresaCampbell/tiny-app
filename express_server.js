var express = require("express");
var app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var PORT = 8081;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

function generateRandomString() {
  var string = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  return string;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
// Logging in
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Logging out
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// New Registration Form
app.get("/register", (req, res) => {
  let templateVars = {
    userEmail: req.body["userEmail"],
    userPassword: req.body["userPassword"],
    username: req.cookies["username"]
  };
  res.render("user_registration", templateVars);
});

// All URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});


// New URL form
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

// Adding new URL to main URL page
app.post("/urls", (req, res) => {
  var errors = [];
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = req.body.longURL
  res.redirect(`/urls/${randomURL}`)
});

// Redirects to long URL's website
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Single URL
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

// Edit form (which immediately redirects back to the main URL page)
app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body["longURL"];
  res.redirect("/urls");
});

// Delete a URL (which immediately redirects back to the main URL page)
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});