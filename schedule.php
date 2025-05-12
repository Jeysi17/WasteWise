<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootswatch@4.5.2/dist/minty/bootstrap.min.css" integrity="sha384-H4X+4tKc7b8s4GoMrylmy2ssQYpDHoqzPa9aKXbDwPoPUA3Ra8PA5dGzijN+ePnH" crossorigin="anonymous">
    <link rel="stylesheet" href="styles.css">
    <title>Admin - Schedule</title>
</head>
<body>

<div class="header"> WasteWise Admin</div>

    <div id="sidebar" class="col-md-auto col-lg-2 d-md-block sidebar position-fixed">
        <button onclick="location.href='post.php'">POST</button>
        <button>SCHEDULES</button>
    </div>



    <div class="main">
    <div class="controls">
      <strong>ADD SCHEDULE</strong>
      <select id="barangaySelect">
        <option disabled selected>BRGY</option>
        <option>Aguado</option>
        <option>Cabezas</option>
        <option>Cabuco</option>
        <option>Conchu</option>
        <option>De Ocampo</option>
        <option>Gregorio</option>
        <option>Hugo Perez</option>
        <option>Inocencio</option>
        <option>Lallana</option>
        <option>Lapidario</option>
        <option>Luciano</option>
        <option>Osorio</option>
        <option>San Agustin</option>
      </select>
      <select id="zoneNumber">
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </select>
      <button class="confirm" onclick="addSchedule()">CONFIRM</button>
      <button class="cancel" onclick="clearFields()">CANCEL</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Date</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="scheduleTable">
      </tbody>
    </table>
  </div>

  <script>

    
    function addSchedule() {
      const barangay = document.getElementById("barangaySelect").value;
      const zoneNumber = document.getElementById("zoneNumber").value;
      if (barangay === "BRGY") return;
      const today = new Date().toISOString().split('T')[0];

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${barangay}</td>
        <td>${today}</td> 
        <td class="status">
          <span class="ongoing">Ongoing</span>
          <span class="done">DONE</span>
        </td>
        <td><button class="delete-btn" onclick="deleteRow(this)">Delete</button></td>
      `;

      document.getElementById("scheduleTable").appendChild(row);
    }

    function deleteRow(btn) {
      btn.closest("tr").remove();
    }

    function clearFields() {
      document.getElementById("barangaySelect").selectedIndex = 0;
      document.getElementById("zoneNumber").selectedIndex = 0;
    }
  </script>



</body> 
</html>