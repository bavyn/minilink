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

function generateRandomString() {
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
    urls: urlDatabase,
   };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  };
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("This shortened URL does not exist")
  };
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  };
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  };
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

//--- POST ----------------------------------------

// generate random short url id
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.send("Uh oh! You must be logged in to shorten a URL")
  };
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
  delete urlDatabase[id];
  res.redirect("/urls");
});

// edit a short url to a new long url
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
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
  };
  
  if (getUserByEmail(newEmail)) {
    return res.status(400).send("Oops! This email address is already in our system");
  };

  users[newUserID] = {
    id: newUserID,
    email: newEmail,
    password: newPassword
  };

  // console.log("entry", req.body);
  // console.log("get user by email:", getUserByEmail(newEmail));
  // console.log("user database", users);

  res.cookie("user_id", newUserID)
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password
  const userDetails = (getUserByEmail(loginEmail));

  if (!getUserByEmail(loginEmail)) {
    return res.status(403).send("Oops! Email is incorrect"); // update to email or password later for security, once tested to be working correctly
  };
  
  if (userDetails.password !== loginPassword) {
    return res.status(403).send("Wrong password"); // update to email or password later for security, once tested to be working correctly
  };
  
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