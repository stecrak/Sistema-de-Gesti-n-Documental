// Variables de conexión a la base de datos MySQL
var server = "sql12.freemysqlhosting.net";
var dbName = "sql12717291";
var username = "sql12717291";
var password = "B4K5pzQ548";
var port = 3306;

// Función principal para devolver la página HTML
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Grupo de Programación');
}

// Función para obtener datos desde Google Sheets
function getSheetData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  var formattedData = [['Nombre del producto', 'Categoría', 'Ventas']].concat(data);

  return formattedData;
}

// Función para actualizar datos en Google Sheets
function updateSheetData(newData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange(lastRow + 1, 1, newData.length, 3);
  range.setValues(newData);

  generateChart(sheet); // Actualizar el gráfico después de actualizar los datos
}

// Función para importar datos desde un archivo CSV
function importDataFromCsv(csvData) {
  var csvString = csvData.contents;
  var csvDataParsed = Utilities.parseCsv(csvString);

  var newData = csvDataParsed.map(function(row) {
    return [row[0].trim(), row[1].trim(), parseInt(row[2].trim(), 10)];
  });

  updateSheetData(newData);
  return "Datos importados correctamente desde CSV.";
}

// Función para importar datos desde Google Sheets
function importDataFromSheets(url) {
  try {
    var ss = SpreadsheetApp.openByUrl(url);
    var sheet = ss.getSheetByName('Hoja 1');
    var dataRange = sheet.getDataRange();
    var data = dataRange.getValues();

    var headers = data[0];
    if (headers[0] === 'Nombre del producto' && headers[1] === 'Categoría' && headers[2] === 'Ventas') {
      data = data.slice(1);
    }

    var newData = data.map(function(row) {
      return [row[0], row[1], parseInt(row[2], 10)];
    });

    updateSheetData(newData); // Llamar a la función de actualización con los nuevos datos importados
    return "Datos importados correctamente desde Google Sheets.";
  } catch (error) {
    console.error("Error al importar datos desde Google Sheets:", error);
    throw new Error("No se pudieron importar los datos desde la URL proporcionada.");
  }
}

// Función para generar un gráfico de tipo pie en Google Sheets
function generateChart(sheet) {
  var chart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sheet.getRange('B2:C' + sheet.getLastRow()))
      .setPosition(5, 5, 0, 0)
      .build();

  sheet.insertChart(chart);
}

// Función para crear la conexión a la base de datos MySQL y crear la tabla si no existe
function createConnection() {
  var url = "jdbc:mysql://" + server + ":" + port + "/" + dbName;
  var conn = Jdbc.getConnection(url, username, password);

  try {
    var stmt = conn.createStatement();
    var sql = "CREATE TABLE IF NOT EXISTS Datos (Nombre_producto VARCHAR(100), Categoria VARCHAR(20), Ventas VARCHAR (5))";
    stmt.execute(sql);

    Logger.log("Tabla Datos creada exitosamente o ya existe.");
  } catch (e) {
    Logger.log('Error al crear la tabla Datos:', e);
  } finally {
    if (conn) conn.close();
  }
}

// Función para insertar datos en Google Sheets
function insertDataToSheet(nombre, categoria, ventas) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja 1');
  var newRow = [nombre, categoria, ventas];
  sheet.appendRow(newRow);

  return "Datos insertados correctamente en Google Sheets.";
}

// Función para insertar datos en la base de datos MySQL
function insertDataToDatabase(nombre, categoria, ventas) {
  var url = "jdbc:mysql://sql12.freemysqlhosting.net:3306/sql12717291";
  var user = "sql12717291";
  var password = "B4K5pzQ548";

  var conn = Jdbc.getConnection(url, user, password);
  var successMessage = "Datos insertados correctamente en la base de datos.";

  try {
    var stmt = conn.prepareStatement("INSERT INTO Datos (Nombre_producto, Categoria, Ventas) VALUES (?, ?, ?)");
    stmt.setString(1, nombre);
    stmt.setString(2, categoria);
    stmt.setString(3, ventas);
    stmt.execute();
  } catch (ex) {
    // Verificar si ya existe una entrada con el mismo nombre y categoría
    if (ex.message.indexOf('Duplicate entry') !== -1) {
      successMessage = "Los datos ya existen en la base de datos.";
    } else {
      successMessage = "Error al insertar datos en la base de datos: " + ex.message;
      Logger.log(ex.message);
    }
  } finally {
    if (conn) conn.close();
  }

  return successMessage;
}
