/* eslint-disable prefer-destructuring */
/* eslint-disable no-useless-concat */
/* eslint-disable max-len */
// This is the actual backend server;
const { ApolloServer } = require("apollo-server-express");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");

const typeDefs = require("./schema");
const config = require("./config");
const UserAPI = require("./datasources/users");
const ModelAPI = require("./datasources/models");
const InstrumentAPI = require("./datasources/instruments");
const CalibrationEventAPI = require("./datasources/calibrationEvents");
const { createStore, createDB } = require("./util");
const resolvers = require("./resolvers");
const BulkDataAPI = require("./datasources/bulkData");

const other_express_routes = require("./express"); // use express server too

const { jwtSecret, jwtExp } = config;

function verityJWT(token) {
  let auth = null;
  // let auth = (req.headers && req.headers.authorization) || null;
  // //console.log(req.baseUrl, req.headers);
  if (token) {
    try {
      token = token.replace("Bearer ", "");
      auth = jwt.verify(token, jwtSecret);
    } catch (error) {
      console.log("error decoding jwt");
      auth = null;
    }
  }
  return auth;
}

async function startApolloServer() {
  console.log("initializing server!");
  // build frontend code
  if (process.env.NODE_ENV !== "production") {
    const build = exec(
      "cd ./../client && npm run build",
      function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log("Error code: " + error.code);
          console.log("Signal received: " + error.signal);
        }
        console.log("Child Process STDOUT: " + stdout);
        console.log("Child Process STDERR: " + stderr);
      }
    );

    build.on("exit", function (code) {
      console.log("Child process exited with exit code " + code);
    });
  }
  let store = null;
  let dataSources = null;

  while (store === null) {
    console.log("in while loop");
    // Connect to db and init tables
    await createDB()
      .then(async () => {
        store = await createStore(false);
        const categories_on_start = [
          "voltmeter",
          "current_shunt_meter",
          "Klufe_K5700-compatible",
          "precision_multimeter",
        ];
        for (var category of categories_on_start) {
          if (
            (await store.modelCategories.findOne({
              where: { name: category },
            })) === null
          ) {
            await store.modelCategories.create({
              name: category,
            });
          }
        }
      })
      .catch(async (e) => {
        console.log("something broke!");
        console.error(e);
      });
  }

  // Define api
  dataSources = {
    userAPI: new UserAPI({ store }),
    modelAPI: new ModelAPI({ store }),
    instrumentAPI: new InstrumentAPI({ store }),
    calibrationEventAPI: new CalibrationEventAPI({ store }),
    bulkDataAPI: new BulkDataAPI({ store }),
  };

  const server = new ApolloServer({
    context: async ({ req }) => {
      // simple auth check on every request
      if (process.env.NODE_ENV.includes("dev")) {
        return { user: null };
      }
      const user = verityJWT(req.cookies && req.cookies.token); // decode jwt
      console.log(user);
      // // if decode ok
      const storeModel = await store;
      const userVals = await storeModel.users
        .findAll({
          where: { userName: user?.userName },
        })
        .then((val) => {
          if (val && val[0]) {
            // look up user and return their info
            return val[0].dataValues;
          }
          return null; // return null if user no longer exists
        })
        .catch(() => null);

      return { user: userVals }; // return user: userVals(null if user doesn't exist/no jwt header, not null if jwt okay and user exists) to API classes
    },
    // Additional constructor options
    typeDefs,
    resolvers,
    dataSources: () => dataSources,
    formatError: (err) => {
      console.error("ERROR IN SERVER: ", err);
      return err;
    },
  });
  await server.start();
  const app = express();
  app.use(express.static(path.join(__dirname, "/../client/build")));

  //add other middleware
  app.use(cors({ credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  other_express_routes.setUpExpressApp(app);

  app.post("/validateCookie", async (req, res) => {
    let auth = verityJWT(req.cookies && req.cookies.token);
    if (!auth) {
      res.send({
        status: 401,
        success: false,
        message: "Cookie expired",
      });
      return;
    }
    res.send({
      status: 200,
      success: true,
      message: "Cookie valid",
    });
  });

  // app.post("/login", async (req, res) => {
  //   try {
  //     const { email, password } = req.body;
  //     const { success, jwt, message, user } = await dataSources.userAPI.login({
  //       email,
  //       password,
  //     });
  //     if (success) {
  //       res.cookie("token", jwt, {
  //         maxAge: parseInt(jwtExp.replace("h", "")) * 60 * 60 * 1000,
  //         httpOnly: true,
  //       });
  //       res.status(200).json({ message, success, user });
  //       return;
  //     }
  //     res.send({
  //       status: 401,
  //       success,
  //       message,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send(error.message);
  //   }
  // });

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "/../client/build", "index.html"));
  });
  server.applyMiddleware({
    app,
    path: "/graphql",
  });

  const port = process.env.PORT || 4000;
  await new Promise((resolve) => app.listen({ port }, resolve));
  console.log(`Server ready at ${server.graphqlPath} on port ${port}`);
}

startApolloServer();
