import axios from "axios";

const getTotalRemainingBalance = async(userId) => {
    try{

        const response = await axios.get(`http://localhost:8082/api/portfolio/remaining-total/${userId}`);

        console.log(response.data);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}

const resp = await getTotalRemainingBalance(1);

console.log(resp);