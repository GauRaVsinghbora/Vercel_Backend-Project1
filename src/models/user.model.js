import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true,index: true,lowercase: true, trim: true },
    email: { type: String, required: true, unique: true,lowercase: true, trim: true,index: true },
    password: { type: String, required: true },
    refreshToken: { type: String, default: null },
    isVerified: { type: Boolean, default: false }, 
    otp: String, 
    otpexpiry: Date
}, { timestamps: true});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
    });

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { userId: this._id, username: this.username, email: this.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_LIFE }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { userId: this._id}, 
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_LIFE }
    );
}

export const User = mongoose.model('User', userSchema);