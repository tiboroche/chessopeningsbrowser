(function () {
  "use strict";

  // the main board
  // eslint-disable-next-line new-cap
  const board = Chessboard("board1", "start");

  // load the openings structure
  const OpeningTree = function (content) {
    // console.log("coucou" + content);

    const load = function (content) {
      const games = [];
      let currentGame = "";

      content.split(/\r?\n/).forEach(function (line) {
        if (currentGame === "") {
          currentGame += line + "\n";
        } else if (line.startsWith("[Event")) {
          const cg = new Chess();
          cg.load_pgn(currentGame);
          games.push(cg);
          currentGame = line + "\n";
        } else {
          currentGame += line + "\n";
        }
      });

      games.forEach((game) => console.log("Game : " + game.history() + " / " + game.get_comments()));
    };

    load(content);
  };

  // display the buttons

  let currentTree = undefined;

  ///////////////////////////////////////////
  // Helper functions
  const readOneFile = function (e, readerfunction) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    console.log("Reading file " + file);
    const reader = new FileReader();
    reader.onload = function (e) {
      const contents = e.target.result;
      readerfunction(contents);
    };
    reader.readAsText(file);
  };

  const parsePGNfile = function (content) {
    currentTree = new OpeningTree(content);
  };

  ///////////////////////////////////////////
  // DOM interactions
  $(document).on("input", "#file-input", function (e) {
    readOneFile(e, parsePGNfile);
  });
})();
