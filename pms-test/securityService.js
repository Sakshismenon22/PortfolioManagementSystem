import axios from 'axios'
const getAllSecuritiesInfo = async ()=>{
    try{
        const res = await axios.get(`http://localhost:8082/api/security/get-all-security-info`,"");
        console.log(res.data);
        return res.data;
    }catch(e){
        return e.response;
    }
}

const securities = await getAllSecuritiesInfo();

console.log(securities);