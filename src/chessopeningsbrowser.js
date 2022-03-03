/* eslint-disable require-jsdoc */
import { Chessboard, MARKER_TYPE, COLOR } from "./Chessboard.js";

const CHESS_COM_URI = "https://chess.com/explorer?moveList=";

const DEFAULT = `
[Event "Italian"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 {Giuoco Piano} *

[Event "Ruy-Lopez"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 *

[Event "Queen Gambit accepted"]

1. d4 d5 2. c4 dxc4 3. Qa4+ *
`;

const WHITE_LETTERS = {
  K: "k",
  Q: "q",
  B: "b",
  N: "h",
  R: "r",
};

const BLACK_LETTERS = {
  K: "l",
  Q: "w",
  B: "n",
  N: "j",
  R: "t",
};

let currentTree = undefined;

// functions related to the board display
const Board = class Board {
  constructor(chess) {
    this.board = new Chessboard(document.getElementById("board1"), {
      position: "start",
    });
    this.chess = chess;
  }

  reset() {
    this.board.removeMarkers();
    this.board.setPosition("start");
  }

  switch() {
    if (this.board.getOrientation() == COLOR.white) {
      this.board.setOrientation(COLOR.black);
    } else {
      this.board.setOrientation(COLOR.white);
    }
  }

  setPosition(fen) {
    this.board.removeMarkers();
    this.board.setPosition(fen);
  }

  markmove(chessmove) {
    this.board.removeMarkers();
    this.board.addMarker(chessmove["from"], MARKER_TYPE.frame);
    this.board.addMarker(chessmove["to"], MARKER_TYPE.frame);
  }

  move(move) {
    const chessmove = this.chess.move(move.san);

    move.chessmove = chessmove;

    debug("Making move", move.san, this.chess.ascii(), chessmove);
    if (chessmove) {
      this.markmove(chessmove);
      return this.board.movePiece(chessmove["from"], chessmove["to"]);
    } else {
      alert("Invalid move !");
    }
  }

  destroy() {
    this.board.destroy();
  }
};

const Move = class Move {
  san; // the san coordinate of the move
  comment;
  predecessor;
  openings;
  successors;
  chessmove;

  constructor(san) {
    this.san = san;
    this.openings = [];
    this.successors = [];
  }

  toString() {
    return this.san + " (" + this.successors.length + "successors )";
  }

  onlysuccessor() {
    if (this.successors.length == 1) {
      return this.successors[0];
    } else {
      return undefined;
    }
  }
};

