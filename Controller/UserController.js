import UserModel from '../Model/UserModel.js';
import LoginStatics from '../Model/LoginStatics.js';
import UserProfile from '../Model/UserProfile.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import excel from "exceljs";
import XLSX from "xlsx";
import moment from 'moment';
import Promise from 'promise';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();
export const VerifyUser = async (req, res, next) => {
    try {
        const { email } = req.method == "GET" ? req.query : req.body;
        let exist = await UserModel.findOne({ email: email });
        if (!exist) return res.status(404).send({ error: "User dose not exit" });
        next();
    } catch (error) {
        return res.status(404).send({ error: "Authentication Error", error });
    }
};

export const RegisterUser = async (req, res, next) => {
    const { password, email, firstName, lastName, mobile, } = req.body;

    try {
        const oldEmail = await UserModel.findOne({ email });
        if (oldEmail) return res.status(400).json({ message: "Email already exists" });

        const oldMobile = await UserModel.findOne({ mobile });
        if (oldMobile) return res.status(400).json({ message: "Mobile already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);
        await UserModel.create({ password: hashedPassword, email, firstName, lastName, name: firstName + " " + lastName, mobile, })
            .then(result => res.status(201).send({ msg: "User Register Successfully" }))
            .catch(error => res.status(500).send({ error }));
    } catch (error) {
        return res.status(404).send({ error });
    }
}

export const LoginUser = async (req, res, next) => {
    const { email, password } = req?.body

    try {
        await UserModel.findOne({ email: email })
            .then(user => {
                if (!user) return res.status(404).send({ error: "User dose not exit" });
                bcrypt.compare(password, user.password)
                    .then(passwordCheck => {
                        if (!passwordCheck) return res.status(400).send({ error: "Incorrect Password" });
                        const { password, ...rest } = Object.assign({}, user.toJSON());
                        return res.status(200).send({ ...rest });
                    })
                    .catch(error => {
                        return res.status(400).send({ error: "Password does not Match" })
                    })
            })
            .catch(error => {
                return res.status(404).send({ error: "User dose not exit" });
            });
        next();
    } catch (error) {
        return res.status(500).send({ error });
    }
};

export const GetUsers = async (req, res, next) => {
    const { currentPage, pageSize } = req.query;
    try {
        const LIMIT = pageSize;
        const startIndex = (Number(currentPage) - 1) * LIMIT;
        const total = await UserModel.countDocuments({});
        const data = await UserModel.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
        const profileData = await UserProfile.find();

        const getProfile = async (id) => {
            return new Promise((resolve, reject) => {
                UserProfile.findOne({ userId: id })
                    .then((profile) => {
                        return resolve(profile);
                    })
            })
        };

        res.status(200).json({
            data: data?.map((value, _) => ({
                _id: value?._id,
                email: value?.email,
                firstName: value?.firstName,
                lastName: value?.lastName,
                name: value?.name,
                mobile: value?.mobile,
                createdAt: value?.createdAt,
                updatedAt: value?.updatedAt,
                isMobileVerifyed: value?.isMobileVerifyed,
                isEmailVerifyed: value?.isEmailVerifyed,
                profile: !profileData.find(data => data?.userId == value?._id) ? null : profileData.find(data => data?.userId == value?._id)
                // profile: getProfile(value?._id).then(data => { data })
            })),
            currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total / LIMIT), numberOfData: total
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const GetUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User Dose noe exit' });

        await UserModel.findOne({ _id: id })
            .then((user) => {
                if (!user) return res.status(404).send({ error: "User dose not exit" });
                UserProfile.findOne({ userId: id })
                    .then((profiles) => {
                        const { password, ...rest } = Object.assign({}, user?.toJSON());
                        const { ...profile } = !profiles ? null : Object.assign({}, profiles?.toJSON());
                        return res.status(200).send({ ...rest, profile: profile });
                    })
            })
            .catch((error) => {
                res.status(404).json({ message: "User dose not exit" });
            })
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const UpdateUser = async (req, res, next) => {
    const { id } = req?.params;
    const { _id, email, firstName, lastName, mobile, createdAt, isMobileVerifyed, isEmailVerifyed } = req?.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User not exit' });

        UserModel.updateOne({ _id: id }, { email, firstName, lastName, name: firstName + " " + lastName, mobile, createdAt, updatedAt: new Date(), isMobileVerifyed, isEmailVerifyed })
            .then((user) => {
                return res.status(200).send({ msg: "User updated successfully" });
            })
            .catch(() => {
                return res.status(404).send({ error: "User updated faield." });
            })
    } catch (error) {
        return res.status(404).send({ error: "User updated faield." });
    }
}

export const DeleteUser = async (req, res, next) => {
    const { id } = req?.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User not exit' });

        UserModel.findByIdAndRemove({ _id: id })
            .then(() => {
                next()
                return res.status(200).send({ message: "User deleted successfully." });
            })
            .catch(() => {
                return res.status(404).send({ error: "User deleted faield." });
            })
    } catch (error) {
        return res.status(404).send({ error: "User deleted faield." });
    }
}

export const UpdatePassword = async (req, res, next) => {
    const { id } = req?.params;
    const { previousPassword, newPassword } = req?.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User not exit' });
        await UserModel.findOne({ _id: id })
            .then((user) => {
                if (!user) return res.status(404).send({ error: "User dose not exit" });
                bcrypt.compare(previousPassword, user?.password)
                    .then(passwordCheck => {
                        if (!passwordCheck) return res.status(400).send({ error: "Incorrect previous  Password" });
                        bcrypt.hash(newPassword, 10)
                            .then(hashedPassword => {
                                UserModel.updateOne({ _id: id, email: user?.email }, { password: hashedPassword })
                                    .then((user) => {
                                        return res.status(200).send({ msg: "Password updated successfully" });
                                    })
                                    .catch(() => {
                                        return res.status(200).send({ msg: "Password updated faield" });
                                    })
                            })
                            .catch(error => {
                                return res.status(400).send({ error: "Incorrect previous  Password" })
                            })
                    })
                    .catch(error => {
                        return res.status(400).send({ error: "Incorrect previous  Password" })
                    })
            })
            .catch(() => {
                return res.status(200).send({ msg: "User updated faield" });
            })
    } catch (error) {
        return res.status(200).send({ msg: "User updated faield" });
    }
}

export const ForogotPassword = async (req, res, net) => {
    const { id } = req?.params;
    const { newPassword } = req?.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User not exit' });
        bcrypt.hash(newPassword, 10)
            .then(hashedPassword => {
                UserModel.updateOne({ _id: id }, { password: hashedPassword })
                    .then((user) => {
                        return res.status(200).send({ msg: "Password forgot successfully" });
                    })
                    .catch(() => {
                        return res.status(200).send({ msg: "Password forgot faield" });
                    })
            })
    } catch (error) {
        return res.status(200).send({ msg: "Password forgot faield" });
    }
}

export const PasswordForgotOtp = async (req, res, next) => {
    const { email } = req.query;
    try {
        req.app.locals.OTP = otpGenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
        res.status(200).send({ code: req.app.locals.OTP })
    } catch (error) {
        return res.status(404).send({ error: "User not exit" });
    }
}

export const PasswordForgotOtpVerify = async (req, res, next) => {
    const { code } = req?.body;
    console.log(req?.method)
    if (req?.method !== 'PATCH') return res.status(405).send({ error: "Method not allowed" })
    try {
        if (parseInt(req.app.locals.OTP) === parseInt(code)) {
            req.app.locals.OTP = null;
            req.app.locals.resetSession = true;
            return res.status(200).send({ msg: 'Verify successsfully!' })
        }
        return res.status(400).send({ error: "Invalid OTP" });
    } catch (error) {
        return res.status(400).send({ error });
    }
}

export const CreateStatic = async (req, res, next) => {
    const { email } = req?.body;
    try {
        await UserModel.findOne({ email })
            .then((user) => {
                LoginStatics.create({
                    userId: user?._id,
                    name: user?.name,
                    email: user?.email,
                    mobile: user?.mobile,
                    isMobileVerifyed: user?.isMobileVerifyed,
                    isEmailVerifyed: user?.isEmailVerifyed
                })
            })
    } catch (error) {

    }
}

export const GetStatics = async (req, res, next) => {
    const { currentPage, pageSize, name, email, from, to } = req.query;

    try {
        if (name && email && (from && to)) {
            const LIMIT = pageSize;
            const startIndex = (Number(currentPage) - 1) * LIMIT;
            const total = await LoginStatics.find({ name, email, createdAt: { $gte: from, $lt: to } });
            const data = await LoginStatics.find({ name, email, createdAt: { $gte: from, $lt: to } }).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
            res.status(200).json({ data: data, currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total?.length / LIMIT), numberOfData: total?.length });
        } else if (name) {
            const LIMIT = pageSize;
            const startIndex = (Number(currentPage) - 1) * LIMIT;
            const total = await LoginStatics.find({ name });
            const data = await LoginStatics.find({ name }).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
            res.status(200).json({ data: data, currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total?.length / LIMIT), numberOfData: total?.length });
        } else if (email) {
            const LIMIT = pageSize;
            const startIndex = (Number(currentPage) - 1) * LIMIT;
            const total = await LoginStatics.find({ email });
            const data = await LoginStatics.find({ email }).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
            res.status(200).json({ data: data, currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total?.length / LIMIT), numberOfData: total?.length });
        } else if ((from && to)) {
            const LIMIT = pageSize;
            const startIndex = (Number(currentPage) - 1) * LIMIT;
            const total = await LoginStatics.find({ createdAt: { $gte: from, $lt: to } });
            const data = await LoginStatics.find({ createdAt: { $gte: from, $lt: to } }).sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
            res.status(200).json({ data: data, currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total?.length / LIMIT), numberOfData: total?.length });
        } else {
            const LIMIT = pageSize;
            const startIndex = (Number(currentPage) - 1) * LIMIT;
            const total = await LoginStatics.countDocuments({});
            const data = await LoginStatics.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
            res.status(200).json({ data: data, currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total / LIMIT), numberOfData: total });
        }

    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const ReportStatic = async (req, res, next) => {
    const { name, email, from, to } = req.query;

    try {
        if (name && email && (from && to)) {
            await LoginStatics.find({ name, email, createdAt: { $gte: from, $lt: to } })
                .then((result) => {
                    if (!result) return res.status(404);
                    let Logs_Report = [];

                    result?.forEach((obj, index) => {
                        Logs_Report.push({
                            sr: index + 1,
                            userId: obj?.userId,
                            email: obj?.email,
                            name: obj?.name,
                            loginAt: moment(obj?.createdAt).format('L') + ' ' + moment(obj?.createdAt).format('LT'),
                            isMobileVerifyed: obj?.isMobileVerifyed,
                            isEmailVerifyed: obj?.isEmailVerifyed,
                        });
                    });

                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet("Logs_Report");

                    worksheet.columns = [
                        { header: "Sr. No.", key: "sr", width: 10 },
                        { header: "User Id", key: "userid", width: 25 },
                        { header: "Email", key: "email", width: 25 },
                        { header: "Name", key: "name", width: 25 },
                        { header: "Login At", key: "loginAt", width: 25 },
                        { header: "Mobile Verifyed", key: "isMobileVerifyed", width: 25 },
                        { header: "Email Verifyed", key: "isEmailVerifyed", width: 25 },
                    ];
                    worksheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'cccccc' },
                    }
                    worksheet.addRows(Logs_Report);
                    res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "Logs_Report.xlsx"
                    );
                    return workbook.xlsx.write(res).then(function () {
                        res.status(200).end();
                    });
                })
        } else if (name) {
            await LoginStatics.find({ name })
                .then((result) => {
                    if (!result) return res.status(404);
                    let Logs_Report = [];

                    result?.forEach((obj, index) => {
                        Logs_Report.push({
                            sr: index + 1,
                            userId: obj?.userId,
                            email: obj?.email,
                            name: obj?.name,
                            loginAt: moment(obj?.createdAt).format('L') + ' ' + moment(obj?.createdAt).format('LT'),
                            isMobileVerifyed: obj?.isMobileVerifyed,
                            isEmailVerifyed: obj?.isEmailVerifyed,
                        });
                    });

                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet("Logs_Report");

                    worksheet.columns = [
                        { header: "Sr. No.", key: "sr", width: 10 },
                        { header: "User Id", key: "userid", width: 25 },
                        { header: "Email", key: "email", width: 25 },
                        { header: "Name", key: "name", width: 25 },
                        { header: "Login At", key: "loginAt", width: 25 },
                        { header: "Mobile Verifyed", key: "isMobileVerifyed", width: 25 },
                        { header: "Email Verifyed", key: "isEmailVerifyed", width: 25 },
                    ];
                    worksheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'cccccc' },
                    }
                    worksheet.addRows(Logs_Report);
                    res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "Logs_Report.xlsx"
                    );
                    return workbook.xlsx.write(res).then(function () {
                        res.status(200).end();
                    });
                })
        } else if (email) {
            await LoginStatics.find({ email })
                .then((result) => {
                    if (!result) return res.status(404);
                    let Logs_Report = [];

                    result?.forEach((obj, index) => {
                        Logs_Report.push({
                            sr: index + 1,
                            userId: obj?.userId,
                            email: obj?.email,
                            name: obj?.name,
                            loginAt: moment(obj?.createdAt).format('L') + ' ' + moment(obj?.createdAt).format('LT'),
                            isMobileVerifyed: obj?.isMobileVerifyed,
                            isEmailVerifyed: obj?.isEmailVerifyed,
                        });
                    });

                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet("Logs_Report");

                    worksheet.columns = [
                        { header: "Sr. No.", key: "sr", width: 10 },
                        { header: "User Id", key: "userid", width: 25 },
                        { header: "Email", key: "email", width: 25 },
                        { header: "Name", key: "name", width: 25 },
                        { header: "Login At", key: "loginAt", width: 25 },
                        { header: "Mobile Verifyed", key: "isMobileVerifyed", width: 25 },
                        { header: "Email Verifyed", key: "isEmailVerifyed", width: 25 },
                    ];
                    worksheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'cccccc' },
                    }
                    worksheet.addRows(Logs_Report);
                    res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "Logs_Report.xlsx"
                    );
                    return workbook.xlsx.write(res).then(function () {
                        res.status(200).end();
                    });
                })
        } else if ((from && to)) {
            await LoginStatics.find({ reatedAt: { $gte: from, $lt: to } })
                .then((result) => {
                    if (!result) return res.status(404);
                    let Logs_Report = [];

                    result?.forEach((obj, index) => {
                        Logs_Report.push({
                            sr: index + 1,
                            userId: obj?.userId,
                            email: obj?.email,
                            name: obj?.name,
                            loginAt: moment(obj?.createdAt).format('L') + ' ' + moment(obj?.createdAt).format('LT'),
                            isMobileVerifyed: obj?.isMobileVerifyed,
                            isEmailVerifyed: obj?.isEmailVerifyed,
                        });
                    });

                    let workbook = new excel.Workbook();
                    let worksheet = workbook.addWorksheet("Logs_Report");

                    worksheet.columns = [
                        { header: "Sr. No.", key: "sr", width: 10 },
                        { header: "User Id", key: "userid", width: 25 },
                        { header: "Email", key: "email", width: 25 },
                        { header: "Name", key: "name", width: 25 },
                        { header: "Login At", key: "loginAt", width: 25 },
                        { header: "Mobile Verifyed", key: "isMobileVerifyed", width: 25 },
                        { header: "Email Verifyed", key: "isEmailVerifyed", width: 25 },
                    ];
                    worksheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'cccccc' },
                    }
                    worksheet.addRows(Logs_Report);
                    res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "Logs_Report.xlsx"
                    );
                    return workbook.xlsx.write(res).then(function () {
                        res.status(200).end();
                    });
                })
        } else {
            await LoginStatics.find()
                .then((result) => {
                    if (!result) return res.status(404);
                    let Logs_Report = [];

                    result?.forEach((obj, index) => {
                        Logs_Report.push({
                            sr: index + 1,
                            userId: obj?.userId,
                            email: obj?.email,
                            name: obj?.name,
                            loginAt: moment(obj?.createdAt).format('L') + ' ' + moment(obj?.createdAt).format('LT'),
                            isMobileVerifyed: obj?.isMobileVerifyed,
                            isEmailVerifyed: obj?.isEmailVerifyed,
                        });
                    });

                    let workbook = new excel.Workbook();
                    let worksheet1 = workbook.addWorksheet("Logs_Report");
                    // let worksheet2 = workbook.addWorksheet("Logs_Report2");

                    worksheet1.columns = [
                        { header: "Sr. No.", key: "sr", width: 10 },
                        { header: "User Id", key: "userid", width: 25 },
                        { header: "Email", key: "email", width: 25 },
                        { header: "Name", key: "name", width: 25 },
                        { header: "Login At", key: "loginAt", width: 25 },
                        { header: "Mobile Verifyed", key: "isMobileVerifyed", width: 25 },
                        { header: "Email Verifyed", key: "isEmailVerifyed", width: 25 },
                    ];
                    // worksheet2.columns = [
                    //     { header: "Sr. No.", key: "sr", width: 10 },
                    //     { header: "User Id", key: "userid", width: 25 },
                    //     { header: "Email", key: "email", width: 25 },
                    //     { header: "Name", key: "name", width: 25 },
                    //     { header: "Login At", key: "loginAt", width: 25 },
                    //     { header: "Mobile Verifyed", key: "isMobileVerifyed", width: 25 },
                    //     { header: "Email Verifyed", key: "isEmailVerifyed", width: 25 },
                    // ];

                    worksheet1.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'cccccc' },
                    }
                    // worksheet2.getRow(1).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'cccccc' },
                    // }

                    worksheet1.addRows(Logs_Report);
                    // worksheet2.addRows(Logs_Report);

                    res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + "Logs_Report.xlsx"
                    );
                    return workbook.xlsx.write(res).then(function () {
                        res.status(200).end();
                    });
                })
        }
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const ReportUpload = async (req, res, next) => {
    const { file } = req
    try {
        fs.writeFileSync(path.join(__dirname, `./AssetsFiles/UploadReport/${file?.fieldname}.xlsx`), file?.buffer)
        var workbook = XLSX.readFile(`./AssetsFiles/UploadReport/userreport.xlsx`);
        var sheet_name_list = workbook.SheetNames;
        let jsonData = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]]
        );
        if (jsonData?.length === 0) {
            fs.unlinkSync(path.join(__dirname, `./AssetsFiles/UploadReport/${file?.fieldname}.xlsx`));
            return res.status(400).json({
                success: false,
                message: "xlsx sheet has no data",
            });
        }

        fs.unlinkSync(path.join(__dirname, `./AssetsFiles/UploadReport/${file?.fieldname}.xlsx`));
        return res.status(200).send(jsonData[0]);
    } catch (error) {

    }
}