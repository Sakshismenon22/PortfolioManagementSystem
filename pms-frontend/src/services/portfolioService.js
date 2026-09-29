import axios from "axios";

export const createPortfolio = async(portfolio) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio/create-portfolio`, portfolio);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}

export const createAndActivatePortfolio = async(portfolio) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio/create-and-activate-portfolio`, portfolio);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}



export const getAllPortfolioDetails = async(userId) =>{
    try{
        
        const response = await axios.get(`http://localhost:8082/api/portfolio/all-portfolio-details`, 
            { params: { userId } },
    );

        console.log(response.data);

        return response.data;
    }
    catch(error){
        console.error("getAllPortfolioDetails failed:", error.response?.data ?? error);
        return error.response?.data ?? null;
    }
}




export const getCountOfPortfolios = async(userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/count-portfolio/${userId}`);

        console.log(response.data);
       

        return response.data;
    }
    catch(error){
      return error.data;
    }
}

export const getCountOfActivePortfolios = async(userId) =>{
    try{
        const response = await axios.get(`http://localhost:8082/api/portfolio/count-active/${userId}`);

        console.log(response.data);

        return response.data;
    }catch(error){
        return error.data;
    }
}


export const getTotalRemainingBalance = async(userId) => {
    try{

        const response = await axios.get(`http://localhost:8082/api/portfolio/remaining-total/${userId}`);

        console.log(response.data);

        return response.data;
    }
    catch(error){
        return error.data;
    }
}

export const getAllAssets = async() =>{
    try{
        const response = await axios.get(`security-master/api/assets/all-assets`);
        console.log(response);
        return response.data;
    }catch(e){
        return e.response;
    }
}




const API_URL = "http://localhost:8082/api/portfolio";

const getAuthConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export const getPortfolioBasicInfo = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `${API_URL}/basic-info/${portfolioId}/${userId}`,
  );
  console.log(response);
  return response.data.data;
};

export const getThemeAllocation = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `${API_URL}/theme-allocation/${portfolioId}/${userId}`,
  );

  return response.data.data;
};

export const getPortfolioHoldings = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `${API_URL}/holdings/${portfolioId}/${userId}`,
  );

  return response.data.data;
};

export const validatePortfolioAllocation = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `${API_URL}/allocation-validation/${portfolioId}/${userId}`,
  );

  return response.data.data;
};

