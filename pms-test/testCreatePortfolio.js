import axios from 'axios';
const createPortfolio = async (portfolio)=>{
    const res = await axios.post(`http://localhost:8082/api/portfolio/create-portfolio`,portfolio);
    console.log(res);
    return res;
}

const goldEquityPortfolio = {
  name:                  "My Balanced Portfolio",
  portfolioType:         "WEIGHTAGE",
  currency:              "INR",
  benchmark:             "NIFTY_50",
  exchange:              "NSE",
  reBalancingFrequency:  "QUARTERLY",
  amount:                500000.0,
  userId:                1,
  portfolioStatus:       "CREATED",
  themeId:               1
};

await createPortfolio(goldEquityPortfolio);