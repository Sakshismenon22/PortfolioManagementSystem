import axios from "axios";


export const register = async(user) =>{
    try{

        const response = await axios.post(`http://localhost:8082/api/users/register`, user);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}