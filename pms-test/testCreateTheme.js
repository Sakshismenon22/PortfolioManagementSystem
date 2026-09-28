
import axios from "axios";

const createTheme = async(theme) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/themes/add-theme`, theme);
        
        return response.data;
    }
    catch(error){
        return error.data;
    }
}

const resp = await createTheme(theme);

console.log(resp);