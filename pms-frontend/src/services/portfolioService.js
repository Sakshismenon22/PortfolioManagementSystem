import axios from "axios";

export const createPortfolio = async(portfolio) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio/create-portfolio`, portfolio);

        return response.data;
    }
    catch(error){
        return error.response?.data || { success: false, message: error.message || "Portfolio creation failed." };
    }
}

export const createAndActivatePortfolio = async(portfolio) =>{
    try{
        const response = await axios.post(`http://localhost:8082/api/portfolio/create-and-activate-portfolio`, portfolio);

        return response.data;
    }
    catch(error){
        return error.response?.data || { success: false, message: error.message || "Portfolio creation failed." };
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

export const createDemoPortfolios = async (userId) => {
  const response = await axios.post(`${API_URL}/demo-portfolios/${userId}`);
  return response.data;
};

export const deleteDemoPortfolios = async (userId) => {
  const response = await axios.delete(`${API_URL}/demo-portfolios/${userId}`);
  return response.data;
};

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
  console.log("Printing theme Allocation: "+response.data.data);

  return response.data.data;
};

export const getPortfolioHoldings = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `${API_URL}/holdings/${portfolioId}/${userId}`,
  );
  const holdings = response.data.data;
  if (!Array.isArray(holdings)) return holdings;

  return Promise.all(holdings.map(async (holding) => {
    if (String(holding.securityType || "").toUpperCase() !== "BOND") return holding;
    try {
      const priceResponse = await axios.get(
        `http://localhost:8082/api/security/bond-return-price/${holding.securityId}`,
        { params: { purchaseDate: holding.firstBuyDate || undefined } },
      );
      const bondReturnPrice = priceResponse.data?.data;
      const price = Number(bondReturnPrice?.currentReturnPrice);
      const quantity = Number(holding.quantity || 0);
      if (!(price > 0) || !(quantity > 0)) return holding;
      return {
        ...holding,
        currentPrice: price,
        currentValue: price * quantity,
        bondReturnPrice: {
          ...bondReturnPrice,
          tradePrice: Number(bondReturnPrice.tradePrice) || Number(holding.averageCost) || 0,
        },
      };
    } catch (error) {
      console.warn(`Bond return valuation unavailable for security ${holding.securityId}.`, error);
      return holding;
    }
  }));
};

export const validatePortfolioAllocation = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `${API_URL}/allocation-validation/${portfolioId}/${userId}`,
  );

  return response.data.data;
};

export const buyPortfolioSecurity = async ({ portfolioId, securityId, quantity }) => {
  const response = await axios.post("http://localhost:8082/api/portfolio-holding/buy", {
    portfolioId,
    securityId,
    quantity,
  });
  return response.data;
};

export const buyPortfolioSecurities = async (orders) => {
  const response = await axios.post("http://localhost:8082/api/portfolio-holding/buy-batch", orders);
  return response.data;
};

export const addInitialPortfolioHoldings = async ({ portfolioId, orders }) => {
  const response = await axios.post(
    `http://localhost:8082/api/portfolio/add-holdings/${portfolioId}`,
    orders,
  );
  return response.data;
};

export const activatePortfolio = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.post(
    `http://localhost:8082/api/portfolio/activate/${portfolioId}/${userId}`,
  );
  return response.data;
};

export const getPortfolioTransactions = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(
    `http://localhost:8082/api/portfolio-holding/transactions/${portfolioId}/${userId}`,
  );
  return response.data?.data ?? [];
};

export const sellPortfolioHolding = async ({ holdingId, quantity }) => {
  const response = await axios.post("http://localhost:8082/api/portfolio-holding/sell", {
    id: holdingId,
    quantity,
  });
  return response.data;
};

export const sellPortfolioHoldings = async (orders) => {
  const response = await axios.post("http://localhost:8082/api/portfolio-holding/sell-batch", orders);
  return response.data;
};

export const updatePortfolioHoldingEquityCategory = async ({ holdingId, equityCategory }) => {
  const response = await axios.patch(
    `http://localhost:8082/api/portfolio-holding/${holdingId}/equity-category`,
    { equityCategory },
  );
  return response.data;
};

// export const getPortfolioTransactions = async (portfolioId) => {
//   const response = await axios.get(`http://localhost:8082/api/transactions/portfolio/${portfolioId}`);
//   return response.data;
// };

