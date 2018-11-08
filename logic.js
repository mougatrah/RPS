
$(document).ready(function () {

    var config = {
        apiKey: "AIzaSyDm8cfSHDjdhjYkxO77oQqOM9RNxvZ1eVg",
        authDomain: "rpsgame-47199.firebaseapp.com",
        databaseURL: "https://rpsgame-47199.firebaseio.com",
        projectId: "rpsgame-47199",
        storageBucket: "rpsgame-47199.appspot.com",
        messagingSenderId: "979956531596"
    };
    firebase.initializeApp(config);


    database = firebase.database();

    var game = {
        elements: {
            rock: "bg-primary",
            paper: "bg-danger",
            scissors: "bg-success",
            default: "bg-secondary"
        },
        playerId: "",
        opponentId: "",
        sessionJoined: false,
        playerDiv: $("#playerDiv"),
        opponentDiv: $("#opponentDiv"),
        winnerText: $("#winner"),
        playerHasChosen: false,
        opponentHasChosen: false,
        gameOver: false,
        playerChoice: "",
        opponentChoice: "",
        wins: 0,
        losses: 0,
        ties: 0,

        reset() {

            console.log("resetting");

            game.playerChoice = "";
            game.playerHasChosen = false;
            game.opponentHasChosen = false;
            
            connectionsRef.child(game.playerId).update({
                choice: game.playerChoice,
                hasChosen: game.playerHasChosen,
                inSession: game.sessionJoined
            })

            game.gameOver = false;

            game.winnerText.text("");
            game.playerDiv.removeClass("bg-primary bg-danger bg-success");
            game.playerDiv.addClass(game.elements.default);
            game.opponentDiv.removeClass("bg-primary bg-danger bg-success");
            game.opponentDiv.addClass(game.elements.default)

        }, 


        update(value) {


            if (!game.gameOver && game.sessionJoined && !game.playerHasChosen) {

                game.playerChoice = value;
                game.playerHasChosen = true;
                game.playerDiv.removeClass("bg-primary bg-danger bg-success bg-secondary");
                game.playerDiv.addClass(game.elements[value]);
              
                console.log("You chose: "+ value);
                
                connectionsRef.child(this.playerId).update({
                    choice: game.playerChoice,
                    hasChosen: game.playerHasChosen
                });
                if(!game.opponentHasChosen){
                    console.log("Waiting for opponent's choice");
                }else{
                    game.calc();
                }
                
               

            }

        },

        calc() {
            if (game.playerHasChosen && game.opponentHasChosen) {

                console.log("Calculating");
                var outcome = "DEFAULT";
                connectionsRef.child(game.opponentId).once("value", function(snap){
                    game.opponentChoice = snap.val().choice;
                })

                game.opponentDiv.removeClass("bg-primary bg-danger bg-success bg-secondary");
                game.opponentDiv.addClass(game.elements[game.opponentChoice])
    
                if (game.playerChoice == game.opponentChoice) {
                    outcome = "Tie";
                    game.ties++;
                } else {

                    switch (game.playerChoice) {
                        case "rock":
                            switch (game.opponentChoice) {
                                case "paper":
                                    outcome = "You Lost";
                                    game.losses++;
                                    break;
                                case "scissors":
                                    outcome = "You Won";
                                    game.wins++;
                                    break;
                            }
                            break;
                        case "paper":
                            switch (game.opponentChoice) {
                                case "scissors":
                                    outcome = "You Lost";
                                    game.losses++;
                                    break;
                                case "rock":
                                    outcome = "You Won";
                                    game.wins++;
                                    break;
                            }
                            break;
                        case "scissors":
                            switch (game.opponentChoice) {
                                case "rock":
                                    outcome = "You Lost";;
                                    game.losses++;
                                    break;
                                case "paper":
                                    outcome = "You Won";
                                    game.wins++;
                                    break;
                            }
                            break;
                        default:
                            outcome = "BLEP";
                            break;
                    }

                }
                console.log("Results: " + outcome);
                $("#winner").text(outcome);
                game.gameOver = true;
                setTimeout(game.reset, 7000);
             
            }
        }
    }


    // connectionsRef references a specific location in our database.
    // All of our connections will be stored in this directory.
    // '.info/connected' is a special location provided by Firebase that is updated   
    // the client's connection state changes.
    // '.info/connected' is a boolean value, true if the client is connected and false if they are not.
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");
   
    // When the client's connection state changes...
    connectedRef.on("value", function (snap) {

        // If they are connected..
        if (snap.val()) {

            // Add user to the connections list.
            var con = connectionsRef.push({
                inSession: false,
                hasChosen: false,
                choice: ""
            });

            // Remove user from the connection list when they disconnect.
            con.onDisconnect().remove();

            console.log("You connected. Player Id: " + con.key);
            game.playerId = con.key;

        }
    });

    connectionsRef.on("value", function (snap) {
        if (game.sessionJoined == false) {
            var result;
            console.log("Searching for opponent");

            snap.forEach(function (childsnap) {
                if (childsnap.val().inSession == false && game.playerId != childsnap.key) {
                    result = childsnap.key;
                    return true;
                }
            });

            if (result != undefined) {
                console.log("Session joined. Opponent: " + result);
                game.opponentId = result;
                game.sessionJoined = true;

                connectionsRef.child(game.playerId).update({
                    inSession: game.sessionJoined
                });

                connectionsRef.child(result).on("value", function (snap) {
                    if (snap.val()) {

                        game.opponentHasChosen = snap.val().hasChosen;
                        if (game.opponentHasChosen) {
                            console.log("Opponent has chosen.");
                            if(!game.playerHasChosen){
                                console.log("Please make a choice.")
                            }else{
                                game.calc();
                            }
                        }
                    } else {

                        game.opponentId = "";
                        game.sessionJoined = false;
                        connectionsRef.child(game.playerId).update({
                            inSession: game.sessionJoined
                        })
                       
                        console.log("Opponent has disconnected");
                        game.reset();
                    }
                });

            } else {
                console.log("No opponent found.");
            }

        }
        // Display the viewer count in the htm  l.
        // The number of online users is the number of children in the connections list.
        //   $("#watchers").text(snap.numChildren());
    });






    $(".element").click(function (e) {
        e.preventDefault();

        game.update($(this).attr("data-value"));
    });

});