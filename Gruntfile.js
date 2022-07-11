module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    uglify: {
      pkg: {
        options: {
          // eslint-disable-next-line max-len
          banner:
            '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        },
        src: "src/<%= pkg.name %>.js",
        dest: "build/<%= pkg.name %>.min.js",
      },
      chess: {
        src: "node_modules/chess.js/chess.js",
        dest: "build/chess.min.js",
      },
      lzstring: {
        src: "node_modules/lz-string/libs/lz-string.js",
        dest: "build/lz-string.min.js",
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: "node_modules/",
            src: ["jquery/dist/jquery.min.js", "file-saver/dist/*.min.js*", "pgn-parser/dist/*"],
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            cwd: "node_modules/",
            src: ["chessground/dist/*.min.js"],
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            src: "resources/*",
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            src: "flags/*",
            dest: "dist/",
          },
          {
            expand: true,
            src: ["build/*.min.js", "bootstrap/*.min.js"],
            // src: "src/<%= pkg.name %>.js",
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            src: ["src/index.html", "src/messages.js"],
            dest: "dist/",
            flatten: true,
          },
          {
            expand: true,
            src: "bootstrap/bootstrap.min.css",
            dest: "dist/assets/",
            flatten: true,
          },
          {
            expand: true,
            cwd: "node_modules/chessground",
            src: "assets/**",
            dest: "dist/",
          },
        ],
      },
    },
    clean: ["dist/"],
    shell: {
      insert_ga: {
        command:
          'sed -e "/<!--____GOOGLE_ANALYTICS____-->/{" -e "r./ga.js" -e "d" -e "}" -i dist/index.html',
      },
      insert_version: {
        command:
        'sed -e "s/__VERSION__/$(date +"%y%m%d%H%M%S")/" -i dist/index.html',
      }
    },
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-shell");

  // Default task(s).
  if (process.platform == "linux") {
    grunt.registerTask("default", [
      "clean",
      "uglify",
      "copy",
      "shell:insert_ga",
      "shell:insert_version",
    ]);
  } else {
    grunt.registerTask("default", ["clean", "uglify", "copy"]);
  }
};
