export function GetEmploymentStatus (status: string){
    switch(status.toUpperCase()){
        case("ACTIVE"):
            return "ACTIVE"
        case("RETIRED"):
            return "RETIRED"
        default:
            return "INACTIVE"
    }
} 