/**
 * utility 1 - the button:
 * 
 * config:
 */
const promt = "enter a number of default rows to add"
const default_row_values = ["2024-01-01",null,null,null,"essential"]
const n_columns = default_row_values.length

/**
 * @param {Sheet} sheet - https://developers.google.com/apps-script/reference/spreadsheet/sheet
 * @param {number} n_rows - integer > 0, number of rows to be prepended
 */
function prepend_default_rows(sheet, n_rows) {
  // get current date
  const date = new Date().toISOString().slice(0,10)
  default_row_values[0] = date
  // prepare rows of default values
  const rows_values = Array(n_rows).fill(default_row_values)
  prepend_rows(sheet, rows_values)
}

/**
 * @param {Sheet} sheet - https://developers.google.com/apps-script/reference/spreadsheet/sheet
 * @param {Array<Array>} rows_values - 2D array of string or number
 * @param {number} add_empty_rows - integer >= 0, to add empty rows for visual seperation
 */
function prepend_rows(sheet, rows_values, add_empty_rows=1) {
  const n_rows = rows_values.length
  const n_columns = rows_values[0].length
  sheet.insertRowsBefore(2, n_rows + add_empty_rows)
  sheet.getRange(2,1,n_rows,n_columns).setValues(rows_values)
}

/**
 * when a cell with value == `promt` gets updated with a number, it execute the preprend function, then reset the cell value to `promt`.
 * ref:
 * https://developers.google.com/apps-script/guides/triggers#onedite
 * 
 * @param {Event} e - https://developers.google.com/apps-script/guides/triggers/events#edit
 */
function __onEdit(e) {
  const new_value = parseInt(e.value)
  if (new_value > 0 && e.oldValue == promt) {
    prepend_default_rows(e.source.getActiveSheet(), new_value)
    e.range.setValue(promt)
  }
}
/**
 * why using onEdit ? it is for triggering the script from the sheet mobile app
 * https://www.youtube.com/watch?v=SERvgSdWugc
 * 
 * however, using onEdit trigger is not really efficient, as the script runs on every edit, which is extensive workload.
 * a workaround is to use mobile browser's desktop mode and a button
 * https://stackoverflow.com/questions/50894212/getting-google-apps-scripts-to-run-on-mobile
 */
function add_rows_button_on_click() {
  const n_rows = parseInt(Browser.inputBox(promt))
  if (n_rows > 0) {
    prepend_default_rows(SpreadsheetApp.getActiveSheet(), n_rows)
  }
}





/**
 * utility 2 - the web app:
 * 
 * config:
 * log_sheet_name - the name of the sheet to insert data
 * apps_to_track - list of app's packageName for filtering the notifications
 */
const log_sheet_name = "log-example"
const apps_to_track = [
  'com.tpb.mb.gprsandroid', // tpbank
]
const notification_content_parsing_functions = {
  'com.tpb.mb.gprsandroid': parse_notification_tpbank,
}
// each app should have a dedicated parsing function, as each app has its own notification content format
// tho a general parsing function can be possible using OpenAI API


function doGet(e) {
  return ContentService.createTextOutput('hello world')
}

function doPost(e) {
  try {
    const notis_list = JSON.parse(e.postData.contents)
    // filter by apps_to_track, exclude group notification
    const notis_list_filtered = notis_list.filter(
      (noti) => apps_to_track.includes(noti.packageName) && noti.tag != 'ranker_group'
    )
    // do nothing if there is no noti after filtering
    if (notis_list_filtered.length == 0) {
      return ContentService.createTextOutput('no notification is processed')
    }
    // process notifications to rows of data
    const rows = notis_list_filtered.map(process_notification_to_row_data)
    //
    const sheet = SpreadsheetApp.getActive().getSheetByName(log_sheet_name)
    prepend_rows(sheet, rows)
    return ContentService.createTextOutput('ok')
  }
  catch (error) {
    Logger.log({e, error})
    return ContentService.createTextOutput("error:\n check the error log at the 'Executions' tab to debug")
  }
}

/**
 * @param {Notification} notification - json object from `termux-notification-list`, see an example at debug_doPost().e_sample.postData
 * @return {Array<>} - 
 */
function process_notification_to_row_data(notification) {
  const noti_date_iso_string = notification.when.slice(0,10) // "2024-01-01" 
  // parse
  const noti_parsing_function = notification_content_parsing_functions[notification.packageName]
  const notification_parsed = noti_parsing_function(notification.content)
  // date, amount, message, category, necessity
  return [noti_date_iso_string, notification_parsed.amount, notification_parsed.message, null, "essential"]
}

/** 
 *
 * @param {string} noti_content
 * @return {} ...
 */
function parse_notification_tpbank(noti_content) {
  // matching using regex
  const amount_match = noti_content.match(/PS:(\+?-?[0-9.]+)VND/)
  const message_match = noti_content.match(/ND:(.+)/)
  // getting actual match value with match[1]
  let amount = amount_match ? amount_match[1] : '0'
  let message = message_match ? message_match[1].trim() : null
  // parse amount_string, example: -85.500 => -86
  amount = parseInt(amount.replace('.',''))
  amount = Math.floor(amount / 1000)
  //
  const default_message_to_ignore = 'NGUYEN CONG THUAN chuyen tien'
  if (message == default_message_to_ignore) {
    message = null
  }
  return {amount, message}
}



/**
 * debugging and testing area
 */
const input_sample = {
    "parameter": {},
    "parameters": {},
    "queryString": "",
    "contextPath": "",
    "postData": {
      "contents": '[{"id":-1020207995,"tag":"","key":"...","group":"","packageName":"com.tpb.mb.gprsandroid","title":"","content":"(TPBank): 01/01/24;11:03 TK: xxxx88661 PS:-40.000VND SD: 4.481.348VND ND: testing","when":"2024-01-01 11:03:28"}]',
      "length": 123,
      "name": "postData",
      "type": "application/json"
    },
    "contentLength": 123
  }

function try_parsing_a_notification() {
  const text = '(TPBank): 01/01/24;11:03 TK: xxxx88661 PS:-85.500VND SD: 4.481.348VND ND: testing'
  const parsed_info = parse_notification_tpbank(text)
  console.log(parsed_info)
  // expect: {amount: -86, message: "testing"}
}

function try_prepend_1_row() {
  prepend_default_rows(SpreadsheetApp.getActiveSheet(), 1)
}

function try_doPost() {
  const content_service_output = doPost(input_sample)
  console.log(content_service_output.getContent())
}


