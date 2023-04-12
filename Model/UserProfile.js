import mongoose from "mongoose";

export const UserProfile = new mongoose.Schema({
    userId: { type: String, required: [true, "Please provide user id"], },
    name: { type: String, required: [true, "Please provide name"], },
    image: {
        url: { type: String, },
        name: { type: String, }
    },
    address: {
        residence_address: { type: String, },
        street_address: { type: String, },
        country: { type: String, },
        state: { type: String, },
        city: { type: String, },
        pincode: { type: Number, },
        countrycode: { type: String, },
        statecode: { type: String, },
    },
    createdAt: { type: Date, default: new Date() },
    updatedAt: { type: Date, default: new Date() },
});

export default mongoose.model.UserProfiles || mongoose.model('UserProfiles', UserProfile);