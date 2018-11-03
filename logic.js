
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

    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        console.log("SIGN IN " + result)
        game.player1.name = result.user;
        // ...
    }).catch(function (error) {
        // Handle Errors here.
        console.log(error);
    });

    database = firebase.database();

    database.ref().on("value", function (snap) {

        console.log(snap.val().Users.PlayerOne) 
        game.player1.name = snap.val().Users.PlayerOne.name;
        console.log(game.player1.name)
        game.reset();
        if (snap.val().Users.PlayerTwo.hasChosen) {


        }


    });

    var game = {
        elements: {
            rock: "bg-primary",
            paper: "bg-danger",
            scissors: "bg-success",
            default: "bg-secondary"
        },
        playerDiv: $("#playerDiv"),
        opponentDiv: $("#opponentDiv"),
        winnerText: $("#winner"),
        playerHasChosen: false,
        opponentHasChosen: false,
        gameOver: false,
        player1: {
            name: "",
            choice: "",
            wins: 0,
            losses: 0,
            ties: 0
        },
        player2: {
            name: "CPU",
            choice: ""
        },

        reset() {
            $("#playerName").text(game.player1.name)
            game.player1.choice = "";
            game.playerHasChosen = false;
            game.opponentHasChosen = false;
            game.gameOver = false;
            game.winnerText.text("");
            game.playerDiv.removeClass("bg-primary bg-danger bg-success");
            game.playerDiv.addClass(game.elements.default);
            game.opponentDiv.removeClass("bg-primary bg-danger bg-success");
            game.opponentDiv.addClass(game.elements.default)
        },

        update(value) {
            if (!game.gameOver) {
                if (!game.playerHasChosen) {
                    console.log("Player 1 chose " + value)
                    game.playerDiv.removeClass("bg-secondary");
                    game.playerDiv.addClass(game.elements[value]);
                    game.player1.choice = value;
                    game.playerHasChosen = true;
                } else if (game.playerHasChosen && !game.opponentHasChosen) {
                    console.log("Player 2 chose " + value);
                    game.opponentDiv.removeClass("bg-secondary");
                    game.opponentDiv.addClass(game.elements[value]);
                    game.player2.choice = value;
                    game.opponentHasChosen = true;
                    setTimeout(game.update, 1000);
                } else if (game.playerHasChosen && game.opponentHasChosen) {
                    var result = game.calc(game.player1.choice, game.player2.choice)
                    game.gameOver = true;
                    console.log(result);
                    game.winnerText.text(result);
                    setTimeout(game.reset, 5000);
                }

            }

        },



        calc(playerChoice, opponentChoice) {


            var outcome = "DEFAULT";

            if (playerChoice == opponentChoice) {
                outcome = "Tie";
                game.player1.ties++;
            }

            switch (playerChoice) {
                case "rock":
                    switch (opponentChoice) {
                        case "paper":
                            outcome = game.player2.name;
                            game.player1.losses++;
                            break;
                        case "scissors":
                            outcome = game.player1.name;
                            game.player1.wins++;
                            break;
                    }
                    break;
                case "paper":
                    switch (opponentChoice) {
                        case "scissors":
                            outcome = game.player1.name;
                            game.player1.losses++;
                            break;
                        case "rock":
                            outcome = game.player1.name;
                            game.player1.wins++;
                            break;
                    }
                    break;
                case "scissors":
                    switch (opponentChoice) {
                        case "rock":
                            outcome = game.player2.name;
                            game.player1.losses++;
                            break;
                        case "paper":
                            outcome = game.player1.name;
                            game.player1.wins++;
                            break;
                    }
                    break;
                default:
                    outcome = "BLEP";
                    break;
            }

            return outcome;
        }


    }

    $(".element").click(function (e) {
        e.preventDefault();

        game.update($(this).attr("data-value"));
    });
        
});