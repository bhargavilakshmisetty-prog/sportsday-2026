# CHRYSALIS SCHOOL — SPORTS DAY STEMATHON 2026

Mobile-first student zone, seating, directions and arrival check-in system.

## Architecture

QR / Browser
→ GitHub Pages
→ Google Apps Script Web App
→ Google Sheet

The Google Sheet is never linked directly from the public website.

## Project files

- `index.html` — public student search/check-in page
- `style.css` — responsive UI
- `script.js` — public API integration and QR auto-search
- `admin.html` — token-protected attendance statistics
- `qr-generator.html` — token-protected printable QR-card generator
- `Code.gs` — Google Apps Script API
- `README.md` — setup and test instructions

---

# 1. Create the Google Sheet

Create a Google Sheet named:

`SportsDayStudents`

Create a sheet/tab with the following header row exactly:

```text
ID
Student Name
Class
Section
Phone
Parent Name
Zone
Seat
Row
Ground
Event
Reporting Time
Status
Check In Time
Directions
Notes
```

A sample row:

```text
102 | Ananya | 7 | A | 9876543210 | Parent Name | Green Zone | 16 | K | Ground A | 100m | 8:30 AM | Not Checked In | | Follow the Green Path Way |
```

### Important

Format the `ID` and `Phone` columns as **Plain text** in Google Sheets. This prevents leading zeroes from being lost and avoids number-format surprises.

---

# 2. Configure Google Apps Script

Open the Google Sheet.

Go to:

**Extensions → Apps Script**

Open the Apps Script editor and replace the default code with the contents of `Code.gs`.

In `Code.gs`, update:

```javascript
const CONFIG = {
  SPREADSHEET_ID: "YOUR_GOOGLE_SHEET_ID",
  SHEET_NAME: "SportsDayStudents",
  ADMIN_TOKEN: "CHANGE_THIS_TO_A_LONG_RANDOM_ADMIN_TOKEN",
  ...
};
```

### Spreadsheet ID

The Spreadsheet ID is the long value in the Google Sheet URL.

Example:

```text
https://docs.google.com/spreadsheets/d/ABC123XYZ456/edit
```

The Spreadsheet ID is:

```text
ABC123XYZ456
```

### Admin Token

Create a long random secret, for example a 30–50 character random value.

Do not use an easy password.

The token is required by:

- `admin.html`
- `qr-generator.html`
- `stats` API
- `listStudents` API

The public student page does **not** need the Admin Token.

---

# 3. Configure event information

In `Code.gs`, change:

```javascript
EVENT_INFO: {
  venue: "Configure venue in Code.gs",
  date: "Configure date in Code.gs",
  studentEntry: "Gate 1",
  parentEntry: "Gate 2",
  helpDesk: "Configure Help Desk number",
  firstAid: "Configure First Aid location",
  drinkingWater: "Configure Drinking Water location",
  washrooms: "Configure Washrooms location"
}
```

Example:

```javascript
EVENT_INFO: {
  venue: "Chrysalis High, Gunjur Campus",
  date: "27 September 2026",
  studentEntry: "Gate 1",
  parentEntry: "Gate 2",
  helpDesk: "+91 9000000000",
  firstAid: "Near Main Ground",
  drinkingWater: "Near Green Zone",
  washrooms: "Near Gate 2"
}
```

Use your actual event details.

---

# 4. Set Apps Script time zone

In Apps Script:

**Project Settings → Time zone**

Set it to:

`Asia/Kolkata`

This makes check-in timestamps use Indian time.

---

# 5. Deploy the API

In Apps Script:

**Deploy → New deployment**

Select:

**Web app**

Set:

- **Execute as:** Me
- **Who has access:** Anyone

Click **Deploy**.

Authorize the application if Google asks for permission.

Copy the Web App URL. It normally looks like:

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

---

# 6. Configure the GitHub Pages frontend

Open:

`script.js`

Change:

