// This file deals with what methods a user model should have
const { DataSource } = require('apollo-datasource');
const bcrypt = require('bcryptjs');

class UserAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
  }

  /**
   * This is a function that gets called by ApolloServer when being setup.
   * This function gets called with the datasource config including things
   * like caches and context. We'll assign this.context to the request context
   * here, so we can know about the user making requests
   */
  initialize(config) {
    this.context = config.context;
  }

  /**
   * This function takes a userName and password and see if it belongs
   * to a user in the db
   */
  async login({ userName: uArg, password: pArg }) {
    const response = { success: false, message: '', user: null };
    await this.findUser({ userName: uArg }).then((value) => {
      if (!value) {
        response.message = 'No username found';
      } else {
        response.success = bcrypt.compareSync(pArg, value.password);
        response.message = response.success
          ? 'Logged in'
          : 'Wrong username/password';
        response.user = response.success ? value : null;
      }
    });
    return JSON.stringify(response);
  }

  async isAdmin({ userName: uArg }) {
    let response = false;
    await this.findUser({ userName: uArg }).then((value) => {
      if (!value) {
        // no user exists
      } else if (value.isAdmin) {
        response = true;
      }
    });
    return response;
  }

  /**
   * This function attempts to find a user from a given userName
   */
  async findUser({ userName: uArg }) {
    // console.log(this.store);
    const storeModel = await this.store;
    this.store = storeModel;
    const user = await this.store.users.findAll({ where: { userName: uArg } });
    const exists = user && user[0];
    if (exists) {
      await this.store.users.update(
        { token: Buffer.from(uArg).toString('base64') },
        { where: { token: null } },
      );
    }
    return exists ? user[0] : null;
  }

  /**
   * This function attempts to create a user if they don't match a userName that's already in use
   */
  async createUser({
    email: emailArg,
    firstName: fName,
    lastName: lName,
    userName: uName,
    password: pwd,
    isAdmin,
  }) {
    const response = { success: false, message: '' };
    await this.findUser({ userName: uName }).then((value) => {
      if (value) {
        response.message = 'User already exists!';
      } else {
        this.store.users.create({
          email: emailArg,
          firstName: fName,
          lastName: lName,
          userName: uName,
          password: pwd,
          isAdmin,
        });
        response.message = 'Account Created!';
        response.success = true;
      }
    });
    return JSON.stringify(response);
  }
}

module.exports = UserAPI;
