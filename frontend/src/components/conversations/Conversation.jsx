import { useEffect, useState } from "react";
import "./conversation.css";
import axios from 'axios'
export default function Conversation({conversation,currUser}) {

  const [user, setuser] = useState(null)
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const friendId=conversation.members.find((m)=>m !== currUser.userId);

    const getUser=async()=>{
      try{
        const res=await axios.get(`${backend_url}/user/getgeneraluser/`+friendId);
        
        setuser(res.data.user)


      }
      catch(err){

        console.log(err)

      }
    }

    getUser();
  
    
  }, [currUser,conversation])
  
  return (
    <div className="conversation">
      <img className="conversationImg" src={user ? user.profilePic : "https://res.cloudinary.com/decprn8rm/image/upload/v1751100810/download_gqok6f.png"} alt="" />
       <span className="conversationName">{user ? user.username : "Loading..."}</span>
    </div>
  );
}
