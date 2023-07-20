const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "userData.db");
let db = null;
app.use(express.json());
const initializeDbaAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbaAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUser = `SELECT * FROM user WHERE username='${username}';`;
  const dataUser = await db.get(selectUser);

  if (dataUser === undefined) {
    const createUser = `INSERT INTO user (username,name,password,gender,location)
        VALUES
        (
            '${username}',
            '${name}',
            '${password}',
            '${gender}',
            '${location}'
            );`;
    if (validatePassword(password)) {
      await db.run(createUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username='${username}';`;
  const dataUser = await db.get(selectUser);

  if (dataUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordThere = await bcrypt.compare(password, dataUser.password);
    if (passwordThere === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUser = `SELECT * FROM user WHERE username='${username}';`;
  const dataUser = await db.get(selectUser);
  if (dataUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordThere = await bcrypt.compare(oldPassword, dataUser.password);
    if (passwordThere === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
                UPDATE user SET password='${hashedPassword}'
                WHERE username='${username}';`;
        const user = await db.run(updateQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
