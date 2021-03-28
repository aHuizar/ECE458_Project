import { gql } from '@apollo/client';
import { print } from 'graphql';
import PropTypes from 'prop-types';
import { QueryAndThen } from '../components/UseQuery';

export default async function GetInstrumentCategories({ limit, offset, orderBy }) {
  GetInstrumentCategories.propTypes = {
    limit: PropTypes.number,
    offset: PropTypes.number,
    // eslint-disable-next-line react/forbid-prop-types
    orderBy: PropTypes.array,
  };
  const GET_INSTRUMENT_CATEGORIES_QUERY = gql`
    query Instruments($limit: Int, $offset: Int, $orderBy: [[String]]) {
        getAllInstrumentCategories(limit: $limit, offset: $offset, orderBy: $orderBy) {
          id
          name
        }
    }
  `;
  const query = print(GET_INSTRUMENT_CATEGORIES_QUERY);
  const queryName = 'getAllInstrumentCategories';
  const getVariables = () => ({ limit, offset, orderBy });
  const response = await QueryAndThen({ query, queryName, getVariables });
  return response;
}

export async function CountInstrumentCategories() {
  const query = print(gql`
        query Count{
            countInstrumentCategories
        }
    `);
  const queryName = 'countInstrumentCategories';
  const response = await QueryAndThen({ query, queryName });
  return response;
}

export async function CountInstrumentsAttached({ name }) {
  const query = print(gql`
        query Count($name: String!){
          countInstrumentsAttachedToCategory(name: $name)
        }
    `);
  const getVariables = () => ({ name });
  const queryName = 'countInstrumentsAttachedToCategory';
  const response = await QueryAndThen({ query, queryName, getVariables });
  return response;
}
