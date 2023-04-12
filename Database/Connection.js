import mongoose from "mongoose";

export const Connection = async () => {
    mongoose.set('strictQuery', true)
    // const db = await mongoose.connect(getUri);
    const db = await mongoose.connect(process.env?.ATLAS_URI);
    console.log("Database Connected")
    return db;
}
