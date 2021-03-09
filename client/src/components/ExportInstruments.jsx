import { CSVLink } from 'react-csv';
import { Button } from 'react-bootstrap';
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import GetInstrumentsForExport from '../queries/GetInstrumentsForExport';

const ExportInstruments = ({ setLoading, filterOptions }) => {
  ExportInstruments.propTypes = {
    setLoading: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    filterOptions: PropTypes.object.isRequired,
  };
  console.log(filterOptions);
  const [transactionData, setTransactionData] = useState([]);

  let csvData = '1,2,3';
  const headers = [
    { label: 'Vendor', key: 'vendor' },
    { label: 'Model-Number', key: 'modelNumber' },
    { label: 'Serial-Number', key: 'serialNumber' },
    { label: 'Asset-Tag-Number', key: 'assetTag' },
    { label: 'Comment', key: 'comment' },
    { label: 'Calibration-Date', key: 'calibrationDate' },
    { label: 'Calibration-Comment', key: 'calibrationComment' },
    { label: 'Instrument-Categories', key: 'instrumentCategories' },
    { label: 'Calibration-File-Attachment', key: 'calibrationFile' },
    { label: 'Calibration-Load-Bank-Results-Exist', key: 'calibrationLoadBank' },
  ];

  const getData = async () => {
    await GetInstrumentsForExport({ filterOptions }).then((res) => {
      console.log(res);
      csvData = res;
    });
    return csvData;
  };

  const csvLink = useRef(); // setup the ref that we'll use for the hidden CsvLink click once we've updated the data

  const filterTransactionData = (r) => {
    const filteredData = [];
    r.instruments.forEach((row) => {
      const updatedRow = {
        vendor: row.vendor.replace(/"/g, '""'),
        modelNumber: row.modelNumber.replace(/"/g, '""'),
        serialNumber: row.serialNumber ? row.serialNumber.replace(/"/g, '""') : '',
        assetTag: row.assetTag,
        comment: row.comment ? row.comment.replace(/"/g, '""') : '',
        instrumentCategories: row.instrumentCategories.map((item) => item.name).join(' '),
        calibrationDate: row.recentCalibration[0].date ? row.recentCalibration[0].date : '',
        calibrationComment: row.recentCalibration[0].comment ? row.recentCalibration[0].comment : '',
        calibrationFile: row.recentCalibration[0].fileName ? `Attached file ${row.recentCalibration[0].fileName}` : '',
        calibrationLoadBank: row.recentCalibration[0].loadBankData ? 'Calibrated via Load Bank Wizard' : '',
      };
      filteredData.push(updatedRow);
    });
    return filteredData;
  };

  const getTransactionData = async () => {
    setLoading(true);
    await getData()
      .then((r) => {
        const filteredData = filterTransactionData(r);
        setTransactionData(filteredData);
      })
      .catch((e) => {
        console.log('CAUGHT');
        console.log(e);
      });
    setLoading(false);
    csvLink.current.link.click();
  };

  return (
    <>
      <Button onClick={getTransactionData} variant="dark" className="ms-3">
        Export Instruments
      </Button>
      <CSVLink
        data={transactionData}
        headers={headers}
        filename="instruments.csv"
        className="hidden"
        ref={csvLink}
      />
    </>
  );
};

export default ExportInstruments;
