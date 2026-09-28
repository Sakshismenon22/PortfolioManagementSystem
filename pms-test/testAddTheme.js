import axios from 'axios';
const addTheme = async (theme)=>{
    const res = await axios.post(`http://localhost:8082/api/themes/add-theme`,theme);
    console.log(res);
    return res;
}

const goldEquityTheme = {
  name: "Gold & Equity Balanced",
  risk: "MEDIUM",
  investmentHorizon: "LONG",
  allocationRuleList: [
    { assetId: 2,  percentage: 70.0 },   
    { assetId: 20, percentage: 30.0 }    
  ],
  userId:1
};
const res = await addTheme(goldEquityTheme);

