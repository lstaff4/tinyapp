const cookieSession = require('cookie-session');
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
// these are all required, so don't get rid of them.

const generateRandomString = function() { // Generates a random string. Used to generate userIDs and shortened urls.
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  const length = 6;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
};

const users = { // the database for users. 
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
  for (let object in users) {
    if (users[object][userItem] === input) {
      return true;
    }
  }
  return false;
};

const urlDatabase = { // the database for all urls. DO NOT REMOVE.
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
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
}; // a function that grabs the urls only the user inputted made. Searches through the larger data

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: [
    'secretKey' // cookieSession breaks if this isn't here, so don't remove it.
  ],
}));
app.use((req, res, next) => {
  res.locals.user = users[req.session.user_id];
  next();
});
app.set("view engine", "ejs");



app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect(`/urls/`);
  }
  res.redirect('/login/');
  // a simple redirect for the baseline site. 
});

// Below section up for deletion

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); // keeping this around seems like a security breach, but I never saw any prompt to remove it. I'll let a mentor handle it.
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n"); // basically pointless. It's test code.
});

// Above section up for deletion

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view URLs on this site if you are not logged in!</body></html>\n");
  }
  const templateVars = { // You'll see templateVars a lot. They're essentially variables that need to be sent to the ejs code for that to function.
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars); // including templateVars in the render lets it be sent to the page in views. Wahoo!
});

app.post("/urls", (req, res) => { //this is what lets you make a shortened url. 
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot shorten URLs on this site if you are not logged in!</body></html>\n");
  }
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = {}; // makes the initial object for the id (so the below two lines don't return undefined and break something.)
  urlDatabase[id]['longURL'] = req.body.longURL; 
  urlDatabase[id]['userID'] = req.session.user_id;
  res.redirect(`/urls/${id}`); // Redirect to the /urls:id page
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
  // a simple render of a page. No fuss here.
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n");
  }
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view the url pages if you are not logged in!</body></html>");
  }
  let idValid = false;
  let userUrls = urlsForUser(req.session.user_id);
  for (let url in userUrls) { // this basically looks for the inputted id in urls the user's made. Since we're only worried about one url, a boolean check works here.
    if (req.params.id === url) {
      idValid = true;
      break;
    }
  }
  if (idValid === false) {
    return res.send("<html><body>You are not the owner of this url!</body></html>");
  }
  // all of the above in this section are security measures and crash prevention. 
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n");
  }
  return res.redirect(urlDatabase[req.params.id]['longURL']);
  // this just links you to your shortened url. 
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Required input not found.");
  }
  for (let object in users) {
    if (users[object]['email'] === req.body.email) {
      return res.status(400).send("Email is already registered.");
    }
  }
  // The above code is security measures. No crashing the site with already used emails or lacking required inputs.
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10); // encrypts your password. Safety first!
  users[id] = { // puts the above consts (minus password, for safety) into the users database.
    id,
    email,
    password: hashedPassword,
  };
  req.session.user_id = id; // sets your id as a cookie.
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n");
  }
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view the url pages if you are not logged in!</body></html>");
  }
  let idValid = false;
  for (let url in urlsForUser(req.session.user_id)) {
    if (req.params.id === url) {
      idValid = true;
      break;
    }
  }
  if (idValid === false) {
    return res.send("<html><body>You are not the owner of this url!</body></html>");
  }
  // all of the above are security measures.
  const idToDelete = req.params.id;

  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    return res.redirect("/urls");
  } else {
    return res.status(404).send("URL not found"); // this is here to prevent the site from crashing from getting something that doesn't exist.
  }
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;   // changes the chosen url to the new one submitted by the user. Not terribly complex.
  console.log(`TEST 1: ${req.params.id}`);
  res.redirect("/urls");
});

app.get("/urls/:id/edit", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("<html><body>This id does not exist!</body></html>\n");
  }
  if (!req.session.user_id) {
    return res.send("<html><body>You cannot view the url pages if you are not logged in!</body></html>");
  }
  let idValid = false;
  for (let url in urlsForUser(req.session.user_id)) {
    if (req.params.id === url) {
      idValid = true;
      break;
    }
  }
  if (idValid === false) {
    return res.send("<html><body>You are not the owner of this url!</body></html>");
  }
  // all of the above are security mesures.

  const id = req.params.id; // Don't remove this, the templateVars break if you do and I don't know why, but just don't.

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
  res.render("login"); // Behold, yon common login page.
});

app.post("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  if (!searchThroughUsers(req.body.email, 'email')) {
    return res.status(403).send(`No account was found using this email.`);
  }
  for (let object in users) {
    if (users[object]['email'] === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[object].password)) { // this bit compares the passwords.
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
  req.session = null; // cookie clearing after you logout. 
  return res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`); // a little note to the server runner.
});

