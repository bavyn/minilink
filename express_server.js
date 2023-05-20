const express = require("express");
const app = express();
const PORT = 8080;

const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ["wjahkzepgrelunrxau"],
}));

// --- objects ---------------------------------

const urlDatabase = {};

const users = {};

// --- GET ------------------------------------

app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
  //res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase),
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("Page not found");
  }
  const templateVars = {
    user: users[req.session.user_id],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  if (!req.session.user_id) {
    return res.status(401).send("You need to be logged in to view this page");
  }
  if (req.session.user_id !== urlDatabase[templateVars.id].userID) {
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
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

//--- POST -------------------------------------

// generate random short url id
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Uh oh! You must be logged in to shorten a URL");
  }
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${id}`);
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("This tiny url does not exist");
  }
  if (req.session.user_id !== urlDatabase[id].userID) {
    return res.status(401).send("You are not authorized to delete this tiny url");
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit a short url to a new long url
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.user_id !== urlDatabase[id].userID) {
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
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  if (!newEmail || !newPassword) {
    return res.status(400).send("Oops! Please enter a valid email address and password");
  }
  if (getUserByEmail(newEmail, users)) {
    return res.status(400).send("Oops! This email address is already in our system");
  }

  users[newUserID] = {
    id: newUserID,
    email: newEmail,
    password: hashedPassword
  };
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const userDetails = (getUserByEmail(loginEmail, users));

  if (!getUserByEmail(loginEmail, users)) {
    return res.status(403).send("Oops! Email is incorrect");
  }
  if (!bcrypt.compareSync(loginPassword, userDetails.password)) {
    return res.status(403).send("Oops! Wrong password");
  }

  req.session.user_id = userDetails.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// ----- listen -------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});