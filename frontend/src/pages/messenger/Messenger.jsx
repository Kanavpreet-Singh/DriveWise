import React, { useEffect, useRef } from 'react'
import './messenger.css'
import axios from 'axios';
import Conversation from '../../components/conversations/Conversation'
import Message from '../../components/message/Message'
import ChatOnline from '../../components/chatOnline/ChatOnline'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import io from "socket.io-client"
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function Messenger() {

    const [conversations, setconversations] = useState([]);
    const [currchat, setCurrchat] = useState(null);
    const [messages, setMessages] = useState([])
    const [newMessage, setnewMessage] = useState("");
    const [arrivalMessage, setarrivalMessage] = useState(null)
    const navigate = useNavigate();
    const socket=useRef();

    const backend_url = import.meta.env.VITE_BACKEND_URL;
    const {user}=useAuth();

    
    const scrollRef=useRef()

    useEffect(() => {

        socket.current=io(import.meta.env.VITE_SOCKET_URL);

         socket.current.on("getMessage",data=>{
            setarrivalMessage({
                sender:data.senderId,
                text:data.text,
                createdAt:Date.now()

            })
    })

    }, [])

    useEffect(() => {
        arrivalMessage && currchat?.members.includes(arrivalMessage.sender) &&
        setMessages((prev)=>[...prev,arrivalMessage]);
      
    }, [arrivalMessage,currchat])
    
    
    
    useEffect(() => {
        if (user && user.userId) {
            socket.current.emit("addUser", user.userId);
            socket.current.on("getUsers", (users) => {
            
            });
        }
        }, [user]);

    
    
    
    

    useEffect(() => {
    const getConversation = async () => {
      try {
        const res = await axios.get(`${backend_url}/conversation/` + user.userId);
        setconversations(res.data);
        
      } catch (err) {
        console.log(err);
      }
    };

    if (user && user.userId) {
      getConversation();
    }
  }, [user]);

  useEffect(() => {
    const getMessages=async()=>{
        try{
            const res=await axios.get(`${backend_url}/message/`+currchat?._id)
            setMessages(res.data)

        }
        catch(err){
            console.log(err)
        }
        
    }

    getMessages();
  
    
  }, [currchat])


  const handleSubmit=async (e)=>{
    e.preventDefault()
    const message={
        sender:user.userId,
        text:newMessage,
        conversationId:currchat._id
    }

    const receiverId=currchat.members.find(m=>m!==user.userId)

    socket.current.emit("sendMessage",{
        senderId:user.userId,
        receiverId,
        text:newMessage

    })


    try{

        const res=await axios.post(`${backend_url}/message`,message);
        setMessages([...messages,res.data])

        setnewMessage("")

    }
    catch(err){
        console.log(err)
    }
  }



  useEffect(() => {
    scrollRef.current?.scrollIntoView({behavior:"smooth"})
  
    
  }, [messages])

  const handlechangeConv=async (c)=>{

    setCurrchat(c);


  }
  

  return (
    <div>

        
        <div className="messenger">
            <div className="chatMenu">
                <div className="chatMenuWrapper">
                    <input type="text" placeholder='search for friends' className='chatMenuInput' />
                    {conversations.map((c, index) => (
                        <div key={index} onClick={()=>{handlechangeConv(c)}}>
                            <Conversation conversation={c} currUser={user} />
                        </div>
                        ))}

                </div>
            </div>
            <div className="chatBox">
                <div className="chatBoxWrapper">
                    {
                        currchat ? <>
                    
                    <div className="chatBoxTop">
                        {messages.map(m=>(
                            <div ref={scrollRef}>
                            <Message message={m} own={m.sender === user.userId}/>
                            </div>
                        ))}
                        
                    </div>
                    <div className="chatBoxBottom">
                        <textarea
                            className="chatMessageInput"
                            placeholder="write something..."
                            onChange={(e)=>{setnewMessage(e.target.value)}}
                            value={newMessage}
                        ></textarea>
                        <button className="chatSubmitButton" onClick={handleSubmit}>Send</button>
                        </div> </>: <span className='noConversationText'>Open a conversation to start a chat</span>}

                </div>
                    
            </div>
            
        </div>
      
    </div>
  )
}
