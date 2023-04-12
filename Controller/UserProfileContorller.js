import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import UserProfile from '../Model/UserProfile.js';
import UserModel from '../Model/UserModel.js';

const __dirname = path.resolve();

export const CreateProfile = async (req, res, next) => {
  const { file } = req;
  const { userId, residence_address, street_address, country, state, city, pincode, countrycode, statecode } = req?.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).send({ message: 'User Dose noe exit' });

    const oldExit = await UserProfile.findOne({ userId: userId });
    if (oldExit) return res.status(400).json({ message: "Profile already exists, You can update now" });

    await UserModel.findOne({ _id: userId })
      .then(user => {
        UserProfile.create({
          userId: user?._id,
          name: user?.name,
          image: { url: !file ? null : "https://" + req?.headers?.host + "/api/imgaes/user/" + userId + ".png", name: user?.name, },
          address: { residence_address, street_address, country, state, city, pincode, countrycode, statecode },
        })
          .then(result => {
            if (file) {
              fs.writeFileSync(path.join(__dirname, `./AssetsFiles/UserProfile/${userId}.png`), file?.buffer)
            }
            res.status(201).send({ msg: "User Profile Successfully Created" })
          })
          .catch(error => res.status(404).send({ error }));
      })
      .catch((error) => {
        return res.status(404).send({ error: "User dose not exit" });
      })
  } catch (error) {
    return res.status(404).send({ error: "User dose not exit" });
  }
}

export const GetProfiles = async (req, res, next) => {
  const { currentPage, pageSize } = req.query;
  try {
    const LIMIT = pageSize;
    const startIndex = (Number(currentPage) - 1) * LIMIT;
    const total = await UserProfile.countDocuments({});
    const data = await UserProfile.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);
    res.status(200).json({ data: data, currentPage: !currentPage ? 1 : Number(currentPage), totalPage: !pageSize ? 1 : Math.ceil(total / LIMIT), numberOfData: total });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const GetProfile = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User Dose noe exit' });

    await UserProfile.findOne({ userId: id })
      .then((user) => {
        if (!user) return res.status(404).send({ error: "User dose not exit" });
        UserProfile.findOne({ userId: id })
          .then((profiles) => {
            if (!profiles) return res.status(404).send({ error: "User dose not exit" });
            const { ...profile } = !profiles ? null : Object.assign({}, profiles?.toJSON());
            return res.status(200).send(profile);
          })
      })
      .catch((error) => {
        res.status(404).json({ message: "User dose not exit" });
      })
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const DeleteProfile = async (req, res, next) => {
  const { id } = req?.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'User not exit' });

    await UserProfile.findOne({ userId: id })
      .then((data) => {
        UserProfile.findByIdAndRemove({ _id: data?._id })
          .then((profile) => {
            if (profile?.image?.url) {
              fs.unlinkSync(path.join(__dirname, `/AssetsFiles/UserProfile/${profile?.userId}.png`));
            }
            return res.status(200).send({ message: "Profile deleted successfully." });
          })
          .catch(() => {
            return res.status(404).send({ error: "Profile deleted faield." });
          })
      })
      .catch(() => {
        return res.status(404).send({ message: 'Data not exit' });
      })
  } catch (error) {
    return res.status(404).send({ error: "Profile deleted faield." });
  }
}

export const UpdaetProfileImage = async (req, res, next) => {
  const { file } = req;
  const { id } = req?.params;
  const { userId } = req?.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'Profile Dose noe exit' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).send({ message: 'User Dose noe exit' });

    await UserModel.findOne({ _id: userId })
      .then(user => {
        UserProfile.updateOne({ _id: id }, {
          userId: user?._id,
          name: user?.name,
          image: { url: !file ? null : "https://" + req?.headers?.host + "/api/imgaes/user/" + userId + ".png", name: user?.name, },
          updatedAt: new Date()
        })
          .then(result => {
            if (file) {
              fs.writeFileSync(path.join(__dirname, `./AssetsFiles/UserProfile/${userId}.png`), file?.buffer)
            }
            res.status(201).send({ msg: "User Profile Successfully Updated" })
          })
          .catch(error => res.status(404).send({ error }));
      })
      .catch((error) => {
        return res.status(404).send({ error });
      })
  } catch (error) {
    return res.status(404).send({ error });
  }
}
export const UpdaetProfileData = async (req, res, next) => {
  const { residence_address, street_address, country, state, city, pincode, countrycode, statecode } = req?.body;
  const { id } = req?.params;
  const { userId } = req?.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send({ message: 'Profile Dose noe exit' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).send({ message: 'User Dose noe exit' });

    await UserModel.findOne({ _id: userId })
      .then(user => {
        UserProfile.updateOne({ _id: id }, {
          userId: user?._id,
          name: user?.name,
          address: { residence_address, street_address, country, state, city, pincode, countrycode, statecode },
          updatedAt: new Date()
        })
          .then(result => {
            res.status(201).send({ msg: "User Profile Successfully Updated" })
          })
          .catch(error => res.status(404).send({ error }));
      })
      .catch((error) => {
        return res.status(404).send({ error });
      })
  } catch (error) {
    return res.status(404).send({ error });
  }
}