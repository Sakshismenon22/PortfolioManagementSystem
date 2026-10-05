import axios from "axios";


export const getAllThemes = async (userId) => {
  const response = await axios.get("http://localhost:8082/api/themes/get-all-themes", {
    params: { userId },
  });
  return response.data;
};


export const createTheme = async(theme) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/themes/add-theme`, theme);
        
        return response.data;
    }
    catch(error){
    throw error;
    }
}

export const updateTheme = async (theme) => {
  const response = await axios.put("http://localhost:8082/api/themes/update-theme", theme);
  return response.data;
};
