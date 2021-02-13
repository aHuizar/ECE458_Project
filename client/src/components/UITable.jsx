/* eslint-disable react/require-default-props */
import * as React from 'react';
import { DataGrid, GridToolbar } from '@material-ui/data-grid';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';

export default function DisplayGrid({
  rows, cols, cellHandler, handleExport, setChecked,
}) {
  DisplayGrid.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    rows: PropTypes.array.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    cols: PropTypes.array.isRequired,
    cellHandler: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    handleExport: PropTypes.func,
    setChecked: PropTypes.func,
  };

  return (
    <>
      <DataGrid
        rows={rows}
        columns={cols}
        pageSize={10}
        checkboxSelection
        showToolbar
        locateText={{
          toolbarDensity: 'Size',
          toolbarDensityLabel: 'Size',
          toolbarDensityCompact: 'Small',
          toolbarDensityStandard: 'Medium',
          toolbarDensityComfortable: 'Large',
        }}
        autoHeight
        onCellClick={(e) => {
          if (cellHandler) {
            cellHandler(e);
          }
        }}
        onSelectionChange={(newSelection) => {
          setChecked(newSelection.rowIds);
        }}
        disableSelectionOnClick
        className="bg-light"
        components={{
          Header: () => (
            <span>
              {handleExport && <Button onClick={handleExport} style={{ position: 'fixed', top: '62px', left: '300px' }} className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-textSizeSmall MuiButton-sizeSmall">Export</Button>}
              <GridToolbar />
            </span>
          ),
        }}
      />
    </>
  );
}
