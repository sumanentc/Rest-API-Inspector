function loadTableData(item) {
  const table = document.getElementById("restAPIBody");
  let row = table.insertRow();
  let method = row.insertCell(0);
  method.innerHTML = item.method;
  let url = row.insertCell(1);
  url.innerHTML = item.url;
  let status = row.insertCell(2);
  status.innerHTML = item.status;
  let esTime = row.insertCell(3);
  esTime.innerHTML = msToTime(item.requestDuration);
  let download = row.insertCell(4);
  // Create and save JSON file
  let dlAnchorElem = saveJSON(item, "req.json");
  // Set the title and classnames of the link
  dlAnchorElem.title = "Download";
  dlAnchorElem.classList.add("fa", "fa-download");
  download.appendChild(dlAnchorElem);
}

function msToTime(ms) {
  let seconds = (ms / 1000).toFixed(3);
  let minutes = (ms / (1000 * 60)).toFixed(3);
  let hours = (ms / (1000 * 60 * 60)).toFixed(3);
  let days = (ms / (1000 * 60 * 60 * 24)).toFixed(3);
  if (seconds < 60) return seconds + " Sec";
  else if (minutes < 60) return minutes + " Min";
  else if (hours < 24) return hours + " Hrs";
  else return days + " Days";
}

/* function to save JSON to file from browser
 * adapted from http://bgrins.github.io/devtools-snippets/#console-save
 * @param {Object} data -- json object to save
 * @param {String} file -- file name to save to
 */
function saveJSON(data, filename) {
  if (!data) {
    console.error("No data");
    return;
  }

  if (!filename) filename = "req.json";

  if (typeof data === "object") {
    data = JSON.stringify(data, undefined, 4).replace(/\\/g, "");
  }

  var blob = new Blob([data], { type: "text/json" });
  // Create an object URL for the blob object
  const url = URL.createObjectURL(blob);

  // Create a new anchor element
  const a = document.createElement("a");

  a.href = url;
  a.download = filename || "download";

  const clickHandler = () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      this.removeEventListener("click", clickHandler);
    }, 150);
  };
  a.addEventListener("click", clickHandler, false);
  return a;
}

$(function () {
  $("#inspect").click(function () {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabArray) => {
      const tabKeyPrefix = "TAB-";
      let currentTabId = tabArray[0].id;
      let key = tabKeyPrefix + currentTabId;
      console.log("tabID :::::", key);
      chrome.storage.local.get([key], (result) => {
        let requests = result[key];
        if (requests) {
          const keys = Object.keys(requests);
          //console.log("obj contains " + keys.length + " keys: " + keys);
          keys.forEach((entry) => {
            //console.log(entry);
            let item = requests[entry];
            //console.log(item);
            if (item) {
              loadTableData(item);
            }
          });
        }
      });
    });
  });
});

$(function () {
  $("#restAPITable").colResizable({
    resizeMode: "overflow",
    liveDrag: true,
  });
  //var $rows = $("#restAPITable tr");
  $("#search").keyup(function () {
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    table = document.getElementById("restAPITable");
    tr = table.getElementsByTagName("tr");
    console.log(filter);
    console.log(tr);
    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[1];
      console.log(td);
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }

    /*
    var val = $.trim($(this).val()).replace(/ +/g, " ").toLowerCase();
    //console.log(val);
    console.log($rows);
    $rows
      .show()
      .filter(function () {
        var text = $(this).text().replace(/\s+/g, " ").toLowerCase();
        return !~text.indexOf(val);
      })
      .hide();
      */
  });
});
