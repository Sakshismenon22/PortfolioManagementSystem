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

const resp = await getPortfolioDetails(1, 1);

// console.log(resp.data);