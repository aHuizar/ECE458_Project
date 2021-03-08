import React, { useContext } from 'react';
import Form from 'react-bootstrap/Form';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CircularProgress from '@material-ui/core/CircularProgress';
import { ToastContainer, toast } from 'react-toastify';
import CreateUser from '../queries/CreateUser';
import 'react-toastify/dist/ReactToastify.css';
import '../css/customToast.css';

import UserContext from './UserContext';
import ErrorPage from '../pages/ErrorPage';

// TODO: Add isAdmin
const schema = Yup.object({
  firstName: Yup.string()
    .required('Please enter First Name'),
  lastName: Yup.string()
    .required('Please enter Last Name'),
  userName: Yup.string()
    .required('Please enter Username'),
  email: Yup.string.email()
    .required('Please enter email'),
  password: Yup.string()
    .required('Please enter password'),
});

const initialValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  userName: '',
  isAdmin: false,
};

export default function SignUp() {
  const user = useContext(UserContext);

  const handleSignup = (values, resetForm) => {
    const {
      firstName,
      lastName,
      email,
      password,
      userName,
      isAdmin,
    } = values;
    const handleResponse = (response) => {
      if (response.success) {
        toast.success(response.message);
        resetForm();
      } else {
        toast.error(response.message);
        resetForm();
      }
    };
    CreateUser({
      firstName, lastName, email, password, userName, isAdmin, handleResponse,
    });
  };

  if (!user.isAdmin) {
    return <ErrorPage message="You don't have the right permissions!" />;
  }

  return (
    <>
      <ToastContainer />
      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          setSubmitting(true);
          setTimeout(() => {
            handleSignup(values, resetForm);
            setSubmitting(false);
          }, 500);
        }}
      >
        {({
          handleSubmit,
          handleChange,
          errors,
          values,
          // touched,
          isSubmitting,
        }) => (
          <Form
            noValidate
            onSubmit={handleSubmit}
          >
            <Form.Group controlId="firstName">
              <Form.Label className="h4">First Name</Form.Label>
              <Form.Control
                name="firstName"
                value={values.firstName}
                placeholder="First Name"
                onChange={handleChange}
                isInvalid={!!errors.firstName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.firstName}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="lastName">
              <Form.Label className="h4">Last Name</Form.Label>
              <Form.Control
                name="lastName"
                value={values.lastName}
                placeholder="Last Name"
                onChange={handleChange}
                isInvalid={!!errors.lastName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.lastName}
              </Form.Control.Feedback>
            </Form.Group>
            {/* TODO: Prepend "@" to username */}
            <Form.Group controlId="userName">
              <Form.Label className="h4">Username</Form.Label>
              <Form.Control
                name="userName"
                value={values.userName}
                placeholder="Username"
                onChange={handleChange}
                isInvalid={!!errors.userName}
              />
              {/* TODO: Add validation based on username exists
            TODO: Custom onChange method to remove any @ signs */}
              <Form.Control.Feedback type="invalid">
                {errors.userName}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="email">
              <Form.Label className="h4">Email</Form.Label>
              <Form.Control
                name="email"
                value={values.email}
                placeholder="example@duke.edu"
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
            {/* TODO: Add password confirmation */}
            <Form.Group controlId="password">
              <Form.Label className="h4">Password</Form.Label>
              <Form.Control
                name="password"
                value={values.password}
                type="password"
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>
            <div className="d-flex justify-content-center my-3">
              {isSubmitting ? <CircularProgress />
                : (
                  <button className="btn btn-dark" type="submit">
                    Register
                  </button>
                )}
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
