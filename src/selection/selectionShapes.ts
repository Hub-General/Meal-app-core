export const SafeUser = {
    id: true,
    email: true,
    name: true,
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