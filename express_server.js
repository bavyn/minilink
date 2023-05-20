const express = require("express");
const app = express();
const PORT = 8080;

const morgan = require("morgan");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// --- objects ---------------------------------

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "abc"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "abc"
  },
  "u7fh64": {
    longURL: "http://www.nhl.com",
    userID: "abc"
  },
  "2e7jzs": {
    longURL: "http://www.tsn.com",
    userID: "def"
  },
};

const users = {
  abc: {
    id: "abc",
    email: "a@a.com",
    password: "1234",
  },
  def: {
    id: "def",
    email: "b@b.com",
    password: "5678",
  },
};

// --- functions -------------------------------

const generateRandomString = function() {
  let randomString = "";
  const stringLength = 6;
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  while (randomString.length < stringLength) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
};

// returns the user object associated to an email, otherwise returns undefined
const getUserByEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

// returns an object of user specific urls
const urlsForUser = function(userID) {
  const userSpecificUrls = {};
  for (let urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === userID) {
      userSpecificUrls[urlID] = urlDatabase[urlID];
    }
  } return userSpecificUrls;
};

// --- GET ------------------------------------

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"]),
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("Page not found");
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  if (!req.cookies["user_id"]) {
    return res.status(401).send("You need to be logged in to view this page");
  }
  if (req.cookies["user_id"] !== urlDatabase[templateVars.id].userID) {
    return res.status(401).send("This tiny url does not belong to you");
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("This tiny url does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

//--- POST ----------------------------------------

// generate random short url id
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.send("Uh oh! You must be logged in to shorten a URL");
  }
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect(`/urls/${id}`);
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("This tiny url does not exist");
  }
  if (req.cookies["user_id"] !== urlDatabase[id].userID) {
    return res.status(401).send("You are not authorized to delete this tiny url");
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit a short url to a new long url
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (req.cookies["user_id"] !== urlDatabase[id].userID) {
    return res.status(401).send("You are not authorized to edit this tiny url");
  }
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// user account

app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const newUserID = generateRandomString();
  if (!newEmail || !newPassword) {
    return res.status(400).send("Oops! Please enter a valid email address and password");
  }
  if (getUserByEmail(newEmail)) {
    return res.status(400).send("Oops! This email address is already in our system");
  }
  users[newUserID] = {
    id: newUserID,
    email: newEmail,
    password: newPassword
  };
  res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const userDetails = (getUserByEmail(loginEmail));
  if (!getUserByEmail(loginEmail)) {
    return res.status(403).send("Oops! Email is incorrect"); // update to email or password later for security, once tested to be working correctly
  }
  if (userDetails.password !== loginPassword) {
    return res.status(403).send("Wrong password"); // update to email or password later for security, once tested to be working correctly
  }
  res.cookie("user_id", userDetails.id);
  res.redirect("/urls");
});

// logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// ----- listen --------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});