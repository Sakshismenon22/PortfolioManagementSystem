import axios from "axios";

export const createPortfolio = async(portfolio) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio/create-portfolio`, portfolio);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}


