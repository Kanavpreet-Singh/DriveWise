import { useEffect, useState } from "react";
import "./message.css";
import axios from 'axios';
import { format } from "timeago.js";

export default function Message({ message, own }) {
  const [userProfile, setUserProfile] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const getDetails = async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user/getgeneraluser/${message.sender}`);
        setUserProfile(resp.data.user.profilePic);
        setUsername(resp.data.user.username);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    getDetails();
  }, [message.sender]);

  return (
    <div className={own ? "message own" : "message"}>
      <div className="messageTop">
        <img
          className="messageImg"
          src={userProfile || "/defaultAvatar.png"}
          alt="Profile"
        />
        <div>
          {!own && <span className="senderName">{username}</span>}
          <p className="messageText">{message.text}</p>
        </div>
      </div>
      <div className="messageBottom">{format(message.createdAt)}</div>
    </div>
  );
}
