/* eslint-disable no-unused-vars */
/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Tabs, Tab } from 'react-bootstrap';
import CircularProgress from '@material-ui/core/CircularProgress';
import { ServerPaginationGrid } from '../components/UITable';
import ModalAlert from '../components/ModalAlert';
import MouseOverPopover from '../components/PopOver';
import GetModelCategories, { CountModelCategories, CountModelsAttached } from '../queries/GetModelCategories';
import GetInstrumentCategories, { CountInstrumentCategories, CountInstrumentsAttached } from '../queries/GetInstrumentCategories';
import DeleteModelCategory from '../queries/DeleteModelCategory';
import DeleteInstrumentCategory from '../queries/DeleteInstrumentCategory';
import CreateInstrumentCategory from '../queries/CreateInstrumentCategory';
import CreateModelCategory from '../queries/CreateModelCategory';
import EditModelCategory from '../queries/EditModelCategory';
import EditInstrumentCategory from '../queries/EditInstrumentCategory';

function ManageCategories() {
  const history = useHistory();
  const queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let startTab;
  if (window.location.pathname.startsWith('/model')) {
    startTab = 'model';
  } else {
    startTab = 'instrument';
  }
  const [key, setKey] = useState(startTab);
  const [rowCount, setRowCount] = React.useState(parseInt(urlParams.get('count'), 10));
  const [initPage, setInitPage] = React.useState(parseInt(urlParams.get('page'), 10));
  const [initLimit, setInitLimit] = React.useState(parseInt(urlParams.get('limit'), 10));
  const [category, setCategory] = React.useState('');
  const [responseMsg, setResponseMsg] = React.useState('');
  const [responseStatus, setResponseStatus] = React.useState(true);
  const [showDelete, setShowDelete] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [num, setNum] = React.useState(0);

  history.listen((location, action) => {
    urlParams = new URLSearchParams(location.search);
    const lim = parseInt(urlParams.get('limit'), 10);
    const pg = parseInt(urlParams.get('page'), 10);
    if ((action === 'PUSH' && lim === 25 && pg === 1) || action === 'POP') {
      // if user clicks on models nav link or goes back
      setInitLimit(lim);
      setInitPage(pg);
    }
  });
  const cellHandler = (e) => {
    setCategory(e.row.name);
  };

  const getNumAttached = async () => {
    if (key === 'model') {
      const count = await CountModelsAttached({ name: category });
      setNum(count);
    } else {
      const count = await CountInstrumentsAttached({ name: category });
      setNum(count);
    }
  };

  const cols = [
    {
      field: 'id',
      headerName: 'ID',
      width: 60,
      hide: true,
      disableColumnMenu: true,
      type: 'number',
    },
    {
      field: 'name',
      headerName: 'Category',
      width: 200,
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 120,
      disableColumnMenu: true,
      renderCell: () => (
        <div className="row">
          <div className="col mt-1">
            <MouseOverPopover message="Edit category">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowEdit(true);
                }}
              >
                Edit
              </button>
            </MouseOverPopover>
          </div>
        </div>
      ),
    },
    {
      field: 'delete',
      headerName: 'Delete',
      width: 120,
      disableColumnMenu: true,
      renderCell: () => (
        <div className="row">
          <div className="col mt-1">
            <MouseOverPopover message="Delete category">
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  await getNumAttached();
                  setShowDelete(true);
                }}
              >
                Delete
              </button>
            </MouseOverPopover>
          </div>
        </div>
      ),
    },
  ];

  async function updateRow(k) {
    let searchString;
    setRowCount(0);
    if (k === 'model') {
      await CountModelCategories().then((val) => {
        setRowCount(val);
        searchString = `?page=${1}&limit=${25}&count=${val}`;
      });
    } else {
      await CountInstrumentCategories().then((val) => {
        setRowCount(val);
        searchString = `?page=${1}&limit=${25}&count=${val}`;
      });
    }
    history.push(`/${key}Categories${searchString}`);
  }

  const closeDeleteModal = async () => {
    setResponseMsg('');
    setResponseStatus(false);
    setShowDelete(false);
    await updateRow(key);
  };
  const closeEditModal = async () => {
    setResponseMsg('');
    setResponseStatus(false);
    setShowEdit(false);
    await updateRow(key);
  };
  const closeCreateModal = async () => {
    setResponseMsg('');
    setResponseStatus(false);
    setShowCreate(false);
    await updateRow(key);
  };
  const handleResponse = (response) => {
    setResponseMsg(response.message);
    setResponseStatus(response.success);
    setLoading(false);
  };
  const handleDelete = () => {
    setLoading(true);
    if (key === 'model') {
      DeleteModelCategory({ name: category, handleResponse });
    } else {
      DeleteInstrumentCategory({ name: category, handleResponse });
    }
  };
  const handleEdit = (catName) => {
    setLoading(true);
    if (key === 'model') {
      EditModelCategory({ currentName: category, updatedName: catName, handleResponse });
    } else {
      EditInstrumentCategory({ currentName: category, updatedName: catName, handleResponse });
    }
  };
  const handleCreate = (catName) => {
    setLoading(true);
    if (key === 'model') {
      CreateModelCategory({ name: catName, handleResponse });
    } else {
      CreateInstrumentCategory({ name: catName, handleResponse });
    }
  };

  return (
    <>
      <ModalAlert
        show={showDelete}
        handleClose={closeDeleteModal}
        title="DELETE CATEGORY"
      >
        <>
          {responseMsg.length === 0 && (
            <div>
              <div className="h4 text-center my-3">{`You are about to delete category ${category}. Are you sure?`}</div>
              <div className="h4 text-center my-3">{`This category is attached to ${num} ${key}${num === 1 ? '' : 's'} `}</div>
            </div>
          )}
          <div className="d-flex justify-content-center">
            {loading ? (
              <CircularProgress />
            ) : responseMsg.length > 0 ? (
              <div className="mx-5 mt-3 h4">{responseMsg}</div>
            ) : (
              <>
                <div className="mt-3">
                  <button className="btn " type="button" onClick={handleDelete}>
                    Yes
                  </button>
                </div>
                <span className="mx-3" />
                <div className="mt-3">
                  <button className="btn " type="button" onClick={closeDeleteModal}>
                    No
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      </ModalAlert>
      <ModalAlert
        show={showEdit}
        handleClose={closeEditModal}
        title="EDIT CATEGORY"
      >
        <>
          {responseMsg.length === 0 && (
            <div className="h4 text-center my-3">{`Change name of category: ${category}`}</div>
          )}
          <div className="d-flex justify-content-center">
            {loading ? (
              <CircularProgress />
            ) : responseMsg.length > 0 ? (
              <div className="mx-5 mt-3 h4">{responseMsg}</div>
            ) : (
              <>
                <input id="editCat" />
                <span className="mx-3" />
                <div className="mt-3">
                  <button
                    className="btn "
                    type="button"
                    onClick={() => {
                      handleEdit((document.getElementById('editCat').value));
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      </ModalAlert>
      <ModalAlert
        show={showCreate}
        handleClose={closeCreateModal}
        title="ADD CATEGORY"
      >
        <>
          {responseMsg.length === 0 && (
            <div className="h4 text-center my-3">Create new category</div>
          )}
          <div className="d-flex justify-content-center">
            {loading ? (
              <CircularProgress />
            ) : responseMsg.length > 0 ? (
              <div className="mx-5 mt-3 h4">{responseMsg}</div>
            ) : (
              <>
                <input id="cat" />
                <span className="mx-3" />
                <div className="mt-3">
                  <button
                    className="btn "
                    type="button"
                    onClick={() => {
                      handleCreate((document.getElementById('cat').value));
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      </ModalAlert>
      <Tabs
        id="tabs"
        activeKey={key}
        onSelect={async (k) => {
          await updateRow(k);
          setKey(k);
          setInitLimit(25);
          setInitPage(1);
        }}
        unmountOnExit
      >
        <Tab eventKey="model" title="Model Categories">
          <ServerPaginationGrid
            rowCount={rowCount}
            cellHandler={cellHandler}
            headerElement={(
              <div>
                <button className="btn  m-2" type="button" onClick={() => setShowCreate(true)}>
                  Create Model Category
                </button>
              </div>
            )}
            cols={cols}
            initPage={initPage}
            initLimit={initLimit}
            onPageChange={(page, limit) => {
              const searchString = `?page=${page}&limit=${limit}&count=${rowCount}`;
              if (window.location.search !== searchString) {
                history.push(`/modelCategories${searchString}`);
                setInitLimit(limit);
                setInitPage(page);
              }
            }}
            onPageSizeChange={(page, limit) => {
              const searchString = `?page=${page}&limit=${limit}&count=${rowCount}`;
              if (window.location.search !== searchString) {
                history.push(`/modelCategories${searchString}`);
                setInitLimit(limit);
                setInitPage(page);
              }
            }}
            fetchData={(limit, offset) => GetModelCategories({ limit, offset }).then((response) => response)}
          />
        </Tab>
        <Tab eventKey="instrument" title="Instrument Categories">
          <ServerPaginationGrid
            rowCount={rowCount}
            cellHandler={cellHandler}
            headerElement={(
              <div>
                <button className="btn  m-2" type="button" onClick={() => setShowCreate(true)}>
                  Create Instrument Category
                </button>
              </div>
            )}
            cols={cols}
            initPage={initPage}
            initLimit={initLimit}
            onPageChange={(page, limit) => {
              const searchString = `?page=${page}&limit=${limit}&count=${rowCount}`;
              if (window.location.search !== searchString) {
                history.push(`/instrumentCategories${searchString}`);
                setInitLimit(limit);
                setInitPage(page);
              }
            }}
            onPageSizeChange={(page, limit) => {
              const searchString = `?page=${page}&limit=${limit}&count=${rowCount}`;
              if (window.location.search !== searchString) {
                history.push(`/instrumentCategories${searchString}`);
                setInitLimit(limit);
                setInitPage(page);
              }
            }}
            fetchData={(limit, offset) => GetInstrumentCategories({ limit, offset }).then((response) => response)}
          />
        </Tab>
      </Tabs>

    </>
  );
}

export default ManageCategories;
