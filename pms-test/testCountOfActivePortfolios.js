import axios from "axios";

const getCountOfActivePortfolios = async(userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/count-active/${userId}`);

        console.log(response.data);

        return response.data;
    }catch(error){
        return error.data;
    }
}

const response = await getCountOfActivePortfolios(1);

console.log(response);