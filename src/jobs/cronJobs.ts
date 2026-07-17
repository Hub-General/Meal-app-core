import { cleaningJobs } from "./cleaningJobs";
import weeklyScheduler from "./jobScheduler";
import cron from "node-cron"

export function startWeeklyCron(){
    cron.schedule("0 6 * * 6",async()=>{
        try{
            weeklyScheduler()
        }catch(error){
            console.log("Saturday Cron Job Failed")
        }
    })
}

export function startBiWeeklyCron(){
    cron.schedule("0 6 * * 3",async () => {
        try{
            cleaningJobs.cleanUpUserTokens()
            console.log("Wednesday Cron Job Completed")
        }catch(error){
            console.log("Wednesday Cron Job Failed")
        }
    })
}