const _ = require("lodash");

const UsersDB = [
  {
    username: "mark",
    password: "password1", // User password
    scopes: ["notes"], // Authorized actions
  },
];

const login = (username, password) => {
  const user = _.find(UsersDB, {
    username,
  });
  if (!user) throw new Error("User not found!");

  const hasValidPassword = user.password === password;
  if (!hasValidPassword) throw new Error("Invalid password");

  return _.omit(user, "password");
};

module.exports = {
  login,
};
