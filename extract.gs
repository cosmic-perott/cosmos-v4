
function onChange(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getDataRange();
  
  var values = range.getValues();
  var backgrounds = range.getBackgrounds();
  var fontColors = range.getFontColors();
  var fontWeights = range.getFontWeights(); 
  var fontStyles = range.getFontStyles();   
  
  var gridData = [];

  for (var r = 0; r < values.length; r++) {
    var rowData = [];
    for (var c = 0; c < values[r].length; c++) {
      rowData.push({
        value: values[r][c],
        background: backgrounds[r][c],
        color: fontColors[r][c],
        isBold: fontWeights[r][c] === 'bold',
        isItalic: fontStyles[r][c] === 'italic'
      });
    }
    gridData.push(rowData);
  }

  var url = [NGROK WEBHOOK]; 
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify({ rows: gridData })
  };
  
  UrlFetchApp.fetch(url, options);
}
