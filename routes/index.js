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

router.get('/update', function(req, res, next) {
  User.update({'local.username': 'chutiya'}, {'local.username' : 'LOL'}, 
              function(err, user) {
                if(err) throw err;
                console.log(user);
              });
  res.redirect('/login');
});

router.post('/create_chain', function(req, res, next) {
  chain = new Chain();
  chain.local.color = 'green'; //Random color has to be added
  chain.local.coord_array = [];
  chain.local.coord_array.push({lat: req.user.local.lat,lng: req.user.local.lng});
  chain.save(function(err, chain) {
    if(err) throw(err);
    console.log("New chain");
    console.log(chain);
    User.update({'local.username' : req.user.local.username},{'local.chain' : chain._id},
                function(err, user) {
                  if(err) throw err;
                  console.log("User updated");
                  User.findOne({'local.username' : req.body.username},
                                function(err, user) {
                                  if(err) throw err;
                                  user.local.invites.push(chain._id);
                                  user.save(function(err) {
                                              if(err) throw err;
                                            });
                              });
                });
  });
  res.redirect('/gameplay');
});

router.post('/join_chain', function(req, res, next) {
  Chain.findOne({'_id': req.body.chainID}, function(err, chain) {
    console.log(chain._id);
    chain.local.coord_array.push({lat : req.user.local.lat,lng : req.user.local.lng});
    chain.save(function(err, chain) {
     User.findOne({'_id': req.user._id}, function(err, user) {
        user.local.chain = req.body.chainID;
        user.local.invites = [];
        console.log(user);
        user.save(function(err) {
          if(err) throw err;
        });
      });
    });
  });
  res.redirect('/gameplay');
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

router.get('/gameplay', isLoggedIn, function(req, res, next) {
  console.log(req.user);
  User.find()
  .exec(function(err, list_users) {
    console.log("KYA AAP CHUTIYE HAIN");
    list_users.forEach(function(user, index) {
      var dist = geodist([user.local.lat, user.local.lng], [req.user.local.lat, req.user.local.lng], {format: false, unit: 'km'});
      if(!user.local.chain && dist <= 10000 && !user._id.equals(req.user._id) && user.local.loggedIn) {
        list_users[index] = list_users[index].local;
      } else  list_users[index] = null;
    });

    Chain.find({}, 'local.color local.coord_array')
    .exec(function(err, list_chains) {
    // console.log(list_chains);
    list_chains.forEach(function(chain, index) {
      list_chains[index] = list_chains[index].local;
    });
    console.log(list_chains);
    console.log(list_users);
    res.render('gameplay', {me: req.user.local, chains_list: list_chains, nearby_users: list_users});
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
