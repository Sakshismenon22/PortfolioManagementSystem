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

export const createAndActivatePortfolio = async(portfolio) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio/create-and-activate-portfolio`, portfolio);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}


export const getAllPortfolioDetails = async() =>{
    try{
        const userId = localStorage.getItem("userId");
        const response = await axios.post(`http://localhost:8082/api/portfolio/get-all-portfolio`,{userId});

        return response.data;
    }
    catch(error){
        return error.data;
    }
}


