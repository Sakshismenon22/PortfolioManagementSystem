import axios from "axios";


const getAllThemes = ()=>{
   try{
    const response = axios.get(`http://localhost:8082/api/themes/get-all-themes`);

    return response.data;
   }catch(error){
    return error.data;
   }
}

const themes = await getAllThemes();

console.log(themes);