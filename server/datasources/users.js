// This file deals with what methods a user model should have
const { DataSource } = require("apollo-datasource");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("./../config");

const { jwtSecret, jwtExp } = config;

function validateUser({ firstName, lastName, password, email }) {
  if (firstName.length > 128) {
    return [false, "First name must be under 128 characters!"];
  }
  if (lastName.length > 128) {
    return [false, "Last name must be under 128 characters!"];
  }
  if (password.length > 256) {
    return [false, "Password must be under 128 characters!"];
  }
  if (email.length > 320) {
    return [false, "Email must be under 128 characters!"];
  }
  return [true];
}

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

  checkPermissions() {
    const { user } = this.context;
    if (process.env.NODE_ENV.includes("dev")) {
      return true;
    }
    return user.isAdmin;
  }

  /**
   * This function takes a userName and password and see if it belongs
   * to a user in the db
   */
  async login({ userName, password }) {
    const response = { success: false, message: "", jwt: "", user: null };
    await this.findUser({ userName }).then((value) => {
      if (!value) {
        response.message = "Wrong username/password";
      } else {
        response.success = bcrypt.compareSync(password, value.password);
        response.message = response.success
          ? "Logged in"
          : "Wrong username/password";
        response.jwt = response.success
          ? jwt.sign({ userName }, jwtSecret, {
              expiresIn: jwtExp,
            })
          : "";
      }
    });
    return JSON.stringify(response);
  }

  /**
   * This function takes a netId, and logs this user in (optionally creates if they do not exist)
   */
  async oauthLogin({ netId, firstName, lastName }) {
    const email = `${netId}@duke.edu`;
    const userName = `${netId}@duke.edu`;
    const isAdmin = false;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const password = bcrypt.hashSync(netId, salt);

    const response = {
      success: true,
      message: "",
      userName,
      jwt: "",
    };
    await this.findUser({ userName }).then((value) => {
      if (value) {
        response.message = "Account already exists";
      } else {
        this.store.users.create({
          email,
          firstName,
          lastName,
          userName,
          password,
          isAdmin,
          modelPermission: false,
          instrumentPermission: false,
          calibrationPermission: false,
          calibrationApproverPermission: false,
        });
        response.message = "Created account for user";
        // 1 day = 8.64e7 ms
        const signSync = createSigner({
          key: "secret",
          expiresIn: 8.64e7,
        });
        response.jwt = signSync({
          userName,
        });
      }
    });
    return JSON.stringify(response);
  }

  /**
   * This function takes a userName and password and see if it belongs
   * to a user in the db
   */
  async updatePassword({ userName, oldPassword, newPassword }) {
    const response = { success: false, message: "" };
    await this.findUser({ userName }).then((value) => {
      if (value) {
        if (bcrypt.compareSync(oldPassword, value.password)) {
          // TODO: Update password to new password (verify this is correct)
          const saltRounds = 10;
          const salt = bcrypt.genSaltSync(saltRounds);
          const password = bcrypt.hashSync(newPassword, salt);
          this.store.users.update({ password }, { where: { userName } });
          response.success = true;
          response.message = "Successfully updated password";
        } else {
          response.message = "Incorrect password";
        }
      } else {
        response.message = "User does not exist";
      }
    });
    return JSON.stringify(response);
  }

  async editPermissions({
    userName,
    isAdmin,
    modelPermission,
    calibrationPermission,
    instrumentPermission,
    calibrationApproverPermission,
  }) {
    const response = { success: false, message: "", user: null };
    const storeModel = await this.store;
    this.store = storeModel;
    if (!this.checkPermissions()) {
      response.message = "ERROR: User does not have permission.";
      return response;
    }
    // eslint-disable-next-line max-len
    if (
      isAdmin &&
      (!modelPermission ||
        !instrumentPermission ||
        !calibrationPermission ||
        !calibrationApproverPermission)
    ) {
      response.message =
        "ERROR: admin permission must imply all other permissions";
      return response;
    }
    if (modelPermission && !instrumentPermission) {
      response.message =
        "ERROR: model permission must imply instrument permission";
      return response;
    }
    if (calibrationApproverPermission && !calibrationPermission) {
      response.message =
        "ERROR: calibration approver permission must imply calibration permission";
      return response;
    }
    if (userName !== "admin") {
      await this.store.users.update(
        {
          isAdmin,
          modelPermission,
          calibrationPermission,
          calibrationApproverPermission,
          instrumentPermission,
        },
        { where: { userName } }
      );
      response.success = true;
      response.message = `Updated user permissions for user ${userName}`;
      response.user = await this.findUser({ userName });
    } else {
      response.message = "ERROR: Cannot change local admin permissions";
    }
    return response;
  }

  async deleteUser({ userName }) {
    const response = { success: false, message: "" };
    const storeModel = await this.store;
    this.store = storeModel;
    if (!this.checkPermissions()) {
      response.message = "ERROR: User does not have permission.";
      return JSON.stringify(response);
    }
    if (userName !== "admin") {
      this.store.users.destroy({ where: { userName } });
      response.success = true;
      response.message = `Deleted user ${userName}`;
    } else {
      response.message = "ERROR: Cannot delete local admin";
    }
    return JSON.stringify(response);
  }

  async isAdmin({ userName }) {
    let response = false;
    await this.findUser({ userName }).then((value) => {
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
  async findUser({ userName }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const user = await this.store.users.findAll({ where: { userName } });
    const exists = user && user[0];
    return exists ? user[0] : null;
  }

  async getAllUsers({ limit = null, offset = null, orderBy = null }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const users = await this.store.users.findAll({
      limit,
      offset,
      order: orderBy,
    });
    return users;
  }

  async countAllUsers() {
    const storeModel = await this.store;
    this.store = storeModel;
    let total = await this.store.users.findAndCountAll();
    total = total.count;
    return total;
  }

  /**
   * This function attempts to create a user if they don't match a userName that's already in use
   */
  async createUser({
    email,
    firstName,
    lastName,
    userName,
    password,
    isAdmin,
    instrumentPermission = false,
    modelPermission = false,
    calibrationPermission = false,
    calibrationApproverPermission = false,
  }) {
    const response = { message: "", success: false };
    const validation = validateUser({
      firstName,
      lastName,
      password,
      email,
    });
    if (!this.checkPermissions()) {
      response.message = "ERROR: User does not have permission.";
      return JSON.stringify(response);
    }
    if (!validation[0]) {
      // eslint-disable-next-line prefer-destructuring
      response.message = validation[1];
      return JSON.stringify(response);
    }
    await this.findUser({ userName }).then((value) => {
      if (value) {
        response.message = "Username already exists!";
      } else {
        this.store.users.create({
          email,
          firstName,
          lastName,
          userName,
          password,
          isAdmin,
          instrumentPermission:
            isAdmin || modelPermission || instrumentPermission,
          modelPermission: isAdmin || modelPermission,
          calibrationPermission: isAdmin || calibrationPermission,
          calibrationApproverPermission:
            isAdmin || calibrationApproverPermission,
        });
        response.message = "Account Created!";
        response.success = true;
      }
    });
    return JSON.stringify(response);
  }
}

module.exports = UserAPI;
