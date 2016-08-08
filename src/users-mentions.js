(function($, _, undefined) {

  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g,
    variable    : "rc"
  };


  function UserMentions(settup, $field) {
    this.$wrapper = $("<div class='user-mention-wrapper'></div>");
    this.settup = settup;
    this.$field = $field;

    this.$field.wrap(this.$wrapper);
    this.$field.on('input', this.userInputEvent.bind(this));
  }


  UserMentions.prototype.userInputEvent = function userInputEvent(evt) {
    var hasMention = this.verifyIfHasMention();

    if (hasMention) {
      this.searchForMentions(this.getCurrentMention());
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


  UserMentions.prototype.searchForMentions = function searchForMentions(currentMention) {
    if (_.isFunction(this.settup.getMentionsData)) {
      this.settup.getMentionsData(currentMention, this.populateUserList.bind(this));
    }
  }


  UserMentions.prototype.populateUserList = function populateUserList(userList) {
    this.settup.userList = userList;

    this.displayUserSelection();
  }


  UserMentions.prototype.displayUserSelection = function displayUserSelection() {
    if ($(".user-mention-list").length === 1) {
      $(".user-mention-list").remove();
    }

    var listTemplate = this.buildTemplates();

    this.$field.after(listTemplate);
    this.$field.off('keyup');
    this.$field.on('keyup', this.fieldKeyUpEvent.bind(this));
  }


  UserMentions.prototype.buildTemplates = function buildTemplates() {
    var userListTemplate = this.settup.templates.userList({
      userList: this.settup.userList
    });

    var containerTemplate = this.settup.templates.container({
      userListTemplate: userListTemplate
    });

    return containerTemplate;
  }


  UserMentions.prototype.fieldKeyUpEvent = function fieldKeyUpEvent(evt) {
    if (evt.keyCode === 40 || evt.keyCode === 38) {
      this.$field.blur();

      window.removeEventListener('keyup', this.listKeyUpEvent.bind(this));
      window.addEventListener('keyup', this.listKeyUpEvent.bind(this));
    }
  }


  UserMentions.prototype.listKeyUpEvent = function listKeyUpEvent(evt) {
    
  }


  $.fn.userMentions = function userMentions(settup) {
    _.defaults(settup, {
      userList: [],
      getMentionsData: null,
      searchPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
      triggerChar: '@',
      lengthStartSearch: 3,
      templates: {
        container: _.template("<div class='user-mention-list'><%= rc.userListTemplate %></div>"),
        userList: _.template("<ul><% _.forEach(rc.userList, function(user) { %>" +
                                "<li><%= user.slug %></li>" +
                             "<% }); %></ul>")
      }
    });

    var userMentions = new UserMentions(settup, this);

    return this;
  }
}) (jQuery, _.runInContext());