const OpeningTree = class OpeningTree {
  currentMove;
  startMove;
  chess;

  constructor(content, updateuri) {
    this.content = content;
    this.startMove = new Move("");
    this.currentMove = this.startMove;
    this.chess = new Chess();
    this.board = new Board(this.chess);

    this.inittree(this.load());

    if (updateuri) {
      this.updateuri();
    }

    // make the first move if only one
    const onlysucc = this.currentMove.onlysuccessor();
    if (onlysucc) {
      this.makemove(onlysucc);
    } else {
      this.displaymoves();
    }
  }

  load() {
    let games = [];

    // add missing if needed
    let newcontent = "";
    this.content.split(/\r?\n/).forEach(function (line){
      line = line.trim();
      newcontent += line;
      if (line.startsWith("1.") && ! line.endsWith("*")){
        newcontent += " *";
      }
      newcontent += "\n";
    })

    debug("Reading PGN ", newcontent);

    try {
      games = pgnParser.parse(newcontent);
    } catch {
      alert("Invalid PGN file");
    }

    // debug("games loaded", JSON.stringify(games));
    log(`Loaded ${games.length} games.`);

    return games;
  }

  updateuri() {
    let url = window.location.origin + window.location.pathname;

    url += "?content=" + LZString.compressToEncodedURIComponent(this.content);

    window.history.pushState(undefined, "", url);
  }

  inittree(games) {
    let gamename;
    const start = this.startMove;
    games.forEach(function (game) {
      // get the name of the game, the Event header
      for (let i = 0; i < game["headers"].length; i++) {
        const header = game["headers"][i];
        if (header["name"] === "Event") {
          gamename = header["value"];
          break;
        }
      }

      let curMove = start;
      game.moves.forEach(function (move) {
        let found = false;
        for (let j = 0; j < curMove.successors.length; j++) {
          const next = curMove.successors[j];
          if (next.san === move["move"]) {
            // found !
            curMove = next;
            found = true;
            break;
          }
        }
        // not found create a new node
        if (!found) {
          const next = new Move(move["move"]);
          curMove.successors.push(next);
          next.predecessor = curMove;
          // debug("New move from", JSON.stringify(move), curMove, next);
          curMove = next;
        }

        curMove.openings.push(gamename);
        const comments = move["comments"];
        if (comments && comments.length > 0) {
          curMove.comment = comments[0]["text"];
        }
      });
    });
  }

  history(move = this.currentMove) {
    const pastmoves = [];
    let past = move;

    while (past.predecessor) {
      pastmoves.unshift(past);
      past = past.predecessor;
    }

    return pastmoves;
  }

  santohtml(move, white, openings= false) {
    // check the first letter for a piece
    let html = "";
    let san = move.san;
    const letters = white ? WHITE_LETTERS : BLACK_LETTERS;
    const pieceletter = letters[san[0]];

    if (pieceletter) {
      html += `<span style="font-family: chessregular;">${pieceletter}</span>`;
      san = san.slice(1);
    }

    html += `<b>${san}`;

    if ( openings ){
      if (move.openings.length == 1) {
        html += " [" + move.openings.join(",") + "]";
      } else {
        html +=
          " [" +
          move.openings[0] +
          " and " +
          (move.openings.length - 1) +
          " others]";
      }  
    }

    html += `</b>`;

    if (move.comment) {
      html += ` <i>${move.comment}</i>`;
    }

    return html;
  }

  showbreadcrumb(movelist) {
    $("#breadcrumb").empty();

    const p = $(`<p>&nbsp;</p>`).appendTo($("#breadcrumb"));

    for (let i = 0; i < movelist.length; i++) {
      const white = i % 2 === 0;
      let breadcrumb = "";
      if (white) {
        // white turn
        breadcrumb += `${i / 2 + 1}.`;
      }
      breadcrumb += ` ${this.santohtml(movelist[i], white)} `;

      $(`<span role="button">${breadcrumb}</a>`)
        .appendTo(p)
        .on("click", () => {
          this.backtomove(movelist[i]);
        });
    }
  }

  displaymoves() {
    const pastmoves = this.history();
    const white = pastmoves.length % 2 == 0;

    const movesdiv = $("#moves");

    this.showbreadcrumb(pastmoves);
    movesdiv.empty();
    $("#toplay").empty();

    if (white) {
      $(`<p>White to play</p>`).appendTo($("#toplay"));
    } else {
      $(`<p>Black to play</p>`).appendTo($("#toplay"));
    }

    const buttonsclass = "btn btn-small btn-block";

    const buttonscolorclass = (white ? "btn-outline-secondary" : "btn-outline-dark") + " m-1";
    const otherbuttonscss = "btn-secondary m-1";
    const chessbuttonscolorclass = "btn-success m-1";

    const topbuttons = $(
      '<div class="btn-group btn-group-sm" role="group" ></div>'
    ).appendTo(movesdiv);

    const button = (to, text, cssclass, clickHandler) => {
      $(`<button class="${buttonsclass} ${cssclass}">${text}</button>`)
        .appendTo(to)
        .on("click", clickHandler);
    };

    button(topbuttons, "Back", otherbuttonscss, () => {
      this.backonemove();
    });
    button(topbuttons, "Reset", otherbuttonscss, () => {
      this.resetboard();
    });
    button(topbuttons, "Switch", otherbuttonscss, () => {
      this.switchboard();
    });

    this.currentMove.successors.forEach((move) => {
      button($("#moves"), this.santohtml(move, white, true), buttonscolorclass, () => {
        currentTree.makemove(move);
      });
    });

    button(movesdiv, "See on chess.com", chessbuttonscolorclass, () => {            
      window.open(CHESS_COM_URI + this.history().map(move => move.san).join("+"), '_blank').focus();
    });
  }

  backonemove() {
    this.backtomove(this.currentMove.predecessor);
  }

  backtomove(move) {
    while (this.currentMove != move && this.currentMove.predecessor) {
      this.currentMove = this.currentMove.predecessor;
      this.chess.undo();
    }

    this.board.setPosition(this.chess.fen());
    if (this.currentMove.chessmove) {
      this.board.markmove(this.currentMove.chessmove);
    }
    this.displaymoves();
  }

  resetboard() {
    this.chess.reset();
    this.currentMove = this.startMove;
    this.board.reset();
    this.displaymoves();
  }

  switchboard() {
    this.board.switch();
  }

  async makemove(nextmove) {
    let candidate = nextmove;

    while (true) {
      await this.board.move(candidate);
      const next = candidate.onlysuccessor();

      if (next) {
        this.showbreadcrumb(this.history(candidate));
        await sleep(100);
        candidate = next;
      } else {
        break;
      }
    }

    this.currentMove = candidate;
    this.displaymoves();
    return;
  }
};

// ========================================
// Helper functions
const __log = function (level, strings) {
  console.log("[" + level + "] " + strings.join(" / "));
};

const log = function (...args) {
  __log("INFO", args);
};

const debug = function (...args) {
  __log("DEBUG", args);
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const readOneFile = function (e, readerfunction) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }

  log("Reading file " + file.name);
  const reader = new FileReader();
  reader.onload = function (e) {
    const contents = e.target.result;
    readerfunction(contents);
  };
  reader.readAsText(file);
};

const parsePGNfile = (content, updateuri = true) => {
  if (currentTree) {
    currentTree.board.destroy();
  }
  currentTree = new OpeningTree(content, updateuri);
};

// ========================================
// DOM interactions
$(document).on("change", "#pgnupload", function (e) {
  readOneFile(e, parsePGNfile);
  $("#pgnupload").value = null;
});

$("#pgndownloadlink").on("click", function(){
  const blob = new Blob([currentTree.content], {type: "application/vnd.chess-pgn, application/x-chess-pgn"});
  saveAs(blob, "openings.pgn");
});

$("#pgnuploadlink").on("click", function () {
  $("#pgnupload").trigger("click");
});

const loadfromuri = () => {
  // load the content from the uri
  const urlParams = new URLSearchParams(window.location.search);

  const content = urlParams.get("content");

  if (content) {
    const uncompressed = LZString.decompressFromEncodedURIComponent(content);
    if (uncompressed) {
      parsePGNfile(uncompressed);
      return;
    }
  }
    
  parsePGNfile(DEFAULT, false);  
};

loadfromuri();
