import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react';
const backend_url = import.meta.env.VITE_BACKEND_URL;
const DealerProfile = () => {

  const [data, setdata] = useState({});
  const [cars, setcars] = useState([])

  useEffect(async () => {

    
    const response=await axios.get(`${backend_url}/user/dealer`);

    setdata(response.data.dealer);
    setcars(response.data.cars);
  
    
  }, [])
  
  return (
    <div>

        <div>Username: {data.username}</div>

        <ul></ul>




      
    </div>
  )
}

export default DealerProfile
