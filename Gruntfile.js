module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    uglify: {
      options: {
        // eslint-disable-next-line max-len
        banner:
          '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
      },
      build: {
        src: "src/<%= pkg.name %>.js",
        dest: "build/<%= pkg.name %>.min.js",
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: "node_modules/",
            src: [
              "chess.js/chess.js",
              "@chrisoakman/chessboardjs/dist/*.min.*",
              "jquery/dist/jquery.min.js",
              "pgn-parser/dist/pgn-parser.js",
              "pgn-parser/dist/pgn-parser.js.map",
            ],
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            // src: "build/<%= pkg.name %>.min.js",
            src: "src/<%= pkg.name %>.js",
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            src: "src/index.html",
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            src: "img/**",
            dest: "dist",
          },
        ],
      },
    },
    clean: ["dist/"],
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-clean");

  // Default task(s).
  //grunt.registerTask("default", ["clean", "copy", "uglify"]);
  grunt.registerTask("default", ["clean", "copy"]);
};
