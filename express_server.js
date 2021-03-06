// Middleware
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const PORT = 8081;

// Middleware Stetup
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["key1"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000
}))

// Creates a random 6 character string for short URLs and user IDs.
function createRandomString() {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  return string;
}

// URL Database
const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xk": {
    shortURL: "9sm5xk",
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
}

// Users Database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("a-b-c", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("1-2-3", 10)
  }
}

// JSON list of URL Database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Root redirects to main URLs page if user is logged in, or to login page if they're not.
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Posting to login page with cookie
app.post("/login", (req, res) => {
  for (let user_id in users) {
    if (users[user_id].email === req.body["email"]) {
      if (bcrypt.compareSync(req.body["password"], users[user_id].password)) {
        req.session.user_id = users[user_id].id;
        res.redirect("/");
        return;
      }
      if (!bcrypt.compareSync(req.body["password"], users[user_id].password)) {
        res.status(403).render("403");
      }
      return;
    }
  }
  res.status(400).render("400");
 });

// Login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {user: users[req.session.user_id]};
    res.render("login", templateVars);
  }
});

// Logging out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// New user registration form
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      userEmail: req.body["email"],
      userPassword:req.body["password"],
      user: users[req.session.user_id]
    };
    res.render("user_registration", templateVars);
  }
});

// Adding new user to Users Database
app.post("/register", (req, res) => {
  let alreadyExists = false;

  for (let user_id in users) {
    if (users[user_id].email === req.body["email"]) {
      alreadyExists = true;
    }
  }

  // If email is already in Users database, or email or password fields are left blank, Error 400. Otherwise, user is added.
  if (alreadyExists || !req.body["email"] || !req.body["password"]) {
    res.status(400).render("400");
  } else {
    let randomUserID = createRandomString();
    let newUser = {
      id: randomUserID,
      email: req.body["email"],
      password: bcrypt.hashSync(req.body["password"], 10)
    }
    users[randomUserID] = newUser;
    req.session.user_id = randomUserID;
    res.redirect("/urls");
  }
});

// All URLs
app.get("/urls", (req, res) => {
// Filter for just the URLs created by the current user.
  function urlsForUser(id) {
    let filteredURLs = {}

    for (shortURL in urlDatabase) {
      if (urlDatabase[shortURL].userID === req.session.user_id) {
        filteredURLs[shortURL] = urlDatabase[shortURL]
      }
    }
    return filteredURLs;
  }

// Render just the URLs that belong to the user.
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  }
  res.render("urls_index", templateVars);
});

// New URL form
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };

  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login");
  }
});

// Adding new URL to main URL page
app.post("/urls", (req, res) => {
  let randomURL = createRandomString();
  const newURL = {
    shortURL: randomURL,
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  urlDatabase[randomURL] = newURL;
  res.redirect(`/urls/${randomURL}`)
});

// Redirects to long URL's website
app.get("/u/:id", (req, res) => {
  let urlExists = false;

  for (let urlID in urlDatabase) {
    if (urlID === req.params.id) {
      urlExists = true
    }
  }

  if (urlExists) {
    let longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).render("404");
  }
});

// Single URL
app.get("/urls/:id", (req, res) => {
  for (let urlID in urlDatabase) {
    if (urlDatabase[urlID].shortURL === req.params.id) {
      if (req.session.user_id === urlDatabase[req.params.id].userID) {
        let templateVars = {
          shortURL: req.params.id,
          longURL: urlDatabase[req.params.id].longURL,
          user: users[req.session.user_id]
        }
        res.render("urls_show", templateVars);
      } else {
        res.status(401).render("401");
      }
      return;
    }
  }
  res.status(404).render("404");
});

// Edit form (which immediately redirects back to the main URL page)
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body["longURL"];
  res.redirect("/urls");
});

// Delete a URL (which immediately redirects back to the main URL page)
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.session.user_id]
    };
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(401).render("401");
  }
});

// Server is listening for changes on Port 8081
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});