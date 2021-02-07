/*
This class is a beast; should refactor soon;
This class deals with creating an instrument as well as creating
calibration events for that instrument. All of this happens on one page
no less, so that is also why it's beefy.
*/
import React, { useContext, useState } from 'react';
import CreateInstrument from '../queries/CreateInstrument';
import UserContext from '../components/UserContext';
import ErrorPage from './ErrorPage';
import InstrumentForm from '../components/InstrumentForm';
import VerticalLinearStepper from '../components/VerticalStepper';
import CalibrationTable from '../components/CalibrationTable';
import AddCalibEvent from '../queries/AddCalibEvent';

function CreateInstrumentPage() {
  const [calibHistory, setCalibHistory] = useState([{
    user: '', date: new Date().toISOString().split('T')[0], comment: '', id: 0,
  }]); // calibhistory is the array of calibration events.
  const onChangeCalibRow = (e, entry) => { // This method deals with updating a particular calibration event
    const newHistory = [...calibHistory];
    const index = newHistory.indexOf(entry);
    newHistory[index] = { ...entry };
    if (e.target.name === 'user') {
      newHistory[index].user = e.target.value;
    } else if (e.target.name === 'date') {
      newHistory[index].date = e.target.value;
    } else {
      newHistory[index].comment = e.target.value;
    }
    setCalibHistory(newHistory);
  };
  const [validated, setValidated] = useState(false);
  const [allowNextStep, setNexStepOK] = useState([false, true, true]);
  const [formState, setFormState] = useState({ // This state is for an instrument
    modelNumber: '',
    vendor: '',
    comment: '',
    serialNumber: '',
  });
  const [nextId, setNextId] = useState(1); // This is for assining unique ids to our array
  const addRow = () => { // This adds an entry to the array(array = calibration history)
    const newHistory = calibHistory;
    newHistory.push({
      user: '',
      date: new Date().toISOString().split('T')[0], // The new Date() thing defaults date to today
      comment: '',
      id: nextId,
    });
    setNextId(nextId + 1);
    setCalibHistory(newHistory);
  };
  const deleteRow = (rowId) => { // This is for deleting an entry from array
    if (calibHistory.length > 1) {
      const newHistory = calibHistory.filter((item) => item.id !== rowId);
      setCalibHistory(newHistory);
    } else {
      // eslint-disable-next-line no-alert
      alert('Cannot delete the last row');
    }
  };

  const handleSubmit = async () => {
    // This is to submit all the data
    const {
      modelNumber, vendor, comment, serialNumber,
    } = formState;
    const response = await CreateInstrument({
      modelNumber,
      vendor,
      serialNumber,
      comment,
    });
    // eslint-disable-next-line no-alert
    alert(response.message);
    if (response.success) { // If we successfully added new instrument
      const validEvents = calibHistory.filter((entry) => entry.user.length > 0); // Collect valid entries
      if (validEvents.length > 0) { // If there are valid entries, add them to DB
        const handleRes = (res) => {
          console.log(res);
        };
        AddCalibEvent({
          events: validEvents,
          modelNumber,
          vendor,
          serialNumber,
          handleResponse: handleRes,
        });
      }
    }
  };

  const changeHandler = (e) => { // This is for updating the instrument's fields from regular inputs
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };
  const onInputChange = (e, v) => { // This if for updating instrument's fields from autocomplete input
    // console.log(e, v);
    setFormState({ ...formState, modelNumber: v.modelNumber, vendor: v.vendor });
  };
  const onStepChange = () => {
    setValidated(true);
    const { serialNumber, modelNumber, vendor } = formState;
    if (serialNumber.length > 0 && modelNumber.length > 0 && vendor.length > 0) {
      setNexStepOK([true, true, true]);
    } else {
      console.log(modelNumber.length, vendor.length, serialNumber.length);
      let message = (modelNumber.length === 0) ? 'model number, ' : '';
      message = message.concat('', (vendor.length === 0) ? 'vendor, ' : '');
      message = message.concat('', (serialNumber.length === 0) ? 'serial number' : '');
      // eslint-disable-next-line no-alert
      alert(`Please enter ${message}`);
    }
  };
  const user = useContext(UserContext);
  if (!user.isAdmin) {
    return <ErrorPage message="You don't have the right permissions!" />;
  }
  const {
    modelNumber, vendor, serialNumber, comment,
  } = formState;
  // Caliblist is the list of calibration events where the username is not an empty string
  const calibList = calibHistory.map((entry) => entry.user.length > 0 && (
  <li className="list-group-item" key={entry.id}>
    {`Calibrated by ${entry.user} on ${entry.date}`}
    <br />
    {`Comment: ${entry.comment}`}
  </li>
  ));
  const getSteps = () => ['Select Model', 'Input Calibration History', 'Review']; // These are the labels for the vertical stepper
  const getStepContent = (step) => { // This controls what content to display for each step in the vertical stepper
    switch (step) {
      case 0:
        return (
          <InstrumentForm
            modelNumber={modelNumber}
            vendor={vendor}
            comment={comment}
            serialNumber={serialNumber}
            handleSubmit={handleSubmit}
            changeHandler={changeHandler}
            validated={validated}
            onInputChange={onInputChange}
          />
        );
      case 1: // Should check if instrument is calibratable here. If it is not, display CalibrationTable in viewOnly mode
        return (
          <CalibrationTable rows={calibHistory} addRow={addRow} deleteRow={deleteRow} onChangeCalibRow={onChangeCalibRow} />
        );
      case 2:
        return (
          <div>
            <InstrumentForm
              modelNumber={modelNumber}
              vendor={vendor}
              comment={comment}
              serialNumber={serialNumber}
              handleSubmit={handleSubmit}
              changeHandler={changeHandler}
              validated={validated}
              onInputChange={onInputChange}
              viewOnly
            />
            <ul className="list-group">
              {calibList}
            </ul>
          </div>
        );
      default:
        return 'Unknown step';
    }
  };
  return (
    <div className="d-flex justify-content-center mt-5">
      <VerticalLinearStepper getSteps={getSteps} getStepContent={getStepContent} onStepChange={onStepChange} stepsOK={allowNextStep} onFinish={handleSubmit} />
    </div>
  );
}

export default CreateInstrumentPage;
