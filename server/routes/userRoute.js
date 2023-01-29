const router = require("express").Router();
const { register, login,logout,getUser,loginStatus,updateUser,changePassword, forgotPassword,resetPassword } = require("../controllers/auth");
const AuthorizationMiddleware = require("../middlewares/Authorizaion");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/getuser").get(AuthorizationMiddleware,getUser);
router.route("/loggedin").get(loginStatus);
router.route("/updateuser").patch(AuthorizationMiddleware,updateUser);
router.route("/changepassword").patch(AuthorizationMiddleware,changePassword);
router.route("/forgotpassword").post(forgotPassword );
router.route("/resetpassword/:resetToken").put(resetPassword );

module.exports = router;
