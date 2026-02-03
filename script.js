// ===== Session Handling =====
let sessionId = localStorage.getItem("attendance_session");

let originalAggregate = null;
let simulatedAggregate = null;

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("attendance_session", sessionId);
}

// const API = "http://localhost:5000/api";
const API = "https://attendance-backend-production-8499.up.railway.app/api";

// async function submitData() {
//   const pastedText = document.getElementById("pasteBox").value;
//   const file = document.getElementById("file").files[0];

//   if (!pastedText && !file) {
//     alert("Paste ERP report or upload file");
//     return;
//   }

//   const formData = new FormData();

//   if (pastedText) {
//     formData.append("text", pastedText);
//   } else {
//     formData.append("file", file);
//   }

//   // await fetch(API + "/upload", {
//   //   method: "POST",
//   //   body: formData,
//   // });

//   formData.append("sessionId", sessionId);
//   await fetch(API + "/upload", {
//     method: "POST",
//     body: formData
//   });

//   window.location.href = "dashboard.html";
// }

async function submitData() {
  const pastedText = document.getElementById("pasteBox").value;
  const file = document.getElementById("file").files[0];

  if (!pastedText && !file) {
    alert("Paste ERP report or upload file");
    return;
  }

  // 🔥 SHOW LOADER
  document.getElementById("loader").classList.remove("hidden");

  // Disable button to prevent double click
  const btn = document.querySelector(".primary-btn");
  btn.disabled = true;
  btn.innerText = "Processing...";

  const formData = new FormData();

  if (pastedText) {
    formData.append("text", pastedText);
  } else {
    formData.append("file", file);
  }

  formData.append("sessionId", sessionId);

  try {
    await fetch(API + "/upload", {
      method: "POST",
      body: formData,
    });

    // Redirect after successful upload
    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Something went wrong. Please try again.");

    // Restore UI if error
    document.getElementById("loader").classList.add("hidden");
    btn.disabled = false;
    btn.innerText = "Process Attendance";
  }
}

async function load() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  // fetch attendance
  // const res = await fetch(API + "/attendance");
  const res = await fetch(`${API}/attendance?sessionId=${sessionId}`);
  const data = await res.json();

  // risk priority (frontend enforced)
  const priority = { RED: 1, YELLOW: 2, GREEN: 3 };
  data.sort((a, b) => {
    if (priority[a.riskLevel] !== priority[b.riskLevel]) {
      return priority[a.riskLevel] - priority[b.riskLevel];
    }
    return a.percentage - b.percentage;
  });

  // // safe miss map
  // let safeMissMap = {};
  // try {
  //   const smRes = await fetch(API + "/attendance/safe-miss");
  //   const smData = await smRes.json();
  //   smData.forEach(s => safeMissMap[s._id] = s.safeMiss);
  // } catch {}

  data.forEach((d) => {
    const row = document.createElement("tr");
    row.dataset.id = d._id;

    row.classList.add(
      d.percentage < 65 ? "red" : d.percentage < 75 ? "yellow" : "green",
    );

    row.innerHTML = `
      <td data-label="Subject">${d.subjectName}</td>
      <td data-label="%">${d.percentage}%</td>
      <td data-label="Attended">${d.attended}</td>
      <td data-label="Absent">${d.total - d.attended}</td>
      <td data-label="Total">${d.total}</td>
      <td data-label="Safe Miss">
        ${calculateSafeMiss(d.attended, d.total)}
        <span class="safe-miss-note">classes</span>
      </td>

      <td data-label="Simulator" class="action-cell">
        <button class="action-btn attend-btn" data-id="${d._id}">Attend</button>
        <button class="action-btn miss-btn" data-id="${d._id}">Miss</button>

      </td>
      <td data-label="Target" class="target-cell">
        <div class="target-input-small">
          <input type="number" id="target-${d._id}" placeholder="%" />
          <button class="calc-btn" onclick="calculateTarget('${d._id}')">Calc</button>
        </div>
        <div class="target-result" id="result-${d._id}"></div>
      </td>
    `;

    tbody.appendChild(row);
    row.querySelector(".attend-btn").addEventListener("click", () => {
      simulateAttend(d._id);
    });

    row.querySelector(".miss-btn").addEventListener("click", () => {
      simulateMiss(d._id);
    });
  });

  await loadAggregate();
}

function calculateSafeMiss(attended, total) {
  const min = 75;
  let m = Math.floor((100 * attended - min * total) / min);
  return m < 0 ? 0 : m;
}

// async function simulateAttend(id) {
//   const res = await fetch(API + "/simulate/attend", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId }),
//   });

