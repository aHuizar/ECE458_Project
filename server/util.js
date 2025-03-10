// This file handles connection to the database and initializing tables if they don't already exists
const SQL = require("sequelize");
const mysql = require("mysql2/promise");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const config = require("./config");

const {
  host,
  port,
  user,
  password,
  database,
  testDatabase,
  adminUsername,
  adminEmail,
  adminFirstName,
  adminLastName,
  adminPassword,
} = config;

module.exports.createDB = async () => {
  // const connection = await mysql.createConnection({
  //   host,
  //   port,
  //   user,
  //   password,
  // });
  // await connection.query(
  //   `CREATE DATABASE IF NOT EXISTS \`${testDatabase}\`;`,
  // );
  // return await connection.query(
  //   `CREATE DATABASE IF NOT EXISTS \`${database}\`;`,
  // ); // create db if it doesn't exists
  const connection = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  try {
    await connection.connect();
    await connection.end();
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
};

module.exports.createStore = async (useTestDB) => {
  const dbTarget = useTestDB ? testDatabase : database;
  let db;
  // const db = new SQL(dbToUse, user, password, {
  //   host,
  //   dialect: 'mysql' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
  //   port,
  //   // eslint-disable-next-line no-console
  //   define: {
  //     charset: 'utf8mb4',
  //     collate: 'utf8mb4_unicode_ci',
  //   },
  //   // eslint-disable-next-line no-console
  //   logging: () => undefined,
  //   dbToUse,
  // });
  try {
    db = new SQL({
      database: dbTarget,
      username: user,
      password,
      host,
      port,
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: () => undefined,
    });
    await db.authenticate();
    console.log("connected to postgres db");
  } catch (error) {
    console.error("error initializing db", error);
    return;
  }

  db.query("SET NAMES utf8mb4;");

  const users = db.define(
    "users",
    {
      id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: SQL.STRING(500),
        allowNull: false,
      },
      lastName: {
        type: SQL.STRING(128),
        allowNull: false,
      },
      userName: {
        type: SQL.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: SQL.STRING(256),
        allowNull: false,
      },
      createdAt: SQL.DATE,
      updatedAt: SQL.DATE,
      email: {
        type: SQL.STRING(320),
        allowNull: false,
      },
      isAdmin: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      instrumentPermission: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      modelPermission: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      calibrationPermission: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      calibrationApproverPermission: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  const models = db.define(
    "models",
    {
      id: {
        type: SQL.INTEGER,
        autoIncrement: true,
        unique: true,
      },
      vendor: {
        type: SQL.STRING(30),
        primaryKey: true,
        allowNull: false,
      },
      modelNumber: {
        type: SQL.STRING(40),
        primaryKey: true,
        allowNull: false,
      },
      description: {
        type: SQL.STRING(100),
        allowNull: false,
      },
      comment: {
        type: SQL.STRING(2000),
        allowNull: true,
      },
      requiresCalibrationApproval: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      supportLoadBankCalibration: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      supportKlufeCalibration: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      supportCustomCalibration: {
        type: SQL.BOOLEAN,
        allowNull: false,
      },
      customForm: SQL.TEXT,
      calibrationFrequency: SQL.INTEGER,
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  const modelCategories = db.define(
    "modelCategories",
    {
      id: {
        type: SQL.INTEGER,
        autoIncrement: true,
        unique: true,
      },
      name: {
        type: SQL.STRING,
        primaryKey: true,
        allowNull: false,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  const modelCategoryRelationships = db.define(
    "modelCategoryRelationships",
    {
      modelId: {
        type: SQL.INTEGER,
        allowNull: false,
      },
      modelCategoryId: {
        type: SQL.INTEGER,
        allowNull: false,
      },
      taggableType: {
        type: SQL.STRING,
      },
      id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  models.belongsToMany(modelCategories, {
    as: "categories",
    through: {
      model: "modelCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    foreignKey: "modelId",
    constraints: false,
  });
  modelCategories.belongsToMany(models, {
    as: "models",
    through: {
      model: "modelCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    foreignKey: "modelCategoryId",
    constraints: false,
  });

  const calibratorCategoryRelationships = db.define(
    "calibratorCategoryRelationships",
    {
      modelId: {
        type: SQL.INTEGER,
        allowNull: false,
      },
      modelCategoryId: {
        type: SQL.INTEGER,
        allowNull: false,
      },
      taggableType: {
        type: SQL.STRING,
      },
      id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  models.belongsToMany(modelCategories, {
    as: "calibratorCategories",
    through: {
      model: "calibratorCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    foreignKey: "modelId",
    constraints: false,
  });
  modelCategories.belongsToMany(models, {
    as: "calibratorModels",
    through: {
      model: "calibratorCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    foreignKey: "modelCategoryId",
    constraints: false,
  });

  const instruments = db.define(
    "instruments",
    {
      modelReference: {
        type: SQL.INTEGER,
        allowNull: false,
        references: {
          model: "models",
          key: "id",
        },
        onUpdate: "RESTRICT",
        onDelete: "RESTRICT",
      },
      vendor: {
        type: SQL.STRING(30),
        allowNull: false,
      },
      modelNumber: {
        type: SQL.STRING(40),
        allowNull: false,
      },
      serialNumber: {
        type: SQL.STRING(40),
        allowNull: true,
      },
      calibrationFrequency: {
        type: SQL.INTEGER,
        allowNull: true,
      },
      comment: {
        type: SQL.STRING(2000),
        allowNull: true,
      },
      description: {
        type: SQL.STRING(100),
        allowNull: false,
      },
      id: {
        type: SQL.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      assetTag: {
        type: SQL.INTEGER,
        unique: true,
      },
    },
    {
      freezeTableName: true,
    },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  const instrumentCategories = db.define(
    "instrumentCategories",
    {
      id: {
        type: SQL.INTEGER,
        autoIncrement: true,
        unique: true,
      },
      name: {
        type: SQL.STRING,
        primaryKey: true,
        allowNull: false,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  const instrumentCategoryRelationships = db.define(
    "instrumentCategoryRelationships",
    {
      id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  instruments.belongsToMany(instrumentCategories, {
    as: "instrumentCategories",
    through: {
      model: "instrumentCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    targetKey: "id",
  });

  instrumentCategories.belongsToMany(instruments, {
    as: "instruments",
    through: {
      model: "instrumentCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    targetKey: "id",
  });

  models.hasMany(modelCategoryRelationships, {
    as: "mtmcr",
    foreignKey: "modelId", // B.a_id
    sourceKey: "id", // the A.id
    constraints: false,
  });

  modelCategoryRelationships.belongsTo(models, {
    as: "mcrtm",
    foreignKey: "modelId", // B.a_id
    targetKey: "id", // the A.id
    constraints: false,
  });

  modelCategories.hasMany(modelCategoryRelationships, {
    as: "mctmcr",
    foreignKey: "modelCategoryId", // B.a_id
    sourceKey: "id", // the A.id
    constraints: false,
  });

  modelCategoryRelationships.belongsTo(modelCategories, {
    as: "mcrtmc",
    foreignKey: "modelCategoryId", // B.a_id
    targetKey: "id", // the A.id
    constraints: false,
  });

  instruments.hasMany(instrumentCategoryRelationships, {
    as: "iticr",
    foreignKey: "instrumentId", // B.a_id
    sourceKey: "id", // the A.id
    constraints: false,
  });

  instrumentCategoryRelationships.belongsTo(instruments, {
    as: "icrti",
    foreignKey: "instrumentId", // B.a_id
    targetKey: "id", // the A.id
    constraints: false,
  });

  instrumentCategories.hasMany(instrumentCategoryRelationships, {
    as: "icticr",
    foreignKey: "instrumentCategoryId", // B.a_id
    sourceKey: "id", // the A.id
    constraints: false,
  });

  instrumentCategoryRelationships.belongsTo(instrumentCategories, {
    as: "icrtic",
    foreignKey: "instrumentCategoryId", // B.a_id
    targetKey: "id", // the A.id
    constraints: false,
  });

  instruments.hasMany(modelCategoryRelationships, {
    as: "itmcr",
    foreignKey: "modelId", // B.a_id
    sourceKey: "modelReference", // the A.id
    constraints: false,
  });

  modelCategoryRelationships.belongsTo(instruments, {
    as: "mcrti",
    foreignKey: "modelId", // B.a_id
    targetKey: "modelReference", // the A.id
    constraints: false,
  });

  instruments.belongsToMany(modelCategories, {
    as: "modelCategories",
    through: {
      model: "modelCategoryRelationships",
      unique: false,
    },
    sourceKey: "modelReference",
    foreignKey: "modelId",
    constraints: false,
  });

  modelCategories.belongsToMany(instruments, {
    as: "instrumentsOfModels",
    through: {
      model: "modelCategoryRelationships",
      unique: false,
    },
    sourceKey: "id",
    foreignKey: "modelCategoryId",
    constraints: false,
  });

  const calibrationEvents = db.define(
    "calibrationEvents",
    {
      id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      calibrationHistoryIdReference: {
        type: SQL.INTEGER,
        allowNull: false,
        references: {
          model: "instruments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user: {
        type: SQL.STRING,
        allowNull: false,
      },
      userFirstName: {
        type: SQL.STRING,
        allowNull: false,
      },
      userLastName: {
        type: SQL.STRING,
        allowNull: false,
      },
      date: {
        type: SQL.DATEONLY,
        allowNull: false,
      },
      comment: SQL.STRING(2000),
      fileLocation: SQL.STRING,
      fileName: SQL.STRING,
      loadBankData: SQL.TEXT,
      klufeData: SQL.TEXT,
      customFormData: SQL.TEXT,
      // Approval states
      // 0 - awaiting approval
      // 1 - approved
      // 2 - rejected
      // 3 - no approval required
      approvalStatus: {
        type: SQL.INTEGER,
        allowNull: false,
      },
      approverUsername: SQL.STRING,
      approverFirstName: SQL.STRING,
      approverLastName: SQL.STRING,
      approvalDate: SQL.DATEONLY,
      approvalComment: SQL.STRING(2000),
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  const calibratedByRelationships = db.define(
    "calibratedByRelationships",
    {
      id: {
        type: SQL.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      calibration: {
        type: SQL.INTEGER,
        allowNull: false,
        references: {
          model: "calibrationEvents",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      calibratedInstrument: {
        type: SQL.INTEGER,
        allowNull: false,
        references: {
          model: "instruments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      calibratedBy: {
        type: SQL.INTEGER,
        allowNull: false,
      },
      byVendor: {
        type: SQL.STRING(30),
        allowNull: false,
      },
      byModelNumber: {
        type: SQL.STRING(40),
        allowNull: false,
      },
      bySerialNumber: {
        type: SQL.STRING(40),
        allowNull: true,
      },
      byAssetTag: {
        type: SQL.INTEGER,
        allowNull: false,
      },
    },
    { freezeTableName: true },
    {
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      },
    }
  );

  calibrationEvents.hasMany(calibratedByRelationships, {
    as: "calibratedBy",
    sourceKey: "id",
    foreignKey: "calibration",
    constraints: false,
  });

  instruments.hasMany(calibrationEvents, {
    as: "recentCalibration",
    sourceKey: "id",
    foreignKey: "calibrationHistoryIdReference",
    constraints: false,
  });
  db.sync();
  const adminExist = await users.findAll({
    where: { userName: adminUsername },
  });

  if (adminExist[0] == null) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    users.create({
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      userName: adminUsername,
      password: hash,
      isAdmin: true,
      calibrationPermission: true,
      calibrationApproverPermission: true,
      modelPermission: true,
      instrumentPermission: true,
    });
  }

  // const checkVoltmeter = await modelCategories.findOne({
  //   where: { name: 'voltmeter' },
  // });
  // if (checkVoltmeter === null) {
  //   await modelCategories.create({
  //     name: 'voltmeter',
  //   });
  // }

  // const checkShuntmeter = await modelCategories.findOne({
  //   where: { name: 'current_shunt_meter' },
  // });
  // if (checkShuntmeter === null) {
  //   await modelCategories.create({
  //     name: 'current_shunt_meter',
  //   });
  // }

  // const checkKlufe = await modelCategories.findOne({
  //   where: { name: 'Klufe_K5700-compatible' },
  // });
  // if (checkKlufe === null) {
  //   await modelCategories.create({
  //     name: 'Klufe_K5700-compatible',
  //   });
  // }

  return {
    db,
    users,
    models,
    instruments,
    calibrationEvents,
    calibratedByRelationships,
    modelCategories,
    modelCategoryRelationships,
    instrumentCategories,
    instrumentCategoryRelationships,
    calibratorCategoryRelationships,
  };
};
