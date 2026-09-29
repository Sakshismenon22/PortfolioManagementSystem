import axios from "axios";

const calculateDrift = async ()=>{
    try{
        const res = await axios.get("http://localhost:8082/api/drift/calculate/2/1","");
        console.log(res.data);
    }catch(e){
        console.log(e);
    }
}

await calculateDrift();