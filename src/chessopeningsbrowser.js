/* eslint-disable require-jsdoc */
import { Chessboard, MARKER_TYPE } from "./Chessboard.js";

const DEFAULT = `
  [Event "Italian"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 {"Giuoco Piano"} *

[Event "Ruy-Lopez"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 b5 5. Bb3 *
  `;

const WHITE_LETTERS = {
  K: "K",
  Q: "Q",
  B: "B",
  N: "N",
  R: "R",
};

const BLACK_LETTERS = {
  K: "L",
  Q: "W",
  B: "V",
  N: "M",
  R: "T",
};

// the main board
let currentTree = undefined;

// functions related to the board display
const Board = class Board {
  constructor(chess) {
    // eslint-disable-next-line new-cap
    // this.board = Chessboard("board1", "start");
    this.board = new Chessboard(document.getElementById("board1"), {
      position: "start",
    });
    this.chess = chess;
  }

  reset() {
    // reset to default position
    // TODO
  }

  move(san) {
    const move = this.chess.move(san);
    if (move) {
      this.board.removeMarkers();
      this.board.addMarker(move["from"], MARKER_TYPE.frame);
      this.board.addMarker(move["to"], MARKER_TYPE.frame);
      this.board.movePiece(move["from"], move["to"]);
    } else {
      alert("Invalid move !");
    }
    // this.board.setPosition(this.chess.fen());
  }
};

const Move = class Move {
  san; // the san coordinate of the move
  comment;
  predecessor;
  openings;
  successors;

  constructor(san) {
    this.san = san;
    this.openings = [];
    this.successors = [];
  }

  toString() {
    return this.san + " (" + this.successors.length + "successors )";
  }

  linktext() {
    let text = this.san;
    if (this.openings.length == 1) {
      text += " [" + this.openings.join(",") + "]";
    } else {
      text +=
        " [" +
        this.openings[0] +
        " and " +
        (this.openings.length - 1) +
        " others]";
    }
    if (this.comment) {
      text += " " + this.comment;
    }
    return text;
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

  constructor(content) {
    this.content = content;
    this.startMove = new Move("");
    this.currentMove = this.startMove;
    this.chess = new Chess();
    this.board = new Board(this.chess);

    this.inittree(this.load());

    this.updateuri();

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
    try {
      games = pgnParser.parse(this.content);
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

  santohtml(move, white) {
    // https://github.com/joshwalters/open-chess-font
    // check the first letter for a piece
    //
    let html = "";
    let san = move.san;
    const letters = white ? WHITE_LETTERS : BLACK_LETTERS;
    const pieceletter = letters[san[0]];

    if (pieceletter) {
      html += `<span style="font-family: openchessfontregular;">${pieceletter}</span>`;
      san = san.slice(1);
    }

    html += `<b>${san}</b>`;

    if (move.comment) {
      html += `<i>${move.comment}</i>`;
    }

    return html;
  }

  showbreadcrumb(movelist) {    
    let breadcrumb = "";

    for (let i = 0; i < movelist.length; i++) {
      const white = i % 2;
      if (white === 0) {
        // white turn
        breadcrumb += `${i / 2 + 1}.`;
      }
      breadcrumb += ` ${this.santohtml(movelist[i], white)} `;
    }

    $("#breadcrumb").empty();
    $(`<p>${breadcrumb}</p>`).appendTo($("#breadcrumb"));
  }

  displaymoves() {
    const pastmoves = this.history();
    const white = pastmoves.length % 2 == 0;

    this.showbreadcrumb(pastmoves);
    $("#moves").empty();
    $("#toplay").empty();

    if (white) {
      $(`<p>White to play</p>`).appendTo($("#toplay"));
    } else {
      $(`<p>Black to play</p>`).appendTo($("#toplay"));
    }

    const buttonsclass = "m-1 btn btn-small btn-block";

    const buttonscolorclass = white ? "btn-light" : "btn-dark";

    this.currentMove.successors.forEach(function (move) {
      $(
        `<button class="${buttonsclass} ${buttonscolorclass}">${move.linktext()}</button>`
      )
        .appendTo($("#moves"))
        .on("click", function () {
          currentTree.makemove(move);
        });
      // $(`<a class=\"primary-link\" href=\"#\">${move.linktext()}</a>`).appendTo($("#moves")).on("click", function() {currentTree.makemove(move.san);});
    });
  }

  async makemove(nextmove) {
    let candidate = nextmove;

    while (true) {
      await this.board.move(candidate.san);
      const next = candidate.onlysuccessor();

      if (next) {
        this.showbreadcrumb(this.history(candidate));
        await sleep(300);
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

const parsePGNfile = (content) => {
  currentTree = new OpeningTree(content);
};

// ========================================
// DOM interactions
$(document).on("change", "#pgnupload", function (e) {
  readOneFile(e, parsePGNfile);
  $("#pgnupload").value = null;
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
    }
  } else {
    parsePGNfile(DEFAULT);
  }
};

loadfromuri();
