const portfolioId = 2;
import axios from 'axios';
const addHolding = async (holding)=>{
    const res = await axios.post(`http://localhost:8082/api/portfolio-holding/add-holding`,holding);
    console.log(res);
    return res;
}
const holdings = [
  {
    portfolioId:      portfolioId,
    securityMasterId: 1,       
    quantity:         175,    
    assetId:          2
  },
  {
    portfolioId:      portfolioId,
    securityMasterId: 2,       
    quantity:         84,     
    assetId:          2
  },


  {
    portfolioId:      portfolioId,
    securityMasterId: 31,      
    quantity:         1,       
    assetId:          20
  }
];

for(const holding of holdings){
    await addHolding(holding);
}