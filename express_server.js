var express = require("express");
var app = express();
const bodyParser = require("body-parser");
var PORT = 8081;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

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

app.get("/", (req, res) => {
  res.end("Hello!\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  var errors = [];
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = req.body.longURL
  res.redirect(`http://localhost:8081/urls/${randomURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});