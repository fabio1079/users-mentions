(function(_, undefined) {
  "use strict";

  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g,
    variable    : "rc"
  };


  function UserMentions(settup, field) {
    var wrapper = document.createElement("div");
    wrapper.classList.add("users-mention-wrapper");

    field.parentNode.insertBefore(wrapper, field);
    wrapper.appendChild(field);

    this.settup = this.prepareSettup(settup);
    this.field = field;
    this.wrapper = wrapper;

    this.field.addEventListener("input", this.userInputEvent.bind(this), false);
  }


  UserMentions.prototype.prepareSettup = function prepareSettup(settup) {
    /*
    if (typeof(settup) !== "object") {
      settup = {};
    }

    settup.userList = settup.userList || [];
    settup.getMentionsData = settup.getMentionsData || null;
    // by default it uses the slug pattern, EX: Hey @mary-jane look here !
    settup.searchPattern = settup.searchPattern || "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    settup.triggerChar = settup.triggerChar || '@';
    settup.lengthStartSearch = settup.lengthStartSearch || 3;
    settup.templates
*/
    _.defaults(settup, {
      requestUrl: "",
      userList: [],
      getMentionsData: null,
      searchPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
      triggerChar: '@',
      lengthStartSearch: 3,
      templates: {
        container: _.template("<div class='users-mention-list'><%= rc.userListTemplate %></div>"),
        userList: _.template("<ul><% _.forEach(rc.userList, function(user) { %>" +
                                "<li><%= user.slug %></li>" +
                             "<% }); %></ul>")
      }
    });

    return settup;
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
    var currentText = this.field.value;
    var cursorPosition = this.field.selectionStart;
    var triggerPosition = currentText.lastIndexOf(this.settup.triggerChar, cursorPosition);
    var currentMention = "";

    // if there is a trigger and cursor is on valid position
    if (triggerPosition !== -1 && (currentText.charAt(cursorPosition-1) !== ' ')) {
      currentMention = currentText.slice(triggerPosition+1, cursorPosition);
    }

    return currentMention;
  }


  UserMentions.prototype.searchForMentions = function searchForMentions(currentMention) {
    var xhr = new XMLHttpRequest();
    var params = "mention=" + encodeURIComponent(currentMention);
    var requestUrl = this.settup.requestUrl + "?" + params;
    var currentInstance = this;

    if (/^\/.*$/.test(requestUrl)) {
      var currentLocation = window.location.href.replace(/\/$/, '');
      requestUrl = currentLocation + requestUrl;
    }

    xhr.open("GET", requestUrl, true);
    xhr.onreadystatechange = function onreadystatechange() {
      if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        currentInstance.populateUserList(response);
      }
    }


    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send(params);
  }


  UserMentions.prototype.populateUserList = function populateUserList(userList) {
    this.settup.userList = userList;

    this.displayUserSelection();
  }


  UserMentions.prototype.displayUserSelection = function displayUserSelection() {
    var userMentionList = this.wrapper.querySelector(".users-mention-list");

    if (userMentionList) {
      this.wrapper.removeChild(userMentionList);
    }

    var listTemplate = this.buildTemplates();

    //this.field.after(listTemplate);
    this.field.insertAdjacentHTML("afterend", listTemplate);

    this.field.removeEventListener("keyup", this.fieldKeyUpEvent.bind(this));
    this.field.addEventListener("keyup", this.fieldKeyUpEvent.bind(this));
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
    console.log(evt);
  }


  document.addEventListener("DOMContentLoaded", () => {
    var elements = document.querySelectorAll("textarea[data-users-mention-field]");

    [].forEach.call(elements, (el) => {
      var dataAttr = [].filter.call(el.attributes, at => /^data-(?!users-mention)/.test(at.name));

      var settup = {};
      dataAttr.forEach((attr) => {
        var name = attr.name.replace("data-", "");
        name = name.replace(/-([a-z])/g, (_, firstLetter) => firstLetter.toUpperCase());
        var value = attr.value;

        settup[name] = value;
      });

      var userMentions = new UserMentions(settup, el);
    });
  }, false);

}) (_.runInContext());
