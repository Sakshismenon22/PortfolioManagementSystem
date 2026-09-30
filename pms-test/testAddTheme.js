import axios from 'axios';
const addTheme = async (theme)=>{
    const res = await axios.post(`http://localhost:8082/api/themes/add-theme`,theme);
    console.log(res);
    return res;
}

// const goldEquityTheme = {
//   name: "Gold & Equity Balanced",
//   risk: "MEDIUM",
//   investmentHorizon: "LONG",
//   allocationRuleList: [
//     { assetId: 2,  percentage: 70.0 },   
//     { assetId: 20, percentage: 30.0 }    
//   ],
//   userId:1
// };


// const res = await addTheme(goldEquityTheme);


const moderatlyConservativeTheme = {
  name: "Moderately Conservative",
  risk: "LOW",
  investmentHorizon: "MEDIUM",
  allocationRuleList: [
    { assetId: 2,  percentage: 40.0 },   // Equities (Blue Chip Companies)
    { assetId: 6,  percentage: 40.0 },   // Mutal Funds (Balanced Funds)
    { assetId: 20, percentage: 20.0 }    // Commodies (Gold)
  ],
  userId: 1
};

// ── 2. Moderately Aggressive ────────────────────────────────────
const moderatlyAggressiveTheme = {
  name: "Moderately Aggressive",
  risk: "MEDIUM",
  investmentHorizon: "LONG",
  allocationRuleList: [
    { assetId: 2,  percentage: 60.0 },   // Equities (Tech Stocks/Growth Companies)
    { assetId: 6,  percentage: 25.0 },   // Mutal Funds (Index Funds)
    { assetId: 20, percentage: 15.0 }    // Commodies
  ],
  userId: 1
};


const res1 = await addTheme(moderatlyConservativeTheme);
const res2 = await addTheme(moderatlyAggressiveTheme);