//   const updated = await res.json();
//   updateRow(updated);
//   await loadAggregate();
// }

// async function simulateAttend(id) {
//   await fetch(API + "/simulate/attend", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId, subjectId: id }),
//   });

//   // 🔥 SINGLE SOURCE OF TRUTH
//   const data = await res.json();

//   updateSubjectRow(data.subject);
//   updateAggregateUI(data.aggregate);
// }
async function simulateAttend(id) {
  const res = await fetch(API + "/simulate/attend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, subjectId: id }),
  });

  if (!res.ok) {
    console.error("Simulate attend failed");
    return;
  }

  const data = await res.json();

  updateSubjectRow(data.subject);
  updateAggregateUI(data.aggregate);
}

// async function simulateMiss(id) {
//   const res = await fetch(API + "/simulate/miss", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId }),
//   });

//   const updated = await res.json();
//   updateRow(updated);
//   await loadAggregate();
// }

// async function simulateMiss(id) {
//   await fetch(API + "/simulate/miss", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId, subjectId: id }),
//   });

//   // 🔥 RELOAD FROM DB
//   const data = await res.json();

//   updateSubjectRow(data.subject);
//   updateAggregateUI(data.aggregate);
// }

async function simulateMiss(id) {
  const res = await fetch(API + "/simulate/miss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, subjectId: id }),
  });

  if (!res.ok) {
    console.error("Simulate miss failed");
    return;
  }

  const data = await res.json();

  updateSubjectRow(data.subject);
  updateAggregateUI(data.aggregate);
}

// async function loadAggregate() {
//   // const res = await fetch(API + "/attendance/aggregate");
//   const res = await fetch(`${API}/aggregate?sessionId=${sessionId}`);
//   const agg = await res.json();

//   // Fill values
//   // document.getElementById("aggAttended").innerText = agg.totalAttended;
//   // document.getElementById("aggTotal").innerText = agg.totalClasses;
//   document.getElementById("aggAttended").innerText = agg.attended;
//   document.getElementById("aggTotal").innerText = agg.total;
//   document.getElementById("aggPercent").innerText = agg.percentage;

//   // Reset classes
//   const section = document.querySelector(".aggregate-section");
//   const circle = document.getElementById("aggCircle");

//   section.className = "aggregate-section";
//   circle.className = "circle";

//   // Apply color by risk
//   if (agg.riskLevel === "GREEN") {
//     section.classList.add("agg-green");
//     circle.classList.add("green");
//   } else if (agg.riskLevel === "YELLOW") {
//     section.classList.add("agg-yellow");
//     circle.classList.add("yellow");
//   } else {
//     section.classList.add("agg-red");
//     circle.classList.add("red");
//   }
// }

// async function calculateAggregateTarget() {
//   const target = Number(document.getElementById("aggTarget").value);

//   if (!target) {
//     alert("Enter target percentage");
//     return;
//   }

//   const res = await fetch(API + "/target/aggregate", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ target, sessionId }),
//   });

//   const data = await res.json();
//   const box = document.getElementById("aggTargetResult");

//   if (data.type === "invalid") {
//     box.innerText = "Not achievable";
//     box.style.color = "red";
//   } else if (data.type === "attend") {
//     box.innerText = `Attend ${data.value} more classes to reach ${target}%`;
//     box.style.color = "blue";
//   } else if (data.type === "miss") {
//     box.innerText = `You can safely miss ${data.value} classes and maintain ${target}%`;
//     box.style.color = "green";
//   }
// }

async function loadAggregate() {
  const res = await fetch(`${API}/aggregate?sessionId=${sessionId}`);
  const agg = await res.json();

  // store original only once
  originalAggregate = {
    attended: agg.attended,
    total: agg.total,
    percentage: agg.percentage,
    riskLevel: agg.riskLevel,
  };

  // initialize simulated state
  simulatedAggregate = { ...originalAggregate };

  updateAggregateUI(simulatedAggregate);
}

async function calculateAggregateTarget() {
  const target = Number(document.getElementById("aggTarget").value);
  if (!target) {
    alert("Enter target percentage");
    return;
  }

  const res = await fetch(API + "/target/aggregate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, sessionId }),
  });

  const data = await res.json();
  const box = document.getElementById("aggTargetResult");

  if (data.type === "invalid") {
    box.innerText = "Not achievable";
    box.style.color = "red";
  } else if (data.type === "attend") {
    box.innerText = `Attend ${data.value} more classes to reach ${target}%`;
    box.style.color = "blue";
  } else if (data.type === "miss") {
    box.innerText = `You can safely miss ${data.value} classes and maintain ${target}%`;
    box.style.color = "green";
  }
}

