(function($, _, undefined) {

  function UserMentions(settup, $field) {
    this.settup = settup;
    this.$field = $field;

    this.$field.on('keyup', this.keyupEvent.bind(this));
  }


  UserMentions.prototype.keyupEvent = function keyupEvent(evt) {
    var hasMention = this.verifyIfHasMention();

    if (hasMention) {
      console.log(this.getCurrentMention());
    }
  }


  UserMentions.prototype.verifyIfHasMention = function verifyIfHasMention() {
    var found = false;
    var searchRegex = new RegExp(this.settup.searchPattern, 'g');
    var possibleMention = this.getCurrentMention();

    if (possibleMention.length >= this.settup.lengthStartSearch) {
      found = searchRegex.test(possibleMention);
    }

    return found;
  }


  UserMentions.prototype.getCurrentMention = function getCurrentMention() {
    var currentText = this.$field.val();
    var cursorPosition = this.$field.prop("selectionStart");
    var triggerPosition = currentText.lastIndexOf(this.settup.triggerChar, cursorPosition);
    var currentMention = "";

    // if there is a trigger and cursor is on valid position
    if (triggerPosition !== -1 && (currentText.charAt(cursorPosition-1) !== ' ')) {
      currentMention = currentText.slice(triggerPosition+1, cursorPosition);
    }

    return currentMention;
  }


  $.fn.userMentions = function userMentions(settup) {
    _.defaults(settup, {
      source: [],
      searchPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
      triggerChar: '@',
      lengthStartSearch: 3
    });

    var userMentions = new UserMentions(settup, this);

    return this;
  }
}) (jQuery, _.runInContext());
