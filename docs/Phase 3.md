# Phase 3 Master Plan: The Regional Farm-to-Table Distribution
**Course:** Introduction to Database (IS211-SIS211) - Spring 2026
**Institution:** Cairo University - Faculty of Computers and Artificial Intelligence

---

## 1. PROJECT OVERVIEW & ALL REQUIRED DATA

### 1.1 System Description
A cooperative network connecting local farmers directly with restaurants to ensure the delivery of fresh, seasonal produce. 
* **Farms:** Registered with locations and specific crop specialties (e.g., root vegetables, leafy greens). Farmers list current "harvest batches" specifying crop type, harvest date, and available quantity.
* **Restaurants:** The primary buyers. They maintain profiles with delivery addresses and preferred delivery windows. They place orders by selecting specific harvest batches from various farms.
* **Logistics (Drivers & Trips):** A team of drivers uses refrigerated trucks to pick up orders from farms and deliver them to restaurants. Every delivery trip is logged with the driver's details, the route taken, and total distance traveled to ensure efficient transport.

### 1.2 Core Functionalities Required
The system backend must programmatically handle the following:
1. Managing profiles for local farms and their specialized crop types.
2. Listing available harvest batches and tracking seasonal inventory.
3. Processing restaurant orders and linking them to specific farm batches.
4. Coordinating delivery trips and assigning drivers to specific routes.
5. Monitoring the "freshness window" of batches from harvest to delivery.

### 1.3 The 6 Mandatory Analytical Inquiries (Complex Joins)
The application must feature queries that answer these specific business questions:
1. Which "crop type" had the maximum number of orders placed by restaurants?
2. Which farm had no harvest batches listed or sold during the last month?
3. Who was the driver who completed the highest number of delivery trips last month?
4. Identify restaurants that did not place any produce orders last month.
5. What were the specific harvest batches delivered to each restaurant last month?
6. For each farm, retrieve its name and the total revenue generated from its sold batches.

---

## 2. TECHNICAL REQUIREMENTS & HOW IT MUST BE DONE

### 2.1 Academic Constraints (Strict Rules)
* **Database:** Must be implemented on MS SQL Server.
* **Query Method:** You **ARE NOT ALLOWED to use an Object Relational Model (ORM)** (e.g., Prisma, Entity Framework, Sequelize). You MUST write raw SQL statements in the backend code.
* **Required Operations:** The application must execute *at least*:
  * 2 `INSERT` statements on 2 different tables.
  * 2 `DELETE` statements on 2 different tables (with `WHERE` conditions).
  * 2 `UPDATE` statements on 2 different tables (with `WHERE` conditions).
  * `SELECT` data from single tables.
  * `SELECT` data involving multiple tables using `JOIN`s (This is covered by the 6 inquiries).

### 2.2 Tech Stack Architecture (The Web GUI Approach)
To secure the "Implement GUI (bonus)" marks, the team will build a modern Web Application. 
* **Database Layer:** Hosted MS SQL Server.
* **Backend (API):** Python (Flask).
  * *How:* The backend will connect to MS SQL Server and execute **raw SQL queries** (no ORM) using a standard SQL Server driver (e.g., `pyodbc`), then return results as JSON to the frontend.
* **Frontend (GUI):** Vanilla HTML/CSS/JS.
  * *How:* A modern, clean dashboard interface. It will feature forms (to trigger Inserts/Updates/Deletes) and data tables (to display the results of the 6 complex `SELECT` inquiries).

### 2.3 Submission & Deliverable Rules
**Only ONE team member will upload the final Zip folder to Google Classroom.**
* **Folder Name Format:** `ProjectID-TA-Title-Phase 3` (e.g., `12-NourhanElKhodary-Regional Farm to Table-Phase 3`)
* **Folder Contents Must Include:**
  1. `Software Application Code` (Backend and Frontend source code folders).
  2. `Documentation PDF` (Phase 1 Requirements + Phase 2 Conceptual ERD + Phase 3 Physical ERD).
  3. `schema.sql` (The DDL file containing all `CREATE TABLE` and mock data `INSERT` scripts).

---

## 3. SIX-MEMBER TEAM TASK DIVISION

This project requires careful coordination. Here is the exact breakdown to ensure all 6 members have equal, distinct, and trackable workloads.

### Member 1: Database Designer (Physical ERD + DDL)
* **Task 1:** Design the Phase 3 Physical ERD (converting M:N relationships into bridge tables like `Order_Details`, adding precise data types and foreign keys).
* **Task 2:** Write the raw `schema.sql` DDL file, including all `CREATE TABLE` statements.
* **Task 3:** Review/approve the mock data plan to ensure the "last month" inquiries will return valid results and the dataset covers edge cases (e.g., farms with no batches).

### Member 2: Backend CRUD & Data Access Engineer
* **Task 1:** Write the API endpoints and raw SQL for the required basic operations:
  * Two `INSERT` endpoints (e.g., Add Harvest Batch, Register Driver).
  * Two `UPDATE` endpoints (e.g., Update Restaurant Delivery Window, Update Trip Route).
  * Two `DELETE` endpoints (e.g., Cancel Order, Remove Harvest Batch).
* **Task 2:** Implement the reusable backend “data access utilities” used by all endpoints (parameterized query execution helpers, consistent error handling/HTTP responses, and basic input validation) while still using raw SQL (no ORM).

### Member 3: Backend Analytics Engineer (Inquiries 1, 2, & 3)
* **Task 1:** Formulate and test the raw SQL `JOIN` queries for Inquiries 1, 2, and 3 directly against the database to guarantee mathematical accuracy.
* **Task 2:** Wrap these raw SQL queries into accessible backend API endpoints (e.g., `GET /api/reports/top-crop`).

### Member 4: Backend Analytics & Security Engineer (Inquiries 4, 5, & 6)
* **Task 1:** Formulate and test the raw SQL `JOIN` queries for Inquiries 4, 5, and 6 directly against the database.
* **Task 2:** Wrap these queries into accessible backend API endpoints (e.g., `GET /api/reports/farm-revenue`).
* **Task 3:** Assist Member 2 in ensuring all raw SQL strings in the backend are secure against basic SQL injection (using parameterized queries, even without an ORM).

### Member 5: Data Population & Documentation Engineer
* **Task 1:** Export the final Conceptual and Physical ERD diagrams and assemble/format the documentation PDF content (Phase 1 + Phase 2 + Phase 3).
* **Task 2:** Write the comprehensive mock data `INSERT INTO` statements in `schema.sql` (enough data to make all “last month” inquiries return results).
* **Task 3:** Implement the basic “lookup list” API endpoints (raw `SELECT` endpoints for Farms, Restaurants, Drivers, Crop Types, etc.) to power frontend dropdowns.

### Member 6: Full-Stack Lead & DevOps (Backend Foundation + Full Frontend + Deployment)
* **Task 1:** Set up the Flask backend foundation (project structure, environment setup, and MS SQL Server connection using raw SQL — no ORM).
* **Task 2:** Own the entire frontend (Vanilla HTML/CSS/JS): layout, CRUD forms, and all UI screens.
* **Task 3:** Build the "Reporting Dashboard" screens and connect tables to Member 3 & 4's analytical API endpoints.
* **Task 4:** Manage deployment/hosting. Package the backend and frontend (via Docker or manual VPS deployment) so the Web GUI is live for the TA presentation.
* **Task 5:** Assemble the final zipped folder according to the strict naming conventions, ensuring the documentation PDF, DDL file, and code are perfectly organized.