// async function resetAttendance() {
//   const confirmReset = confirm(
//     "This will reset attendance to the originally uploaded data. Continue?"
//   );

//   if (!confirmReset) return;

//   await fetch(API + "/attendance/reset", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ sessionId }),
//   });

//   await load();
// }

// function updateRow(d) {
//   const rows = document.querySelectorAll("#tableBody tr");

//   rows.forEach(row => {
//     if (row.dataset.id === d._id) {

//       row.children[1].innerText = `${d.percentage}%`;
//       row.children[2].innerText = d.attended;
//       row.children[3].innerText = d.total - d.attended;
//       row.children[4].innerText = d.total;

//       // const min = 75;
//       // let m = Math.floor((100 * d.attended - min * d.total) / min);
//       // if (m < 0) m = 0;
//       // row.children[5].innerText = m;

//       row.children[5].innerText = calculateSafeMiss(d.attended, d.total);

//       row.classList.remove("red", "yellow", "green");
//       row.classList.add(
//         d.percentage < 65 ? "red" :
//         d.percentage < 75 ? "yellow" :
//         "green"
//       );
//     }
//   });
// }

// async function updateAggregateOnly() {
//   // const res = await fetch(API + "/attendance/aggregate");
//   const res = await fetch(API + "/aggregate");
//   const agg = await res.json();

//   document.getElementById("aggAttended").innerText = agg.totalAttended;
//   document.getElementById("aggTotal").innerText = agg.totalClasses;
//   document.getElementById("aggPercent").innerText = agg.percentage;

//   const section = document.querySelector(".aggregate-section");
//   const circle = document.getElementById("aggCircle");

//   section.className = "aggregate-section";
//   circle.className = "circle";

//   if (agg.riskLevel === "GREEN") {
//     section.classList.add("agg-green");
//     circle.classList.add("green");
//   } else if (agg.riskLevel === "YELLOW") {
//     section.classList.add("agg-yellow");
//     circle.classList.add("yellow");
//   } else {
//     section.classList.add("agg-red");
//     circle.classList.add("red");
//   }
// }

