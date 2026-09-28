import axios from "axios";

const getCountOfPortfolios = async(userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/count-portfolio/${userId}`);

        console.log(response.data);
        console.log("Status:", response.status);

        return response.data;
    }
    catch(error){
       console.log("Request failed:", error.message);
    console.log("Status:", error.response?.status);
    console.log("Response data:", error.response?.data);
    throw error;
    }
}

const count = await getCountOfPortfolios(1);

console.log(count);