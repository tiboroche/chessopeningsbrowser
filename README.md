# chessopeningsbrowser

## Introduction

A simple web interface to browse a custom repository of Chess openings. It is nothing fancy, it is just meant to be simple and accessible.

This tool can be used freely at https://chess.diwi.org

The code uses the following JS libraries : 
* [chess.js](https://github.com/jhlywa/chess.js/)
* [cm-chessboard](https://github.com/shaack/cm-chessboard)
* [FileSave.js](https://github.com/eligrey/FileSaver.js/)
* [lz-string](https://github.com/pieroxy/lz-string/)
* [pgn-parser](https://github.com/kevinludwig/pgn-parser)

And the frameworks [jQuery](https://jquery.com/) and [Bootstrap](https://getbootstrap.com/)

## Installation

If you want to run it on your computer or server, just clone the repository and run : 
```
npm install --include=dev
grunt
python3 -m http.server 8080
```
And access the http://localhost:8080/dist

## Bug / change requests / questions

You can contact me through GitHub
