chain.save(function(err, chain) {
                    
                    //Check if chain is valid and self intersection and other intersections
                    var user_array2 = chain.local.user_array;
                    var edge = [];
                    for(var i = 0; i < user_array2.length - 1; i++) {
                      edge.push({'f' : user_array2[i], 's' : user_array2[i + 1]});
                      //var dist = geodist([user.local.lat, user.local.lng], [req.user.local.lat, req.user.local.lng], {format: false, unit: 'km'});
                    }
                    var ok = 1, M = 100000;
                    for(var i = 0; i < edge.length; i++) {
                      var dist = geodist([edge[i].f.local.lat, edge[i].f.local.lng], [edge[i].s.local.lat, edge[i].s.local.lng], {format: false, unit: 'km'});
                      if(dist > 10) ok = 0;
                      for(var j = i + 2; j < edge.length; j++) {
                        p1 = [edge[i].f.local.lat * M, edge[i].f.local.lng * M];
                        p2 = [edge[i].s.local.lat * M, edge[i].s.local.lng * M];
                        p3 = [edge[j].f.local.lat * M, edge[j].f.local.lng * M];
                        p4 = [edge[j].s.local.lat * M, edge[j].s.local.lng * M];
                        if(intersects([p1, p2], [p3, p4])) {
                          ok = 0;
                        }
                      }
                    }
                    
                    if(ok === 0) {
                      Chain.findOneAndRemove({'local.color' : chain.local.color}, function(err, chain2) {
                        console.log(chain2);
                        User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
                        .exec(function(err, list_users) {
                          if(err) throw err;
                          list_users.forEach(function(user, index) {
                            list_users[index].local.chain = "deleted";
                            list_users[index].local.inviteSent = false;
                            list_users[index].local.invites = [];
                            list_users[index].save(function(err, user) {
                              if(err) throw err;
                              else console.log(user.local.chain + "means deleted");
                            });
                          });
                        });
                      });
                    } else {
                      //Checking for other intersections
                      Chain.find({}, 'local.color local.user_array')
                      .exec(function(err, list_chains) {
                        for(var i = 0; i < list_chains.length; i++) {
                          if(list_chains[i].local.color.equals(chain))  continue;
                          var user_array3 = list_chains[i].local.user_array;
                          for(var j = 0; j < user_array3.length - 1; j++) {
                            p1 = [user_array3[j].local.lat, user_array3[j].local.lng];
                            p2 = [user_array3[j + 1].local.lat, user_array3[j].local.lng];
                            for(var k = 0; k < user_array2.length - 1; k++) {
                              p3 = [user_array2[k].local.lat, user_array2[k].local.lng];
                              p4 = [user_array2[k + 1].local.lat, user_array2[k + 1].local.lng];
                              if(intersects([p1, p2], [p3, p4])) {
                                Chain.findOneAndRemove({'local.color' : list_chains[i].local.color}, function(err, chain2) {
                                  console.log("Deleting opponent's chain" + chain2);
                                  User.find({'local.chain' : chain2.local.color}, 'local.chain local.inviteSent local.invites')
                                    .exec(function(err, list_users) {
                                      if(err) throw err;
                                      list_users.forEach(function(user, index) {
                                        list_users[index].local.chain = "deleted";
                                        list_users[index].local.inviteSent = false;
                                        list_users[index].local.invites = [];
                                        list_users[index].save(function(err, user) {
                                          if(err) throw err;
                                          console.log(user.local.chain + "means deleted");
                                          res.redirect('/gameplay');
                                        });
                                      });
                                    });
                                });
                              }
                            }
                          }
                        }
                      });
                    }
                    res.redirect('/gameplay');
                  });