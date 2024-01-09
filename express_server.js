const cookieParser = require('cookie-parser');
const express = require("express");
const app = express();
const PORT = 8080;

function generateRandomString() {
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
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function searchThroughUsers(input, userItem) {
  for (object in users) {
    if (users[object][userItem] === input) {
      return true;
    }
  }
  return false;
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.locals.user = users[req.cookies['user_id']];
  next();
})
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
    urls: urlDatabase, 
    user: users[req.cookies['user_id']]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body['longURL'];
  res.redirect(`/urls/${id}`); // Redirect to the /urls:id page
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    user: users[req.cookies['user_id']]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
})

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send("Required input not found.")
  };
  for (object in users) {
    if (users[object]['email'] === req.body.email) {
      res.status(400).send("Email is already registered.")
    }
  }
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  users[id] = {id, email, password};
  res.cookie(`user_id`, id);
  res.redirect("/urls");
})

app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;

  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  console.log(`TEST 1: ${req.params.id}`);
  res.redirect("/urls");
});

app.get("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found");
  }
  const templateVars = { 
    id,
    longURL: urlDatabase[id],
    user: users[req.cookies['user_id']]
  };
  res.render("urls_edit", templateVars);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const templateVars = { 
    urls: urlDatabase, 
    user: users[req.cookies['user_id']]
  };
  if (!searchThroughUsers(req.body.email, 'email')) {
    res.status(403).send(`No account was found using this email.`)
  }
  for (object in users) {
    if (users[object]['email'] === req.body.email) {
      if (users[object]['password'] === req.body.password) {
        res.cookie(`user_id`, users[object]['id']);
      } else {
        res.status(403).send(`You have submitted the incorrect password.`);
      }
    }
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

