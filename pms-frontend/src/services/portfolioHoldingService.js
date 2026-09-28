import axios from "axios";

export const addHolding = async (holding)=>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio-holding/add-holding`,holding);

        return response.data;
        
    }catch(error){
        return error.data;

    }
}