// generates random 6 digit alphanumeric string for user ids and minilinks
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
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};

// returns an object of user specific urls
const urlsForUser = function(userID, database) {
  const userSpecificUrls = {};
  for (let urlID in database) {
    if (database[urlID].userID === userID) {
      userSpecificUrls[urlID] = database[urlID];
    }
  } return userSpecificUrls;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };