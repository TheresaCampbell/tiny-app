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

// URL Database
var urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  };
  "9sm5xk": {
    shortURL: "9sm5xk",
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  };
};

// Users Database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "a-b-c"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "1-2-3"
  }
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Creating login page
app.get("/login", (req, res) => {
  res.cookie("user_id", req.body["user_id"]);
  res.render("login");
})

// Posting to login page
app.post("/login", (req, res) => {
  for (var user_id in users) {
    if (users[user_id].email === req.body["user_email"]) {
      if (users[user_id].password === req.body["password"]) {
        res.cookie("user_id", users[user_id].id);
        res.redirect("/"); // <--Compass said to set to "/", but hasn't said to make that page yet.
      } else {
        res.status(403).render("403");
      }
      return
    }
  }
  res.status(403).render("403");
});

// // Logging in USED TO BE IN HEADER BEFORE I MADE LOGIN PAGE
// app.post("/login", (req, res) => {
//   res.cookie("user_id", req.body["user_id"]);
//   res.redirect("/urls");
// });

// Logging out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// New user registration form
app.get("/register", (req, res) => {
  let templateVars = {
    userEmail: req.body["email"],
    userPassword: req.body["password"],
    user: users[req.cookies["user_id"]]
  };
  res.render("user_registration", templateVars);
});

// Adding new user to Users Database
app.post("/register", (req, res) => {
  let alreadyExists = false;

  for (var user_id in users) {
    if (users[user_id].email === req.body["email"]) {
      alreadyExists = true;
    }
  }
  // If email is already in Users database, or email or password fields are left blank, Error 400. Otherwise, user is added.
  if (alreadyExists || !req.body["email"] || !req.body["password"]) {
    res.status(400).render("400");
  } else {
    let randomUserID = generateRandomString();
    let newUser = {
      id: randomUserID,
      email: req.body["email"],
      password: req.body["password"]
    }
    users[randomUserID] = newUser
    res.cookie("user_id", randomUserID);
    res.redirect("/urls");
  }
});

// All URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});


// New URL form
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  console.log("Cookies: ", req.cookies);
  if (req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login");
  }
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
    user: users[req.cookies["user_id"]]
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