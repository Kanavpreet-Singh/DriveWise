require('dotenv').config();

const io=require("socket.io")(process.env.PORT,{
    cors:{
        origin:process.env.RUNTIME_URL
    }
})

let users=[]

const addUser=(userId,socketId)=>{
    !users.some((user)=>user.userId === userId) && 
    users.push({userId,socketId});
}

const getUser=(userId)=>{
    return users.find(user=>user.userId===userId)
}

const removeUser=(socketId)=>{
    users=users.filter(user=>user.socketId !== socketId)
}

io.on("connection",(socket)=>{
    console.log('a user connected')
    socket.on("addUser",userId=>{

        addUser(userId,socket.id);
        io.emit("getUsers",users)

    })

    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);

    if (user) {
        io.to(user.socketId).emit("getMessage", {
            senderId,
            text
        });
    } else {
        console.log(`User with ID ${receiverId} not connected.`);
        
    }
});


    socket.on("disconnect",()=>{
        console.log('a user disconnected')
        removeUser(socket.id)
        io.emit("getUsers",users)
    })
})