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
  const user = users[req.session.user_id];
  const id = req.params.id;
  if (!urlDatabase[id]) {
    let templateVars = {
      status: 404,
      message: "No TinyApp URL found",
      user,
    }
    return res.render("urls_error", templateVars);
  }
  if (!req.session.user_id) {
    let templateVars = {
      status: 401,
      message: "You must be logged in to view this page",
      user,
    }
    return res.render("urls_error", templateVars);
  }
  let templateVars = {
    status: 401,
    message: "This TinyApp URL does not belong to you",
    id,
    user,
  }
  if (req.session.user_id !== urlDatabase[templateVars.id].userID) {
    return res.render("urls_error", templateVars);
  }
  templateVars = {
    user,
    id,
    longURL: urlDatabase[id].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    const templateVars = {
      status: 404,
      message: "No TinyApp URL found",
      user: users[req.session.user_id],
    };
    return res.render("urls_error", templateVars);
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
    const templateVars = {
      status: 400,
      message: "Please enter a valid email address and password",
      user: users[req.session.user_id]
    }
    return res.render("urls_error", templateVars);
  }
  if (getUserByEmail(newEmail, users)) {
    const templateVars = {
      status: 400,
      message: "Please enter a valid email address and password",
      user: users[req.session.user_id]
    }
    return res.render("urls_error", templateVars);
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

  if ((!getUserByEmail(loginEmail, users)) || (!bcrypt.compareSync(loginPassword, userDetails.password))) {
    const templateVars = {
      status: 400,
      message: "Please enter a valid email address and password",
      user: users[req.session.user_id]
    }
    return res.render("urls_error", templateVars);
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