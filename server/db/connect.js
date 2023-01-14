const mongoose = require('mongoose');
mongoose.set('strictQuery', true);


const connectDb = (url)=>{

    return mongoose.connect(url,{
        useNewUrlParser: true,
        useUnifiedTopology: true,


    })
}
module.exports = connectDb