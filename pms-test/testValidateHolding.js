import axios from 'axios';
const testValidateHolding = async (id)=>{
    const res = await axios.get(`http://localhost:8082/api/portfolio/validate-portfolio/${id}`,"");
    console.log(res);
    return res;
}

const res = await testValidateHolding(1);

console.log(res.data);