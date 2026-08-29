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
