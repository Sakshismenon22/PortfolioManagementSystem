import axios from "axios";


export const getAllThemes = async ()=>{
   try{
    const response = await axios.get(`http://localhost:8082/api/themes/get-all-themes`,"");

    return response.data;
   }catch(error){
    return error.data;
   }
}