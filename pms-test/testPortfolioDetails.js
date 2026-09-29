import axios from "axios";

const getPortfolioDetails = async(id, userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/portfolio-details/${id}/${userId}`);

        console.log(response.data);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}

// const resp = await getPortfolioDetails(1, 1);

// console.log(resp.data);

// const getAllPortfolioDetailsDTO = {
//     userId : 1,
// }

const getAllPortfolioDetails = async(userId) =>{

    try{

        const getAllPortfolioDetailsDTO = { userId };

        const response = await axios.get(`http://localhost:8082/api/portfolio/all-portfolio-details`, {
            data: getAllPortfolioDetailsDTO
    });

        console.log(response.data);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}

const getInvestmentDetails = async(userId) =>{
    try{
        const response = await axios(`http://localhost:8082/api/portfolio/investment-amount/${userId}`);

        console.log(response.data);

        return response.data;
    }catch(e){
        return e.data;
    }
}
const resp = await getInvestmentDetails(2);

console.log(resp.data);