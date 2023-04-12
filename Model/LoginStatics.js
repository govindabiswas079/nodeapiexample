import mongoose from "mongoose";

export const LoginStaticsSchema = new mongoose.Schema({
    userId: { type: String, },
    name: { type: String, },
    email: { type: String, },
    mobile: { type: Number, },
    isMobileVerifyed: { type: Boolean, },
    isEmailVerifyed: { type: Boolean, },
    createdAt: { type: Date, default: new Date() },
});

export default mongoose.model.LoginStatics || mongoose.model('LoginStatics', LoginStaticsSchema);