```javascript
const CONFIG = {
  API_URL: "YOUR_GOOGLE_APPS_SCRIPT_URL",
  SCHOOL_NAME: "CHRYSALIS SCHOOL",
  EVENT_NAME: "SPORTS DAY STEMATHON 2026"
};
```

to your actual Apps Script Web App URL.

Example:

```javascript
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/XXXXXXXXXXXX/exec",
  SCHOOL_NAME: "CHRYSALIS SCHOOL",
  EVENT_NAME: "SPORTS DAY STEMATHON 2026"
};
```

Also put the same API URL into:

- `admin.html`
- `qr-generator.html`

For both files, replace:

```text
YOUR_GOOGLE_APPS_SCRIPT_URL
```

with the same Web App URL.

---

# 7. Upload to GitHub

Repository:

`chrysalisschoolsportsday/Sportsday-2026`

Upload:

```text
index.html
style.css
script.js
admin.html
qr-generator.html
README.md
```

Do **not** upload:

- Google Sheet credentials
- service-account JSON
- private keys
- passwords
- Admin Token inside `script.js`

The Apps Script code is kept in Google Apps Script and is not required in the GitHub Pages repository.

---

# 8. Enable GitHub Pages

In the GitHub repository:

**Settings → Pages**

Choose:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

The public website should be:

```text
https://chrysalisschoolsportsday.github.io/Sportsday-2026/
```

---

# 9. QR URL

Every student QR code should contain:

```text
https://chrysalisschoolsportsday.github.io/Sportsday-2026/?id=STUDENT_ID
```

For ID 102:

```text
https://chrysalisschoolsportsday.github.io/Sportsday-2026/?id=102
```

When scanned:

1. GitHub Pages opens.
2. `script.js` reads `id=102`.
3. It automatically calls Apps Script.
4. Apps Script searches the Google Sheet.
5. Student 102 is returned.
6. Student information, zone, row, seat and directions appear.
7. No manual Search click is required.

The page also supports:

```text
?id=102
?studentId=102
?phone=9876543210
```

---

# 10. Search behaviour

The public page supports:

- Student ID
- Student Name
- Phone number

Search is case-insensitive.

Examples:

```text
102
Ananya
ananya
9876543210
```

If more than one student matches a name, the page displays a selection list.

---

# 11. Check-in behaviour

When the user taps:

**CONFIRM ARRIVAL**

the browser calls:

```text
?action=checkIn&id=102
```

Apps Script uses a Script Lock so simultaneous requests do not accidentally create duplicate check-ins.

It:

1. Finds the ID.
2. Checks the existing status.
3. If already checked in, returns the existing time.
4. Otherwise changes `Status` to `Checked In`.
5. Writes the current time into `Check In Time`.
6. Returns the confirmation to the browser.

A successful response resembles:

```json
{
  "success": true,
  "message": "Arrival confirmed",
  "checkInTime": "14/09/2026 08:30 PM"
}
```

---

# 12. Admin dashboard

Open:

```text
https://chrysalisschoolsportsday.github.io/Sportsday-2026/admin.html
```

Enter the Admin Token.

It displays:

- Total Students
- Checked In
- Pending

The dashboard calls the protected Apps Script `stats` action.

The public student page does not show these statistics.

## Security note

A static GitHub Pages file is public by nature. The dashboard therefore does not rely on hiding the HTML file itself; the sensitive data/API operation is protected by the Admin Token in Apps Script.

Keep the Admin Token private and change it immediately if it is disclosed.

For stronger enterprise-grade authentication, use Google Workspace / Firebase / another authenticated admin service rather than a shared token.

---

# 13. QR generator

Open:

```text
https://chrysalisschoolsportsday.github.io/Sportsday-2026/qr-generator.html
```

Enter:

- Admin Token
- GitHub Pages URL

Click:

**Load Students**

The tool retrieves student data through the protected Apps Script endpoint and generates printable QR cards.

Each card contains:

