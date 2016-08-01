(function($, _, undefined) {

  function UserMentions(settup, $field) {
    this.settup = settup;
    this.$field = $field;

    this.$field.on('keyup', this.keyupEvent.bind(this));
  }


  UserMentions.prototype.keyupEvent = function keyupEvent(evt) {
    var hasMention = this.searchForMention();

    console.log(hasMention);
  }


  UserMentions.prototype.searchForMention = function searchForMention() {
    var found = false;
    var currentText = this.$field.val();
    var cursorPosition = this.$field.prop("selectionStart");
    var triggerPosition = currentText.lastIndexOf(this.settup.triggerChar, cursorPosition);

    // if there is a trigger and cursor is on valid position
    if (triggerPosition !== -1 && (currentText.charAt(cursorPosition-1) !== ' ')) {
      var possibleMention = currentText.slice(triggerPosition+1, cursorPosition);
      var searchRegex = new RegExp(this.settup.searchPattern, 'g');

      if (possibleMention.length >= this.settup.lengthStartSearch) {
        found = searchRegex.test(possibleMention);
      }
    }

    return found;
  }

  $.fn.userMentions = function userMentions(settup) {
    _.defaults(settup, {
      source: [],
      searchPattern: "([a-z]|-)+", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
      triggerChar: '@',
      lengthStartSearch: 3
    });

    var userMentions = new UserMentions(settup, this);

    return this;
  }
}) (jQuery, _.runInContext());