async function resetAttendance() {
  const confirmReset = confirm(
    "This will reset attendance to the originally uploaded data. Continue?",
  );

  if (!confirmReset) return;

  await fetch(API + "/attendance/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  // 🔥 Restore frontend simulation state
  simulatedAggregate = { ...originalAggregate };
  updateAggregateUI(simulatedAggregate);

  await load();
}

function calculateTarget(id) {
  const input = document.getElementById(`target-${id}`);
  const resultBox = document.getElementById(`result-${id}`);

  if (!input || !resultBox) return;

  const target = Number(input.value);
  if (!target || target <= 0) {
    resultBox.innerText = "Enter valid %";
    return;
  }

  if (target >= 100) {
    resultBox.innerText = "Not achievable";
    return;
  }

  // get current row values
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;

  const attended = Number(row.children[2].innerText);
  const total = Number(row.children[4].innerText);

  const currentPercent = (attended / total) * 100;

  // 🎯 CASE 1: Need to ATTEND more classes
  if (target > currentPercent) {
    const k = Math.ceil((target * total - 100 * attended) / (100 - target));

    resultBox.innerText = k <= 0 ? "Already safe" : `Attend ${k} more classes`;
    return;
  }

  // 🎯 CASE 2: Can MISS classes safely
  if (target < currentPercent) {
    let m = Math.floor((100 * attended - target * total) / target);
    if (m < 0) m = 0;

    resultBox.innerText =
      m === 0 ? "Do not miss further" : `Can miss ${m} classes`;
    return;
  }

  // 🎯 CASE 3: Exactly at target
  resultBox.innerText = "Exactly at target";
}

function updateSubjectRow(d) {
  const row = document.querySelector(`tr[data-id="${d._id}"]`);
  if (!row) return;

  row.children[1].innerText = `${d.percentage}%`;
  row.children[2].innerText = d.attended;
  row.children[3].innerText = d.total - d.attended;
  row.children[4].innerText = d.total;
  row.children[5].innerText = calculateSafeMiss(d.attended, d.total);

  row.className = "";
  row.classList.add(
    d.percentage < 65 ? "red" : d.percentage < 75 ? "yellow" : "green",
  );
}

// function updateAggregateUI(agg) {
//   document.getElementById("aggAttended").innerText = agg.attended;
//   document.getElementById("aggTotal").innerText = agg.total;
//   document.getElementById("aggPercent").innerText = agg.percentage;

//   const section = document.querySelector(".aggregate-section");
//   const circle = document.getElementById("aggCircle");

//   section.className = "aggregate-section";
//   circle.className = "circle";

//   if (agg.riskLevel === "GREEN") {
//     section.classList.add("agg-green");
//     circle.classList.add("green");
//   } else if (agg.riskLevel === "YELLOW") {
//     section.classList.add("agg-yellow");
//     circle.classList.add("yellow");
//   } else {
//     section.classList.add("agg-red");
//     circle.classList.add("red");
//   }
//   updateMaintain75(agg);
// }

function updateAggregateUI(agg) {
  document.getElementById("aggAttended").innerText = agg.attended;
  document.getElementById("aggTotal").innerText = agg.total;
  document.getElementById("aggPercent").innerText = agg.percentage;

  const section = document.querySelector(".aggregate-section");
  const circle = document.getElementById("aggCircle");

  section.className = "aggregate-section";
  circle.className = "circle";

  if (agg.percentage < 65) {
    section.classList.add("agg-red");
    circle.classList.add("red");
  } else if (agg.percentage < 75) {
    section.classList.add("agg-yellow");
    circle.classList.add("yellow");
  } else {
    section.classList.add("agg-green");
    circle.classList.add("green");
  }

  // 🔥 NOW IT WILL WORK
  updateMaintain75(agg);
}

// function updateMaintain75(agg) {
//   const A = agg.attended;
//   const T = agg.total;
//   const target = 75;

//   const box = document.getElementById("maintainText");
//   if (!box) return; // prevents silent failure
//   if (T === 0) {
//     box.innerText = "No attendance data";
//     return;
//   }

//   const current = (A / T) * 100;

//   if (current < target) {
//     const need = Math.ceil((target * T - 100 * A) / (100 - target));
//     box.innerText = `Attend ${need} more classes to maintain 75%`;
//   } else {
//     let canMiss = Math.floor((100 * A - target * T) / target);
//     if (canMiss < 0) canMiss = 0;
//     box.innerText = `You can safely miss ${canMiss} classes`;
//   }
// }

// function calculateWhatIf() {
//   const x = Number(document.getElementById("whatIfCount").value);
//   const type = document.getElementById("whatIfType").value;
//   const result = document.getElementById("whatIfResult");

//   if (!x || x <= 0) {
//     result.innerText = "Enter valid number of classes";
//     return;
//   }

//   const A = Number(document.getElementById("aggAttended").innerText);
//   const T = Number(document.getElementById("aggTotal").innerText);

//   let newA = A;
//   let newT = T + x;

//   if (type === "attend") {
//     newA += x;
//   }

//   const percent = ((newA / newT) * 100).toFixed(2);

//   result.innerText = `Resulting Attendance: ${percent}%`;
// }

function updateMaintain75(agg) {
  console.log("Maintain 75 called", agg);
  const box = document.getElementById("maintainText");
  if (!box) return;

  const A = agg.attended;
  const T = agg.total;
  const target = 75;

  if (T === 0) {
    box.innerText = "--";
    return;
  }

  const current = (A / T) * 100;

  if (current < target) {
    const need = Math.ceil((target * T - 100 * A) / (100 - target));
    box.innerText = `Attend ${need} more classes to maintain 75%`;
  } else {
    const canMiss = Math.floor((100 * A - target * T) / target);
    box.innerText = `You can safely miss ${canMiss} classes`;
  }
}

// function calculateWhatIf() {
//   const x = Number(document.getElementById("whatIfCount").value);
//   const type = document.getElementById("whatIfType").value;
//   const result = document.getElementById("whatIfResult");

//   if (!x || x <= 0) {
//     result.innerText = "Enter valid number of classes";
//     return;
//   }

//   const A = Number(document.getElementById("aggAttended").innerText);
//   const T = Number(document.getElementById("aggTotal").innerText);

//   let newA = A;
//   let newT = T + x;

//   if (type === "attend") newA += x;

//   const percent = ((newA / newT) * 100).toFixed(2);

//   result.innerText = `Resulting Attendance: ${percent}%`;
//   result.style.color = percent >= 75 ? "#166534" : "#dc2626";
// }

function calculateWhatIf() {
  const x = Number(document.getElementById("whatIfCount").value);
  const type = document.getElementById("whatIfType").value;

  if (!x || x <= 0) return;

  if (!simulatedAggregate) return;

  if (type === "attend") {
    simulatedAggregate.attended += x;
    simulatedAggregate.total += x;
  } else {
    simulatedAggregate.total += x;
  }

  simulatedAggregate.percentage = Number(
    ((simulatedAggregate.attended / simulatedAggregate.total) * 100).toFixed(2),
  );

  updateAggregateUI(simulatedAggregate);
}
