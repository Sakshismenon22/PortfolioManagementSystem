import axios from 'axios';
const registerUser = async (user)=>{
    const res = await axios.post(`http://localhost:8082/api/users/register`,user);
    console.log(res);
    return res;
}

const user = {
    "name":"Niranjan V",
    "email":"abc2@gmail.com",
    "phoneNumber":"1234567890",
    "role":"USER"
}

await registerUser(user);