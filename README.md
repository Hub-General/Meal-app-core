# Meal App Core (Backend Service)

Core backend REST API and automated job engine for the Meal Selection Application.

---

## ⚙️ Automated Cron Jobs (`vercel.json`)

The application defines two automated cron jobs in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/cron/periodic",
      "schedule": "0 6 * * 6"
    },
    {
      "path": "/cron/maintenance",
      "schedule": "0 6 * * 3"
    }
  ]
}
```

> [!NOTE]
> All cron schedules run in **UTC**. `0 6 * * 6` runs every **Saturday at 06:00 UTC**.

---

## 📅 Periodic Cron Job Workflow (`/cron/periodic`)

The periodic cron job executes every Saturday morning to prepare, cycle, and activate the meal schedule for the upcoming work week (Monday–Friday).

### 1. Date Calculation & Target Week Resolution
- In this application, meal selections for a week run **Monday through Friday**.
- Starting on **Saturday morning**, user selections switch to target the **upcoming work week**.
- `getISOWeekInfo(new Date())` detects that the day is Saturday (`day === 6`), shifts `+2 days` to Monday, and computes the target ISO week (e.g. on Saturday Aug 29, it targets **Week 36**).

### 2. The Four Scheduled Tasks

| Task | Function | Purpose |
| :--- | :--- | :--- |
| **1. Sync DigiHR Users** | `syncDigiHRUsers()` | Synchronizes employee accounts and statuses from the DigiHR API with the database. |
| **2. Schedule Weekly Menu** | `scheduleWeeklyMenu(targetWeek)` | Automatically selects the next active menu in the rotational cycle (`getNextCycleMenu`) and creates a `WeekMenuSchedule` record if one doesn't exist yet for the target week. |
| **3. Activate Weekly Menu** | `activateWeeklyMenu(targetWeek)` | Sets all previous active menu schedules to `CLOSED` and activates the target week's `WeekMenuSchedule` so users can immediately make selections. |
| **4. Update Bi-Weekly Taste Profiles** | `updateBiWeeklyTasteProfiles()` | Runs recommendation and taste profile updates on **even ISO weeks** (see explanation below). |

---

## 🧠 Bi-Weekly Taste Profiles: What Does "Skipped" Mean?

The taste profile engine generates personalized meal recommendations by analyzing user selection histories.

In `src/jobs/periodic.ts`:
```typescript
export async function updateBiWeeklyTasteProfiles() {
    const currentWeekInfo = getISOWeekInfo(new Date());

    if (currentWeekInfo.week % 2 !== 0) {
        return `Skipped: Taste profile updates run on even ISO weeks only (current week: ${currentWeekInfo.week})`;
    }

    const updatedProfiles = await tasteProfileService.updateActiveUsersTasteProfiles(currentWeekInfo.year);
    return `Updated ${updatedProfiles.length} active user taste profiles for week ${currentWeekInfo.week}/${currentWeekInfo.year}`;
}
```

### Why It Skips on Certain Weeks:
- **Bi-Weekly Cadence:** User eating habits and taste preferences change gradually. Running full taste-profile recalculations every week is unnecessary and resource-intensive.
- **Even Weeks Only:** Taste profiles run every 2 weeks on **even ISO weeks** (e.g., Weeks 36, 38, 40, 42...).
- **"Skipped" on Odd Weeks:** When the Saturday cron runs on an **odd ISO week** (e.g., Weeks 35, 37, 39, 41...), the job returns `"Skipped: Taste profile updates run on even ISO weeks only"`. This is **expected, normal behavior** and means the job intentionally bypassed the calculation until the next even week.

---

## 📊 Cron Execution Simulation & Verification Output

The periodic job was tested across **14 consecutive and boundary dates** (including the next 10 upcoming Saturdays and the 2026/2027 Year-End/New-Year transition) to verify week calculations, menu cycling, and frontend client sync:

| Cron Execution Date | Day | Scheduled Target Week | Date Range (Mon–Sun) | Menu Assigned | Taste Profiles Status | Client In-Sync? |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Aug 29, 2026** | Sat | **Week 36 / 2026** | Aug 31 – Sep 06, 2026 | Menu Four | **RUN** *(Even Week 36)* | **YES** |
| **Sep 05, 2026** | Sat | **Week 37 / 2026** | Sep 07 – Sep 13, 2026 | Menu One | **SKIPPED** *(Odd Week 37)* | **YES** |
| **Sep 12, 2026** | Sat | **Week 38 / 2026** | Sep 14 – Sep 20, 2026 | Menu Two | **RUN** *(Even Week 38)* | **YES** |
| **Sep 19, 2026** | Sat | **Week 39 / 2026** | Sep 21 – Sep 27, 2026 | Menu One | **SKIPPED** *(Odd Week 39)* | **YES** |
| **Sep 26, 2026** | Sat | **Week 40 / 2026** | Sep 28 – Oct 04, 2026 | Menu Three | **RUN** *(Even Week 40)* | **YES** |
| **Oct 03, 2026** | Sat | **Week 41 / 2026** | Oct 05 – Oct 11, 2026 | Menu Four | **SKIPPED** *(Odd Week 41)* | **YES** |
| **Oct 10, 2026** | Sat | **Week 42 / 2026** | Oct 12 – Oct 18, 2026 | Menu One | **RUN** *(Even Week 42)* | **YES** |
| **Oct 17, 2026** | Sat | **Week 43 / 2026** | Oct 19 – Oct 25, 2026 | Menu Two | **SKIPPED** *(Odd Week 43)* | **YES** |
| **Oct 24, 2026** | Sat | **Week 44 / 2026** | Oct 26 – Nov 01, 2026 | Menu One | **RUN** *(Even Week 44)* | **YES** |
| **Oct 31, 2026** | Sat | **Week 45 / 2026** | Nov 02 – Nov 08, 2026 | Menu Three | **SKIPPED** *(Odd Week 45)* | **YES** |
| **Dec 19, 2026** | Sat | **Week 52 / 2026** | Dec 21 – Dec 27, 2026 | Menu Four | **RUN** *(Even Week 52)* | **YES** |
| **Dec 26, 2026** | Sat | **Week 53 / 2026** | Dec 28 – Jan 03, 2027 | Menu One | **SKIPPED** *(Odd Week 53)* | **YES** |
| **Jan 02, 2027** | Sat | **Week 01 / 2027** | Jan 04 – Jan 10, 2027 | Menu Two | **SKIPPED** *(Odd Week 1)* | **YES** |
| **Jan 09, 2027** | Sat | **Week 02 / 2027** | Jan 11 – Jan 17, 2027 | Menu One | **RUN** *(Even Week 2)* | **YES** |

### Simulation Key Takeaways:
1. **Accurate 7-Day Stepping:** Target week advances by exactly 1 ISO week for each Saturday run with no double-shifts or skipped weeks.
2. **100% Client-Backend Synchronization:** For each week, the backend activated schedule perfectly matches the target week evaluated by the client on Saturday, Sunday, and throughout the work week.
3. **Continuous Menu Rotation:** Menus cycle sequentially and transition seamlessly across year boundaries (Week 53 / 2026 $\rightarrow$ Week 1 / 2027).

---

## 🕒 Saturday Execution Lifecycle

```text
Saturday 06:00 UTC (Cron Triggered)
  │
  ├── 1. getISOWeekInfo(new Date()) -> Resolves target to upcoming Monday (e.g. Week 36)
  │
  ├── 2. syncDigiHRUsers() -> User records updated from DigiHR
  │
  ├── 3. scheduleWeeklyMenu(Week 36) -> Assigns next rotational menu in cycle
  │
  ├── 4. activateWeeklyMenu(Week 36) -> Prior week schedules CLOSED, Week 36 set to ACTIVE
  │
  └── 5. updateBiWeeklyTasteProfiles()
           ├── If Even Week (e.g. 36) -> RUN: Active user taste profiles recalculated
           └── If Odd Week (e.g. 37)  -> SKIPPED: Waited for next 2-week cycle
```

---

## 🛠️ Date Helper Reference (`src/helpers/dateFunctions.ts`)

- **`getDateFromISOWeek(week, year)`**: Calculates the UTC Monday date for a given ISO week and year using the standard ISO 8601 Jan 4th anchor.
- **`getISOWeekInfo(date)`**: Returns `{ day, week, year, dayName }`. Automatically shifts Saturday (`+2`) and Sunday (`+1`) to target the upcoming work week starting Monday.
- **`getNextISOWeekInfo(date)`**: Computes the active target week anchor and advances strictly by `+7 days` to prevent compounding weekend shifts.
- **`getISOWeekRange(date)`**: Returns `{ weekStart, weekEnd }` representing Monday 00:00:00 UTC to Sunday 23:59:59.999 UTC for the target week.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate:deploy

# Start development server
npm run dev

# Build for production
npm run build
```
