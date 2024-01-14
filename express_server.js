const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  const length = 6;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur"),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk"),
  },
};

const searchThroughUsers = function(input, userItem) {
  for (object in users) {
    if (users[object][userItem] === input) {
      return true;
    }
  }
  return false;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const urlsForUser = function(id) {
  let userUrls = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === id){
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
}

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: [
    'secretKey'
  ],
}));
app.use((req, res, next) => {
  res.locals.user = users[req.session.user_id];
  next();
})
app.set("view engine", "ejs");

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
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view URLs on this site if you are not logged in!</body></html>\n")
  }
  const templateVars = { 
    urls: urlDatabase, 
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot shorten URLs on this site if you are not logged in!</body></html>\n");
  }
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id]['longURL'] = req.body.longURL;
  urlDatabase[id]['user_id'] = req.session.user_id;
  res.redirect(`/urls/${id}`); // Redirect to the /urls:id page
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n")
  }
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view the url pages if you are not logged in!</body></html>")
  }
  let idValid = false
  for (url in urlsForUser('user_id')){
    if (req.params.id === url) {
      idValid = true;
      break;
    }
  }
  if (idValid === false) {
    return res.send("<html><body>You are not the owner of this url!</body></html>");
  }
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id].longURL, 
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n")
  }
  return res.redirect(urlDatabase[req.params.id]['longURL']);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  res.render("urls_register");
})

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Required input not found.")
  };
  for (object in users) {
    if (users[object]['email'] === req.body.email) {
       return res.status(400).send("Email is already registered.")
    }
  }
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    id, 
    email, 
    password: hashedPassword,
  };
  req.session.user_id = id;
  res.redirect("/urls");
})

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n")
  }
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view the url pages if you are not logged in!</body></html>")
  }
  let idValid = false
  for (url in urlsForUser('user_id')){
    if (req.params.id === url) {
      idValid = true;
      break;
    }
  }
  if (idValid === false) {
    return res.send("<html><body>You are not the owner of this url!</body></html>");
  }
  const idToDelete = req.params.id;

  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    return res.redirect("/urls");
  } else {
    return res.status(404).send("URL not found");
  }
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  console.log(`TEST 1: ${req.params.id}`);
  res.redirect("/urls");
});

app.get("/urls/:id/edit", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n")
  }
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view the url pages if you are not logged in!</body></html>")
  }
  let idValid = false
  for (url in urlsForUser('user_id')){
    if (req.params.id === url) {
      idValid = true;
      break;
    }
  }
  if (idValid === false) {
    return res.send("<html><body>You are not the owner of this url!</body></html>");
  }
  const id = req.params.id;
  const templateVars = { 
    id,
    longURL: urlDatabase[id]['longURL'],
    user: users[req.session.user_id]
  };
  res.render("urls_edit", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  res.render("login");
});

app.post("/login", (req, res) => {
  const templateVars = { 
    urls: urlDatabase, 
    user: users[req.session.user_id]
  };
  // const hashedPassword = bcrypt.hashSync(req.body.password);
  if (!searchThroughUsers(req.body.email, 'email')) {
    return res.status(403).send(`No account was found using this email.`)
  }
  for (object in users) {
    if (users[object]['email'] === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[object].password)) {
        req.session.user_id = users[object]['id'];
      } else {
        console.log(req.body.password,users[object].password);
        return res.status(403).send(`You have submitted the incorrect password.`);
      }
    }
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  return res.redirect('/login');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

