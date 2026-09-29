

import axios from "axios";

const buyPortfolioHoldings = async(id) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/buy-portfolio-holdings/${id}`);

        console.log(response.data);

        return response.data;
    }
    catch(error){
        console.log(error);

        return error.response.data;
    }
}

const resp = await buyPortfolioHoldings(2);

console.log(resp);