- CHRYSALIS SCHOOL
- SPORTS DAY STEMATHON 2026
- Student
- Roll No
- Class
- Zone
- Row and Seat
- QR Code

Click:

**Print A4 QR Cards**

Use normal browser print settings and select A4 paper.

---

# 14. API endpoints

### Find student

```text
?action=getStudent&query=102
```

or:

```text
?action=getStudent&id=102
```

or:

```text
?action=getStudent&phone=9876543210
```

### Check in

```text
?action=checkIn&id=102
```

### Admin statistics

```text
?action=stats&token=ADMIN_TOKEN
```

### Admin student list

```text
?action=listStudents&token=ADMIN_TOKEN
```

Do not publish the Admin Token.

---

# 15. Test cases

## Test 1 — ID

Search:

```text
102
```

Expected: Ananya is displayed.

## Test 2 — Name

Search:

```text
Ananya
```

Expected: Ananya is displayed.

## Test 3 — Lowercase name

Search:

```text
ananya
```

Expected: same result.

## Test 4 — Phone

Search:

```text
9876543210
```

Expected: matching student is displayed.

## Test 5 — QR

Open:

```text
https://chrysalisschoolsportsday.github.io/Sportsday-2026/?id=102
```

Expected: student automatically loads without pressing Search.

## Test 6 — Invalid ID

Search:

```text
999999
```

Expected:

**❌ Student Not Found**

## Test 7 — Invalid name

Search a name that does not exist.

Expected:

**❌ Student Not Found**

## Test 8 — Duplicate name

Put two students with the same name into the Sheet.

Search the name.

Expected: selection list appears.

## Test 9 — Check-in

Search ID 102 and tap:

**Confirm Arrival**

Expected:

- Status becomes `Checked In`
- Check In Time is populated
- Browser displays `✓ ARRIVAL CONFIRMED`

## Test 10 — Already checked in

Repeat the search.

Expected:

**✓ Already Checked In**

The original check-in time is displayed.

No new time is written.

## Test 11 — API unavailable

Temporarily use an invalid API URL.

Expected:

**⚠️ Unable to connect to Sports Day database.**

## Test 12 — Mobile

Test on:

- Android Chrome
- iPhone Safari

Confirm:

- no horizontal scrolling
- buttons fit inside the screen
- text wraps
- cards stay inside the page
- QR links open correctly

## Test 13 — 300 students

Load 300 records into the Google Sheet and test search and QR generation.

## Test 14 — simultaneous check-in

Open the same student on two devices and press Confirm Arrival at nearly the same time.

Expected: only one check-in timestamp is created.

---

# 16. Recommended Google Sheet setup

For reliability:

- Keep headers in row 1.
- Do not rename required headers.
- Do not merge cells.
- Keep ID unique.
- Keep phone values as text.
- Keep Status initially as `Not Checked In`.
- Leave Check In Time blank until arrival.
- Keep Zone values such as `Blue Zone`, `Red Zone`, `Green Zone`, `Yellow Zone`.

---

# 17. Final data flow

```text
QR Code
   ↓
GitHub Pages
   ↓
?id=102
   ↓
script.js
   ↓
Google Apps Script Web App
   ↓
SportsDayStudents Google Sheet
   ↓
Student 102
   ↓
Name / Zone / Row / Seat / Directions
   ↓
Confirm Arrival
   ↓
Google Apps Script
   ↓
Status = Checked In
Check In Time = Current Time
```

The public site never needs direct access to the Google Sheet.

---

# 18. Before going live

Replace every placeholder:

- `YOUR_GOOGLE_SHEET_ID`
- `CHANGE_THIS_TO_A_LONG_RANDOM_ADMIN_TOKEN`
- `YOUR_GOOGLE_APPS_SCRIPT_URL`
- venue
- event date
- Help Desk number
- First Aid location
- Drinking Water location
- Washroom location

Then test with real-looking sample records before uploading the complete student list.
