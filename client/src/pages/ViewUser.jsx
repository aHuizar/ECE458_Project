/* eslint-disable no-nested-ternary */
import React from 'react';
import { useHistory } from 'react-router-dom';
import CircularProgress from '@material-ui/core/CircularProgress';
import { gql } from '@apollo/client';
import { EditUserForm } from '../components/UserForm';
import Query from '../components/UseQuery';
import ModalAlert from '../components/ModalAlert';
import UserContext from '../components/UserContext';
import GetUser from '../queries/GetUser';

export default function ViewUser() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const user = React.useContext(UserContext);
  const [fetched, setFetched] = React.useState(false);
  const [formState, setFormState] = React.useState({
    userName: urlParams.get('userName'),
    isAdmin: false,
    modelPermission: false,
    instrumentPermission: false,
    calibrationPermission: false,
  });
  const disabledButtons = formState.userName === 'admin' || formState.userName === user.userName;
  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!active) {
        return;
      }
      GetUser({ userName: urlParams.get('userName'), includeAll: true }).then((response) => {
        setFormState(response);
        setFetched(true);
      });
    })();
    return () => { active = false; };
  }, []);
  const onChangeCheckbox = (event) => {
    if (formState.userName !== 'admin') {
      if (event.target.name === 'isAdmin') { // isAdmin check changed
        setFormState({
          ...formState, modelPermission: event.target.checked, instrumentPermission: event.target.checked, calibrationPermission: event.target.checked, isAdmin: event.target.checked,
        });
      } else if (event.target.name === 'modelPermission') {
        setFormState({
          ...formState,
          modelPermission: event.target.checked,
          instrumentPermission: event.target.checked,
        });
      } else {
        setFormState({ ...formState, [event.target.name]: event.target.checked });
      }
    }
  };
  const [loading, setLoading] = React.useState(false);
  const [responseMsg, setResponseMsg] = React.useState('');
  const history = useHistory();
  // eslint-disable-next-line no-unused-vars
  const handleResponse = (response) => {
    setLoading(false);
    setResponseMsg(response.message);
    if (response.success) {
      setTimeout(() => {
        setResponseMsg('');
        if (history.location.state?.previousUrl) {
          let path = history.location.state.previousUrl.split(window.location.host)[1];
          if (path.includes('count')) {
            const count = parseInt(path.substring(path.indexOf('count')).split('count=')[1], 10) - 1;
            path = path.replace(path.substring(path.indexOf('count')), `count=${count}`);
          }
          history.replace( // This code updates the url to have the correct count
            path,
            null,
          );
        } else {
          history.replace('/', null);
        }
      }, 1000);
    }
  };
  const deleteBtn = (
    <ModalAlert
      title="Delete User"
      btnText=""
      altBtnId="delete-user-btn"
      popOverText={disabledButtons ? `You cannot delete user ${formState.userName}` : `Delete ${formState.userName}`}
      altBtn={(
        <svg
          id="delete-user-btn"
          style={{ cursor: disabledButtons ? 'auto' : 'pointer' }}
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className={
            disabledButtons
              ? 'bi bi-trash-fill mt-3 disabled'
              : 'bi bi-trash-fill mt-3'
          }
          viewBox="0 0 16 16"
        >
          {/* eslint-disable-next-line max-len */}
          <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
        </svg>
      )}
      altCloseBtnId="close-delete-user-modal"
    >
      <>
        {responseMsg.length === 0 && (
          <div className="h5 text-center my-3">{`You are about to delete user ${formState.userName}. Are you sure?`}</div>
        )}
        <div className="d-flex justify-content-center">
          {loading ? (
            <CircularProgress />
          ) : responseMsg.length > 0 ? (
            <div className="mx-5 mt-3 h5">{responseMsg}</div>
          ) : (
            <>
              <div className="mt-3">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    Query({
                      query: gql`
                        mutation DelUser($userName: String!) {
                          deleteUser(userName: $userName)
                        }
                      `,
                      queryName: 'deleteUser',
                      getVariables: () => ({ userName: formState.userName }),
                      handleResponse,
                    });
                  }}
                >
                  Yes
                </button>
              </div>
              <span className="mx-3" />
              <div className="mt-3">
                <button
                  className="btn "
                  type="button"
                  id="close-delete-user-modal"
                >
                  No
                </button>
              </div>
            </>
          )}
        </div>
      </>
    </ModalAlert>
  );

  return (
    <>
      {fetched && (
        <EditUserForm
          formState={formState}
          onChangeCheckbox={onChangeCheckbox}
          deleteBtn={deleteBtn}
        />
      )}
    </>
  );
}
