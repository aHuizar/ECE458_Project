import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { print } from 'graphql';
import SearchIcon from '@material-ui/icons/Search';
import AsyncSuggest from './AsyncSuggest';

// eslint-disable-next-line no-unused-vars
export default function SearchBar({
  forModelSearch, onSearch, initVendors, initModelNumbers, initDescriptions, initModelCategories,
}) {
  SearchBar.propTypes = {
    forModelSearch: PropTypes.bool.isRequired,
    onSearch: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    initVendors: PropTypes.array,
    // eslint-disable-next-line react/forbid-prop-types
    initModelNumbers: PropTypes.array,
    // eslint-disable-next-line react/forbid-prop-types
    initDescriptions: PropTypes.array,
    // eslint-disable-next-line react/forbid-prop-types
    initModelCategories: PropTypes.array,
  };
  SearchBar.defaultProps = {
    initVendors: null,
    initModelNumbers: null,
    initDescriptions: null,
    initModelCategories: [],
  };
  const actualCategories = initModelCategories === null ? [] : initModelCategories;
  // const [which, setWhich] = React.useState('vendor');
  // eslint-disable-next-line no-unused-vars
  const [vendors, setVendors] = React.useState(initVendors);
  const [modelNumbers, setModelNumbers] = React.useState(initModelNumbers);
  const [descriptions, setDescriptions] = React.useState(initDescriptions);
  const [modelCategories, setModelCategories] = React.useState(actualCategories);
  // eslint-disable-next-line no-unused-vars
  const [instrumentCategories, setInstrumentCategories] = React.useState([]);
  const [serialNumbs, setSerialNumbs] = React.useState(null);
  const [assetTag, setAssetTag] = React.useState(null);
  React.useEffect(() => {
    let active = true;

    (() => {
      if (active) {
        const formattedCategories = [];
        initModelCategories?.forEach((element) => {
          formattedCategories.push({ name: element });
        });
        setModelCategories(formattedCategories);
      }
    })();

    return () => {
      active = false;
    };
  }, [initModelCategories]);
  React.useEffect(() => {
    let active = true;

    (() => {
      if (active) {
        const formatedVendor = initVendors !== null ? { vendor: initVendors } : null;
        setVendors(formatedVendor);
      }
    })();

    return () => {
      active = false;
    };
  }, [initVendors]);
  React.useEffect(() => {
    let active = true;

    (() => {
      if (active) {
        const formattedDesc = initDescriptions !== null ? { description: initDescriptions } : null;
        setDescriptions(formattedDesc);
      }
    })();

    return () => {
      active = false;
    };
  }, [initDescriptions]);
  React.useEffect(() => {
    let active = true;

    (() => {
      if (active) {
        const fomrattedModelNumber = initModelNumbers !== null ? { modelNumber: initModelNumbers } : null;
        setModelNumbers(fomrattedModelNumber);
      }
    })();

    return () => {
      active = false;
    };
  }, [initModelNumbers]);

  const baseSearchRow = () => (
    <>
      <div className="m-2 w-25 my-auto pt-1">
        <AsyncSuggest
          query={print(gql`
              query Models {
                getUniqueVendors {
                  vendor
                }
              }
            `)}
          queryName="getUniqueVendors"
          onInputChange={(_e, v) => setVendors(v)}
          label="Filter by Vendor"
          getOptionLabel={(option) => `${option.vendor}`}
          getOptionSelected={(option, value) => option.vendor === value.vendor}
          value={vendors}
          isComboBox
        />
      </div>
      <div className="m-2 w-25 my-auto pt-1">
        <AsyncSuggest
          query={print(gql`
              query GetModelNumbers {
                getAllModels {
                  modelNumber
                }
              }
            `)}
          queryName="getAllModels"
          onInputChange={(_e, v) => setModelNumbers(v)}
          label="Filter by Model Number"
          getOptionLabel={(option) => `${option.modelNumber}`}
          getOptionSelected={(option, value) => option.modelNumber === value.modelNumber}
          value={modelNumbers}
          isComboBox
        />
      </div>
      <div className="m-2 w-25 my-auto pt-1">
        <AsyncSuggest
          query={print(gql`
              query GetCategories {
                getAllModelCategories {
                  name
                }
              }
            `)}
          queryName="getAllModelCategories"
          onInputChange={(_e, v) => setModelCategories(v)}
          label={forModelSearch ? 'Filter by Category' : 'Filter by Model Category'}
          getOptionLabel={(option) => `${option.name}`}
          getOptionSelected={() => undefined}
          multiple
          multipleValues={modelCategories}
        />
      </div>
      <div className="m-2 w-25 my-auto pt-1">
        <AsyncSuggest
          query={print(gql`
              query GetModelNumbers {
                getAllModels {
                  description
                }
              }
            `)}
          queryName="getAllModels"
          onInputChange={(_e, v) => setDescriptions(v)}
          label="Filter by Description"
          getOptionLabel={(option) => `${option.description}`}
          getOptionSelected={(option, value) => option.description === value.description}
          value={descriptions}
          isComboBox
        />
      </div>
      {/* {dropdownMenu} */}
      <button
        className="btn my-auto mx-2"
        type="button"
        onClick={() => onSearch({
          vendors: vendors?.vendor,
          modelNumbers: modelNumbers?.modelNumber,
          descriptions: descriptions?.description,
          modelCategories,
        })}
      >
        <SearchIcon />
      </button>
    </>
  );

  if (forModelSearch) {
    return baseSearchRow();
  }
  return (
    <>
      <div className="d-flex flex-column w-100">
        <div className="d-flex flex-row w-100">{baseSearchRow()}</div>
        <div className="d-flex flex-row w-100 pt-2">
          <div className="m-2 w-25 my-auto pt-1">
            <AsyncSuggest
              query={print(gql`
                query getSerialNumbs {
                  getAllInstruments {
                    serialNumber
                  }
                }
              `)}
              queryName="getAllInstruments"
              onInputChange={(_e, v) => setSerialNumbs(v)}
              label="Filter by Serial Number"
              getOptionLabel={(option) => `${option.serialNumber}`}
              getOptionSelected={(option, value) => option.serialNumber === value.serialNumber}
              isComboBox
              value={serialNumbs}
            />
          </div>
          <div className="m-2 w-25 my-auto pt-1">
            <AsyncSuggest
              query={print(gql`
                query getSerialNumbs {
                  getAllInstruments {
                    id
                  }
                }
              `)}
              queryName="getAllInstruments"
              onInputChange={(_e, v) => setAssetTag(v)}
              label="Filter by Asset Tag"
              getOptionLabel={(option) => `${option.id}`}
              getOptionSelected={(option, value) => option.id === value.id}
              isComboBox
              value={assetTag}
            />
          </div>
          <div className="m-2 w-25 my-auto pt-1">
            <AsyncSuggest
              query={print(gql`
                query getInstCats {
                  getAllInstrumentCategories {
                    name
                  }
                }
              `)}
              queryName="getAllInstrumentCategories"
              onInputChange={(_e, v) => setInstrumentCategories(v)}
              label="Filter by Instrument Category"
              getOptionLabel={(option) => `${option.name}`}
              getOptionSelected={() => undefined}
              multiple
              multipleValues={instrumentCategories}
            />
          </div>
          {/* This is for matching the spacing of the above row */}
          <div className="m-2 w-25 my-auto pt-1" />
          <button
            className="btn my-auto mx-2 invisible"
            type="button"
          >
            <SearchIcon />
          </button>
        </div>
      </div>
    </>
  );
}
