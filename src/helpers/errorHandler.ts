export default function errorHandler (err : any){
    console.error(err);
    return {
        error: err.message || "An unexpected error occurred"
    }
}