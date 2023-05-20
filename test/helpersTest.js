const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

// testing getUserByEmail
const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });
  it('should return undefined with invalid email', function() {
    const user = getUserByEmail("invalid@example.com", testUsers);
    assert.strictEqual(user, undefined);
  });
});

// testing urlsForUser
const testURLs = {
  "abc": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "karma"
  },
  "def": {
    longURL: "http://www.google.com",
    userID: "karma"
  },
  "ghi": {
    longURL: "http://www.nhl.com",
    userID: "charlie"
  }
};

describe('urlsForUser', function() {
  it('should return an object of user specific urls', function() {
    const userURL = urlsForUser("karma", testURLs);
    const expectedURLs = {
      "abc": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "karma"
      },
      "def": {
        longURL: "http://www.google.com",
        userID: "karma"
      }
    }
    assert.deepEqual(userURL, expectedURLs);
  });
  it('should return an empty object for an invalid user', function() {
    const userURL = urlsForUser("enzo", testURLs);
    assert.deepEqual(userURL, {});
  });
});