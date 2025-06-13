const jwt=require('jsonwebtoken')
require('dotenv').config();
 const userAuth=async(req,res,next)=>{
    let token=req.headers.token
    if(!token){
        return res.json({message:"you are not signed in"})
    }
    let check = jwt.verify(token,process.env.JWT_SECRET)

    if(check) {
        req.user = { userId: check.userId };
        next()
    }
    else {
        return res.json({message:"you are not signed in"})
    }

}

module.exports=userAuth