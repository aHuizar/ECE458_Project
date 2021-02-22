/* eslint-disable no-await-in-loop */
// This file deals with what methods a model model should have
const { DataSource } = require('apollo-datasource');
const SQL = require('sequelize');

function validateModel({
  modelNumber = '', vendor = '', description = '', comment = '',
}) {
  if (vendor.length > 30) {
    return [false, 'Vendor input must be under 30 characters!'];
  }
  if (modelNumber.length > 40) {
    return [false, 'Model number must be under 40 characters!'];
  }
  if (description.length > 100) {
    return [false, 'Description input must be under 100 characters!'];
  }
  if (comment.length > 2000) {
    return [false, 'Comment input must be under 2000 characters!'];
  }
  return [true];
}

class ModelAPI extends DataSource {
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

  async countAllModels() {
    const storeModel = await this.store;
    this.store = storeModel;
    let total = await this.store.models.findAndCountAll();
    total = total.count;
    return total;
  }

  async deleteModel({ modelNumber, vendor }) {
    const response = { message: '', success: false };
    const storeModel = await this.store;
    this.store = storeModel;
    const model = await this.getModel({ modelNumber, vendor });
    const modelReference = model.dataValues.id;
    await this.store.instruments.findAll({ where: { modelReference } }).then(async (data) => {
      if (data && data[0]) {
        response.message = 'ERROR: Instrument is dependent on model!';
      } else {
        await this.store.models.destroy({ where: { modelNumber, vendor } });
        response.message = 'Model deleted!';
        response.success = true;
      }
    });
    return JSON.stringify(response);
  }

  async editModel({
    id,
    modelNumber,
    vendor,
    description,
    comment,
    calibrationFrequency,
  }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const response = { message: '', success: false };
    const validation = validateModel({
      modelNumber, vendor, description, comment,
    });
    if (!validation[0]) {
      // eslint-disable-next-line prefer-destructuring
      response.message = validation[1];
      return JSON.stringify(response);
    }
    await this.getModel({ modelNumber, vendor }).then(async (value) => {
      if (value && value.id !== id) {
        response.message = 'That model number and vendor pair already exists!';
      } else {
        this.store.models.update(
          {
            modelNumber,
            vendor,
            description,
            comment,
            calibrationFrequency,
          },
          { where: { id } },
        );
        const modelReference = id;
        const instrumentList = await this.store.instruments.findAll({
          where: { modelReference },
        });
        // console.log(instrumentList);
        for (let i = 0; i < instrumentList.length; i += 1) {
          await this.store.instruments.update(
            {
              modelNumber,
              vendor,
              description,
              calibrationFrequency,
            },
            { where: { id: instrumentList[i].dataValues.id } },
          );
        }
        response.message = 'Model Updated Successfully!';
        response.success = true;
      }
    });
    return JSON.stringify(response);
  }

  async getAllModels({ limit = null, offset = null }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const models = await this.store.models.findAll({ limit, offset });
    return models;
  }

  async getModelsWithFilter({
    vendor, modelNumber, description, categories,
  }) {
    const storeModel = await this.store;
    this.store = storeModel;
    let includeData;
    if (categories) {
      includeData = [
        {
          model: this.store.modelCategories,
          as: 'categories',
          through: 'modelCategoryRelationships',
          where: {
            name: categories,
          },
        },
      ];
    } else {
      includeData = [
        {
          model: this.store.modelCategories,
          as: 'categories',
          through: 'modelCategoryRelationships',
        },
      ];
    }

    // eslint-disable-next-line prefer-const
    let filters = [];
    if (vendor) filters.push({ vendor: SQL.where(SQL.fn('LOWER', SQL.col('vendor')), 'LIKE', `%${vendor.toLowerCase()}%`) });
    if (modelNumber) filters.push({ modelNumber: SQL.where(SQL.fn('LOWER', SQL.col('modelNumber')), 'LIKE', `%${modelNumber.toLowerCase()}%`) });
    if (description) filters.push({ description: SQL.where(SQL.fn('LOWER', SQL.col('description')), 'LIKE', `%${description.toLowerCase()}%`) });

    const models = await this.store.models.findAll({
      include: includeData,
      where: filters,
    });

    return models;
  }

  async getAllModelsWithModelNum({ modelNumber }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const models = await this.store.models.findAll({ where: { modelNumber } });
    return models;
  }

  async getAllModelsWithVendor({ vendor }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const models = await this.store.models.findAll({ where: { vendor } });
    return models;
  }

  async getUniqueVendors() {
    const storeModel = await this.store;
    this.store = storeModel;
    const models = await this.store.models.findAll({ attributes: [[SQL.fn('DISTINCT', SQL.col('vendor')), 'vendor']] });
    return models;
  }

  async getModel({ modelNumber, vendor }) {
    const storeModel = await this.store;
    this.store = storeModel;
    const model = await this.store.models.findAll({
      where: { modelNumber, vendor },
    });
    if (model && model[0]) {
      return model[0];
    }
    return null;
  }

  async addModel({
    modelNumber,
    vendor,
    description,
    comment,
    calibrationFrequency,
  }) {
    const response = { message: '' };
    const storeModel = await this.store;
    this.store = storeModel;
    const validation = validateModel({
      modelNumber, vendor, description, comment,
    });
    if (!validation[0]) {
      // eslint-disable-next-line prefer-destructuring
      response.message = validation[1];
      return JSON.stringify(response);
    }
    await this.getModel({ modelNumber, vendor }).then((value) => {
      if (value) {
        response.message = `Model ${vendor} ${modelNumber} already exists!`;
      } else {
        this.store.models.create({
          modelNumber,
          vendor,
          description,
          comment,
          calibrationFrequency,
        });
        response.message = `Added new model, ${vendor} ${modelNumber}, into the DB!`;
      }
    });
    return JSON.stringify(response);
  }
}

module.exports = ModelAPI;
