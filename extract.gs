function onChange(e) {
  var cloudWebhookUrl = "https://nlcscosmos.com/api/sheet-webhook";
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  var data = sheet.getDataRange().getValues();
  
  var payload = {
    "sheetName": sheet.getName(),
    "changeType": e.authMode, // Captures details about the event
    "allData": data
  };
  
  var options = {
    "method" : "post",
    "contentType": "application/json",
    "payload" : JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(cloudWebhookUrl, options);
}
