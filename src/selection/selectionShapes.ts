export const SafeUser = {
    id: true,
    email: true,
    referenceEmail: true,
    status: true,
    roleId: true,
    referenceId: true,
    role: {
        select:{
            name : true
        }
    }
}