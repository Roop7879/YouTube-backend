import { Router } from "express";
import { changePassword, getCurrnetUser, getUserChannelProfile, loginUser, LogoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(upload.fields([
    {
        name:"avatar",    //is file ko kis name janna hai
        maxCount: 1
    },
    {
        name:"coverImage",
        maxCount: 1
    }]
),registerUser)

router.route('/login').post(loginUser)

//secured routes
router.route('/logout').post(verifyJWT, LogoutUser)
router.route('/refresh-token').post(verifyJWT, refreshAccessToken)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/get-current-user').get(verifyJWT, getCurrnetUser)
router.route('/update-account').patch(verifyJWT, updateAccountDetails)
router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('/update-cover-image').patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route('/c/:username').get(verifyJWT, getUserChannelProfile)


export default router   