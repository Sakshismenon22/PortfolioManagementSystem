import axios from 'axios'
export const getAllSecuritiesInfo = async ()=>{
    try{
        const res = await axios.get(`http://localhost:8082/api/security/get-all-security-info`,"");
        console.log(res.data);
        return res.data;
    }catch(e){
        return e.response;
    }
}

export const searchSecurities = async (query) => {
    const res = await axios.get(`http://localhost:8082/api/security/search`, {
        params: { query },
    });
    return res.data;
}
