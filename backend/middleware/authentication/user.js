const jwt=require('jsonwebtoken')
require('dotenv').config();
 const userAuth=async(req,res,next)=>{
    let token = req.cookies.token;
    if(!token){
        return res.json({message:"you are not signed in"})
    }
    try {
        const check = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: check.userId };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
    }

}

module.exports=userAuth