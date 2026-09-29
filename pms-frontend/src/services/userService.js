import axios from "axios";


const API_URL = "http://localhost:8082/api/users";

export const register = async(user) =>{
    try{

        const response = await axios.post(`${API_URL}/register`, user);

        return response.data;
    }
    catch(error){
        throw new Error(
            error.response?.data?.message || "Registration failed"
        );
    }
};


export const login = async(credentials) =>{
    try{
        const response = await axios.post(`${API_URL}/login`, credentials);

        return response.data;
    }
    catch(error){
        throw new Error(
            error.response?.data?.message || "Invalid email or password"
        );
    }
}