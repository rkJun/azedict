(function(window) {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBc5PFE2neUq_hwA5o7oAXFNO1X-GtXUwU",
        authDomain: "azedict-8e24f.firebaseapp.com",
        databaseURL: "https://azedict-8e24f.firebaseio.com",
        projectId: "azedict-8e24f",
        storageBucket: "azedict-8e24f.appspot.com",
        messagingSenderId: "811446330728"
    };
    firebase.initializeApp(config);

    var provider = new firebase.auth.FacebookAuthProvider();
    
    // global az
    window.az = {};
    window.vapp = {};

    az.isLogin = function() {
        var user = firebase.auth().currentUser;

        if (user) {
            // User is signed in.
            return true;
        } else {
            // No user is signed in.
            return false;
        }
    };

    az.getUser = function() {
        var user = firebase.auth().currentUser;

        var isLogin = false;
        var displayName = "";
        var photoURL = "";
        var uid = "";

        if (user) {
            isLogin = true;
            displayName = user.displayName;
            photoURL = user.photoURL;
            uid = user.uid;
        } else {
            isLogin = false;
            displayName = "";
            photoURL = "";
        }

        vapp.writeApp.isLogin = isLogin;
        vapp.writeApp.displayName = displayName;
        vapp.writeApp.photoURL = photoURL;
        vapp.writeApp.uid = uid;

    };

    az.getUserChanged = function() {

        // login check
        firebase.auth().onAuthStateChanged(function(user) {
            var isLogin = false;
            var displayName = "";
            var photoURL = "";
            var uid = "";
            if (user) {
                // User is signed in.
                isLogin = true;
                displayName = user.displayName;
                photoURL = user.photoURL;
                uid = user.uid;
            } else {
                isLogin = false;
                displayName = "";
                photoURL = "";
            }

            vapp.writeApp.isLogin = isLogin;
            vapp.writeApp.displayName = displayName;
            vapp.writeApp.photoURL = photoURL;
            vapp.writeApp.uid = uid;
        });
    };

    az.facebookLogout = function() {
        console.log('logout');
        firebase.auth().signOut().then(function() {

            vapp.writeApp.isLogin = false;
            vapp.writeApp.displayName = "";
            vapp.writeApp.photoURL = "";
            console.log('logout ok');

        }, function(error) {
            // An error happened.
            console.log (error);
        });
    };

    az.facebookLogin = function() {
        firebase.auth().signInWithPopup(provider).then(function(result) {
            // This gives you a Facebook Access Token. You can use it to access the Facebook API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;

            vapp.writeApp.isLogin = true;
            vapp.writeApp.displayName = user.displayName;
            vapp.writeApp.photoURL = user.photoURL;
            vapp.writeApp.uid = user.uid;

        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;

        });
    };

    az.writeNewPost = function (uid, username, word_name, word_body) {
        // A post entry.
        var postData = {
            author: username,
            uid: uid,
            word_body: word_body,
            word_name: word_name,
            right_count: 0,
            wrong_count: 0
        };

        // Get a key for a new Post.
        var newPostKey = firebase.database().ref().child('posts').push().key;

        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/posts/' + newPostKey] = postData;
        updates['/user-posts/' + uid + '/' + newPostKey] = postData;

        return firebase.database().ref().update(updates);
    };

})(window);


$( document ).ready( function() {

    var cardCount = new Vue({
        el: '#card-count',
        data: {
            count: 0
        }
    });

    var cardRow = new Vue({
        el: '#card-row',
        data: {
            items: []
        }
    });

    vapp.writeApp = new Vue({
        el: '#write_area',
        data: {
            isLogin: false,
            displayName: "",
            photoURL: "",
            uid: ""
        },
        methods: {
            logout: az.facebookLogout
        }
    });


    firebase.database().ref('/posts/').once('value').then(function(snapshot){
        var allCount = 0;
        if ( snapshot.val() ) {
            allCount = Object.keys(snapshot.val()).length;
            cardCount.count = allCount;
        }
    });

    function searchList( keyword ) {

        var searchOrder = firebase.database().ref('/posts/').orderByChild("word_name");
        if ( keyword && keyword !== "") {
            searchOrder = firebase.database().ref('/posts/').orderByChild("word_name").equalTo( keyword );
        }

        searchOrder.on('value', function(snapshot) {
            var results = snapshot.val();
            var items = [];

            if ( results ) {
                var keys = Object.keys(results);

                keys.forEach(function(key){
                    items.push({word_name: results[key].word_name, word_body: results[key].word_body});
                });
            }

            cardRow.items = items;
        });
    };

    // searchList("");

    az.getUserChanged();

    var searchApp = new Vue({
        el: "#search",
        data: {
            keyword: ""
        },
        methods: {
            search: function() {
                return searchList( this.keyword );
            }
        }
    });


    $( "#btnSave" ).click( function() {
        az.writeNewPost(vapp.writeApp.uid, vapp.writeApp.displayName, word_name, word_body);
    });

    $("#btnLogin").click( az.facebookLogin );

});

