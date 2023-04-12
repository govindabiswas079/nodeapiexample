import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    password: { type: String, required: [true, "Please provide a password"], unique: true, },
    email: { type: String, required: [true, "Please provide a unique email"], unique: true, },
    firstName: { type: String, required: [true, "Please provide a first name"], },
    lastName: { type: String, required: [true, "Please provide a last name"], },
    name: { type: String, required: [true, "Please provide a last name"], },
    mobile: { type: Number, required: [true, "Please provide a mobile name"], },
    createdAt: { type: Date, default: new Date() },
    updatedAt: { type: Date, default: new Date() },
    isMobileVerifyed: { type: Boolean, default: false },
    isEmailVerifyed: { type: Boolean, default: false },
});

export default mongoose.model.Users || mongoose.model('User', UserSchema);