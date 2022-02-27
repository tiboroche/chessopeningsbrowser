module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      },
    },
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: 'node_modules/',
          src: [ 'chess.js/chess.js', '@chrisoakman/chessboardjs/dist/*.min.*'],
          dest: 'dist/',
          flatten: true
        },{
          expand: true,
          src: 'build/<%= pkg.name %>.min.js',
          dest: 'dist/'
        } ]
      } 
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['copy', 'uglify']);

};