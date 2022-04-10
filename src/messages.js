const messagesfr = {
  invalid_mode: "Coup invalide !",
  successors: "successeurs",
  invalid_pgn: "Fichier PGN invalide",
  loaded:
    " parties chargées. N'oubliez pas de mettre à jour le marque-page du navigateur !",
  others: "autres",
  and: "et",
  back: "Retour",
  reset: "Réinitialiser",
  switch: "Retourner",
  chess_com: "Voir la position sur chess.com",
  lichess_org: "Voir la position sur lichess.org",
  title: "Explorateur d'ouvertures d'échecs",
  pgnuploadlink: "Charger un fichier PGN",
  pgndownloadlink: "Télécharger le PGN courant",
  white_to_play: "Trait aux blancs",
  black_to_play: "Trait aux noirs",
  help_text: `<p>Cet outil fournit un moyen simple de naviguer dans un répertoire personnel d'ouverture d'échecs.</p>

    <p> Mode d'emploi : 
      <ul>
        <li>Créer un fichier PGN avec une partie par ouverture. Vous pouvez ajouter des commentaires entre {} après les coups. Le titre de l'ouverture doit être dans le header Event. Vous pouvez cliquer sur "Télécharger le PGN courant" pour récupérer le fichier d'exemple.</li>
        <li>Le plus simple pour créer le PGN est d'utiliser les explorateurs de <a href="https://www.chess.com/explorer" target="blank_">chess.com</a> ou de <a href="https://lichess.org/analysis#explorer" target="blank_">lichess.org</a>.</li>
        <li>Charger votre fichier avec le bouton "Charger un nouveau fichier PGN". Vous pouvez alors naviguer dans les ouvertures à l'aide des boutons à droite de l'échiquier.</li>                
        <li>Vous pouvez ensuite créer un signet de l'adresse mise à jour après le chargement pour accéder directement au fichier sans avoir à le charger à chaque fois.</li>        
      </ul>
    </p>


    <p>Le code est entièrement exécuté dans le navigateur, le fichier PGN n'est pas envoyé au serveur et n'est pas collecté. Vous pouvez consulter le code sur <a href="https://github.com/tiboroche/chessopeningsbrowser" target="_blank">Github.</a></p>    
    `,
    errors_found: "Les erreurs suivantes ont été trouvées dans le fichier PGN : "
};

const messagesen = {
  invalid_mode: "Invalid move !",
  successors: "successors",
  invalid_pgn: "Invalid PGN file",
  loaded: " games loaded. Don't forget to bookmark the updated link !",
  others: "others",
  and: "and",
  back: "Back",
  reset: "Reset",
  switch: "Switch",
  chess_com: "See on chess.com",
  lichess_org: "See on lichess.org",
  title: "CHess Openings Browser",
  pgnuploadlink: "Upload new PGN file",
  pgndownloadlink: "Download current PGN file",
  white_to_play: "White to play",
  black_to_play: "Black to play",
  help_text: `      <p>This tool is meant to be a simple way to explore a custom repository of openings.</p>

  <p> How to use : 
    <ul>
      <li>Create a PGN file with one game per opening you want to add. You can add comments between {} after the moves. The title of the opening must be in the Event header. You can click the "Download current PGN file" to get an example.</li>
      <li>The simplest way to get the PGN is to use the explorers from <a href="https://www.chess.com/explorer" target="blank_">chess.com</a> or <a href="https://lichess.org/analysis#explorer" target="blank_">lichess.org</a>.</li>

      <li>Upload your file using the "Upload new PGN file" button. You can then explore your openings with the buttons on the right of the chessboard.</li>
      <li>You can bookmark the URI after your upload to access your file directly without uploading it everytime.</li>
    </ul>
  </p>

  <p>All the code is ran on the browser, the PGN file is not sent back to the server and not collected. You can check the code on <a href="https://github.com/tiboroche/chessopeningsbrowser" target="_blank">Github.</a></p>

    `,
    errors_found: "The following errors have been found in the PGN file : "
};

export const messages = { fr: messagesfr, en: messagesen };
