# Flux | Expense Tracker

A minimal, full-stack expense tracking application built with React, Express, and SQLite.

## Setup and Running

**1. Backend API**
```bash
cd backend
npm install
npm run dev
```
*The API will be available at `http://localhost:3001`*

**2. Frontend UI**
```bash
cd frontend
npm install
npm start
```
*The application will open at `http://localhost:3000`*

---

## Persistence Mechanism

For this assignment, I chose to use an **embedded SQLite** database (using `sql.js` writing to a local file in `backend/data/`). 

**Why I made this choice:**
I wanted to provide a proper relational database structure that handles SQL querying, indexes, and constraints natively, just like a production application would. However, I didn't want to force the reviewer to install and configure a PostgreSQL or MySQL server just to test the app. SQLite provides the perfect middle ground—it behaves like a real database while remaining completely self-contained and zero-setup. It is also significantly safer and more robust against race conditions than reading/writing to a plain JSON file.

---

## Key Design Decisions

1. **Handling Unreliable Networks (Idempotency)**: To meet the requirement of handling multiple clicks, network retries, and page reloads safely, I implemented an `Idempotency-Key` system. The frontend generates a unique key and stores it in `sessionStorage` (so it survives page refreshes). The backend checks this key before inserting data. This guarantees that even if the user aggressively clicks the submit button or refreshes mid-request, an expense is never duplicated.
2. **Money Handling**: Floating-point math in JavaScript can lead to severe rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). To prevent this, I convert all incoming currency to an integer representation (paise/cents) before storing it in the database. It is only converted back to a decimal when sent to the frontend for display.
3. **Backend Filtering & Sorting**: Instead of sending the entire database to the frontend and filtering it in the browser, I implemented the filtering and sorting directly via SQL queries (`WHERE` and `ORDER BY`). I designed this specifically to mimic how a real, scalable production application would handle large datasets.
4. **Uncontrolled Form Components**: In the React frontend, I utilized `useRef` (uncontrolled components) for the forms rather than standard state binding. This is a deliberate choice for scalability—it prevents React from triggering a full re-render on every single keystroke.
5. **Strict Date Validation**: I intentionally removed any default dates from the form. The user is forced to actively select a date, and the API has strict regex validation to ensure the date format is correct.

---

## Trade-offs Made Due to Timebox

Because of the limited timebox for this assignment, I had to make a few practical trade-offs:
1. **Synchronous File Writes**: My `sql.js` implementation currently writes the entire database buffer to disk synchronously on every insert and deletion. While perfectly fine for a prototype, a high-traffic production system would need an asynchronous disk-engine (like `better-sqlite3`) or a hosted database to avoid blocking the Node.js event loop.
2. **Lack of Migration System**: I simply use `CREATE TABLE IF NOT EXISTS` when the server starts. In a real-world application, I would implement a proper schema migration tool (like Knex or Prisma) to track database versions.
3. **Automated Testing**: While the core logic is highly robust, I skipped writing extensive end-to-end (E2E) testing suites like Cypress or Playwright to prioritize delivering a highly polished and completely functional core application.

---

## Extra Features Included

While the assignment only specifically requested recording and reviewing expenses, I also implemented:
* **Month-Wise Categorization**: By default, the application now filters expenses to only show the *current month*, with options to view the "Previous Month" or "All Time" via a dropdown. My thought process here is that users generally want to record and review their current or recent monthly spending at a glance, rather than being overwhelmed by their complete historical data every time they open the app.
* **Delete Operations**: I added the ability to delete expenses. My thought process here is that users inevitably make mistakes when entering financial data. Giving them the ability to instantly remove an incorrect entry ensures the tool remains practical and accurate for real-world usage.
* **Fixed Monthly Budget & Progress Bar**: As part of the "review" process, I felt users needed contextual awareness of their spending. I added a fixed Monthly Budget feature that calculates a progress bar strictly based on the *current month's* expenses (regardless of what filter the user is viewing). The dynamic progress bar turns red when the fixed limit is exceeded.
* **CSV Data Export**: Since users might want to analyze their financial data elsewhere (Excel, Sheets, etc.), I added an "Export CSV" button that generates a downloadable `.csv` file of the currently filtered expenses natively in the browser.

---

## Intentionally Not Done

* **User Authentication/Login**: I skipped adding a login or multi-user system to keep the focus strictly on the core "record and review" user story requested in the brief.
* **Pagination**: I currently return the entire filtered list at once. Since this is a small personal tool for the exercise, pagination was omitted. If the dataset grew to thousands of rows, cursor-based pagination would be added.
* **Edit Operations**: I intentionally left out updating/editing existing records. To fix a mistake, users can simply use the included Delete feature and re-record the expense. This keeps the backend surface area small and tightly aligned with the acceptance criteria.
* **Complex Date Filtering (Yearly/12-Month Views)**: While I included standard monthly views, I intentionally avoided adding complex 12-month calendar pickers or year-to-date categorizations. Adding too many options would clutter the interface and confuse users, which goes against the core goal of providing a fast and simple expense tracker.
