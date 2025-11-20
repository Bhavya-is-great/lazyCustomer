import mongoose from "mongoose";

const dbConnect = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database connected successfully");
    }catch(err){
        console.error("Database connection failed", err);
        process.exit(1);
    }  
}

export default dbConnect;
