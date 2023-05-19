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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// checks if a given email already exists in the user database, returns true/false
// const emailExists = function(email) {
//   for (const user in users) {
//     if (users[user].email === email) {
//       return true;
//     }
//   } return false;
// };

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
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

//--- POST ----------------------------------------

// generate random short url id
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
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
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

// user account

app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const newUserID = generateRandomString();

  console.log(users);

  if (!newEmail || !newPassword) {
    res.status(400).send("Oops! Please enter a valid email address and password");
  } else if (getUserByEmail(newEmail)) {
    res.status(400).send("Oops! This email address is already in our system");
  } else {
    users[newUserID] = {
    id: newUserID,
    email: newEmail,
    password: newPassword
    }
  };

  console.log("entry", req.body);
  console.log("get user by email:", getUserByEmail(newEmail));
  console.log(users);

  res.cookie("user_id", newUserID)
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  // const loginEmail = req.body.email;
  // const loginPassword = req.body.password

  // if (!emailExists(loginEmail)) {
  //   res.send(403, "Oops! Email is incorrect"); // update to email or password later for security, once tested to be working correctly
  // } else {
    
  // }

  res.cookie("user", users[req.cookies["user_id"]]);
  res.redirect("/urls");
});

// logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// ----- listen --------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});