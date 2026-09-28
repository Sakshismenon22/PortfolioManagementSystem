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


export const getCountOfPortfolios = async(userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/count-portfolio/${userId}`);

        console.log(response.data);
       

        return response.data;
    }
    catch(error){
      return error.data;
    }
}

export const getCountOfActivePortfolios = async(userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/count-active/${userId}`);

        console.log(response.data);

        return response.data;
    }catch(error){
        return error.data;
    }
}


export const getTotalRemainingBalance = async(userId) => {
    try{

        const response = await axios.get(`http://localhost:8082/api/portfolio/remaining-total/${userId}`);

        console.log(response.data);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}