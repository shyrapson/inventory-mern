const {CustomError} =  require('../errors')
const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err,req,res,next)=>{
  console.log(err)

    // if(err instanceof CustomError){
    //     console,log("hello error")
    //     res.status(err.StatusCodes).send({msg:err.message,
    //     stack:process.env.NODE_ENV === 'development' ? err.stack : null     });

    // }
    // return res
    // .status(StatusCodes.INTERNAL_SERVER_ERROR)
    // .send('Something went wrong try again later')
    const customError = {
        statusCode:err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || ('Something went wrong try again later')
    }
   

    res.status(customError.statusCode).json({msg:customError.msg})


}

module.exports = errorHandlerMiddleware