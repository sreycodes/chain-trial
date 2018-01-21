var express = require('express');
var router = express.Router();
var passport = require('passport')
var User = require('../config/mongoose_setup');
var Chain = require('../config/mongoose_setup2');
var geodist = require('geodist');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Registration' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login', message : req.flash('loginMessage')  });
});

router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Sign Up', message : req.flash('signupMessage') });
});

router.get('/fill_in', function(req, res, next) {
  // Chain.remove({}, function(err) {
  //  console.log("all clear");
  // });
  chain = new Chain();
  chain.local.color = 'blue';
  chain.local.coord_array = [{lat: 72,lng: -20},{lat: 12,lng: -57},{lat: 18,lng: -87}];
  chain.save(function(err) {
    if(err) throw(err);
    console.log("New chain");
    console.log(chain);
  });
});

<<<<<<< HEAD
router.get('/gameplay', function(req, res, next) {
  Chain.find({}, 'local.color local.coord_array', function(err, list_chains) {
=======
router.get('/gameplay', isLoggedIn, function(req, res, next) {
  console.log(req.user);
  User.find({}, 'lat lng chain')
  .exec(function(err, list_users) {
    list_correct_users = [];
    var cntr = 0;
    console.log("KYA AAP CHUTIYE HAIN");
    list_users.forEach(function(user, index) {
      console.log(user);
      if(!user.local.chain && geodist([user.local.lat, user.local.lng], [req.user.local.lat, req.user.local.lng],
        {format: true, unit: 'km'}) <= 1000) {
        list_correct_users[cntr] = user.local;
        console.log(user);
        cntr++;
      }
    });

    Chain.find({}, 'local.color local.coord_array')
    .exec(function(err, list_chains) {
>>>>>>> 2ea8b011dda587aaf0751c82313a9359f2fafa52
    // console.log(list_chains);
    list_chains.forEach(function(chain, index) {
      list_chains[index] = list_chains[index].local;
    });
    console.log(list_chains);
    res.render('gameplay', {chains_list: list_chains, nearby_users: list_correct_users});
    });
  });
});

router.post('/get_coord', isLoggedIn, function(req, res, next) {

    User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {

            user.local.lat = req.body.lat;
            user.local.lng = req.body.lng;
            user.save((err, user) => {
                if(err) 
                  throw err;
                else
                  console.log("i am here");
                  //next();
            });
        });
    res.end();
});

router.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile', {title: "Your co-ordinates"})
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
router.get('/logout', function(req, res) {

        User.findOne({ 'local.username' :  req.user.local.username }, function(err, user) {

            user.local.loggedIn = false;
            user.save((err) => {
                if(err) 
                    throw err;
                req.logout();
                res.redirect('/');
            });
        });
    });

router.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true
    }));

router.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the login  page if there is an error
        failureFlash : true // allow flash messages
    }));


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = router;
