# 🎓 College Attendance Calculator

🌐 **Live Website:**  
👉 https://attendance-frontend-ebon.vercel.app/

This is the **frontend part** of the College Attendance Calculator project.  
It is responsible for the user interface, dashboard, and all user interactions.

---

## 📌 About the Project

I built a full-stack attendance calculator where students can upload or paste their ERP attendance report.
The system calculates subject-wise and overall attendance automatically.
It also allows them to simulate future scenarios — like if they attend or miss upcoming classes — and instantly shows how their percentage will change.
Additionally, it tells them how many classes they need to attend to reach a target percentage like 75%, or how many they can safely miss.

Students can:
- Paste or upload attendance report
- View subject-wise attendance
- Check overall attendance
- Simulate attend/miss scenarios
- Plan target attendance
- Reset attendance data

The project supports **multiple users at the same time** using session-based logic.

---

## 🛠️ Tech Used

- HTML
- CSS
- Vanilla JavaScript
- Fetch API
- Hosted on **Vercel**

No frontend frameworks are used.

---

## 📂 Frontend Folder Structure

attendance-frontend/
- │
- ├── index.html # Upload / paste attendance page
- ├── dashboard.html # Attendance dashboard
- ├── style.css # Complete styling
- ├── script.js # All frontend logic & API calls
- ├── assets/ # Icons / images (if any)
- └── README.md


---

## 🔗 Backend Connection

The frontend connects to a separate backend server hosted on **Railway**.

All API calls are made using:

- /api/upload
- /api/attendance
- /api/aggregate
- /api/simulate/attend
- /api/simulate/miss
- /api/target/aggregate
- /api/reset

## 👥 Multi-User Support

- Each user gets a unique `sessionId`
- Stored in browser localStorage
- Sent with every API request
- No login or signup required

This ensures users do not see each other’s data.

---

## 👨‍💻 Developer

**Harshvardhan Singh Dhannawat**  
B.Tech – Information Technology (3rd Year)

LinkedIn profile is available in the website footer.

---

## 📝 Note

This frontend is part of a full-stack college project and is designed to be simple, fast, and easy to use for students.
