var express = require('express');
var router = express.Router();
const userModle = require("./users");
const postModle = require("./post");
const passport = require('passport');
const upload = require("./multer");

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModle.authenticate()));



/* GET home page. */
router.get('/', function(req, res, next) {
  
  res.render('index');
});

router.get('/login', function(req, res, next) {
  // console.log(req.flash("error"));
  res.render('login', {error: req.flash('error')});
});

// 
// router.get('/feed', function(req, res, next) {
//   res.render('feed');
// });
// 
router.get('/feed', isLoggedIn, async function(req, res, next){
  const user = await userModle.findOne({username: req.session.passport.user})
  const posts = await postModle.find()
  .populate("user")
  res.render("feed", {user, posts, nav: true});
});
// 


router.post('/upload', isLoggedIn ,  upload.single("file"), async  function(req, res, next) {
  if(!req.file){
    return res.status(404).send("no file were given");
  }
  const user= await userModle.findOne({username: req.session.passport.user});
  const post = await postModle.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

/* get profile page */
router.get('/profile', isLoggedIn , async  function(req, res, next) {
  const user = await userModle.findOne ({
    username: req.session.passport.user
  })
  .populate("posts")
  console.log(user);
  res.render("profile", {user});
});


router.post("/register", function(req, res){
  const {username,email,fullname,} = req.body;
  const userData = new userModle({username,email,fullname});

  userModle.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local") (req, res, function(){
      res.redirect("/profile");
    })
 })
})

router.post("/login", passport.authenticate("local", {
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true
}), function(req, res){
});

router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

router.post('/fileupload', isLoggedIn, upload.single("image"), async function(req, res, next){
  const user = await userModle.findOne({username:req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});




module.exports = router;
