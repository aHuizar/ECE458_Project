/* eslint-disable no-useless-concat */
/* eslint-disable max-len */
// This is the actual backend server;
const { ApolloServer, AuthenticationError } = require('apollo-server');

const { createVerifier } = require('fast-jwt');
const typeDefs = require('./schema');
const UserAPI = require('./datasources/users');
const ModelAPI = require('./datasources/models');
const InstrumentAPI = require('./datasources/instruments');
const CalibrationEventAPI = require('./datasources/calibrationEvents');
const { createStore, createDB } = require('./util');
const resolvers = require('./resolvers');
const BulkDataAPI = require('./datasources/bulkData');

require('./express'); // use express server too

// Connect to db and init tables
let store;
createDB().then(() => {
  store = createStore();
});

// Define api
const dataSources = () => ({
  userAPI: new UserAPI({ store }),
  modelAPI: new ModelAPI({ store }),
  instrumentAPI: new InstrumentAPI({ store }),
  calibrationEventAPI: new CalibrationEventAPI({ store }),
  bulkDataAPI: new BulkDataAPI({ store }),
});

const server = new ApolloServer({
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || ''; // get jwt from header
    const verifyWithPromise = createVerifier({ key: async () => 'secret' });
    const user = await verifyWithPromise(auth).then((value) => value).catch(() => (null)); // decode jwt
    if (
      !user // jwt DNE || malformed
      && !(req.body.query === 'mutation LoginMutation($password: String!, $userName: String!) {\n' + '  login(password: $password, userName: $userName)\n'
    + '}\n')) { // and query !== login, then that's invalid access
      console.log('invalid access');
      throw new AuthenticationError('you must be logged in');
    }
    // if decode ok
    const storeModel = await store;
    const userVals = await storeModel.users.findAll({ where: { userName: user?.userName || req.body?.variables?.userName } }).then((val) => {
      if (val && val[0]) { // look up user and return their info
        return val[0].dataValues;
      }
      return null; // return null if user no longer exists
    });
    return { user: userVals }; // return user: userVals(null if user doesn't exist/no jwt header, not null if jwt okay and user exists) to API classes
  },
  // Additional constructor options
  typeDefs,
  resolvers,
  dataSources,
});

server.listen().then(() => {
  console.log(`
    Server is running!
    Listening on port 4000
    Explore at https://studio.apollographql.com/dev
  `);
});
