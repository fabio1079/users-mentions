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
    _.defaults(settup, {
      requestUrl: "",
      userList: [],
      getMentionsData: null,
      searchPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
      triggerChar: '@',
      lengthStartSearch: 3,
      templates: {
        container: _.template(
          `
            <div class='users-mention-list'>
              <%= rc.userListTemplate %>
            </div>
          `),
        userList: _.template(
          `
            <ul>
            <% _.forEach(rc.userList, function(user) { %>
              <li data-slug='<%= user.slug %>'>
                <%= user.slug %>
                <small><%= user.name %></small>
              </li>
            <% }); %>
            </ul>

            <select id='users-mention-list-select'>
              <% _.forEach(rc.userList, (user) => { %>
                <option value='<%= user.slug %>'>
                  <%= user.slug %>
                </option>
              <% }); %>
            </select>
          `)
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
    var listTemplate = this.buildTemplates();

    this.removeUsersListDiv();
    this.field.insertAdjacentHTML("afterend", listTemplate);
    this.usersListDIV = this.wrapper.querySelector(".users-mention-list");

    this.field.onkeyup = this.fieldKeyUpEvent.bind(this);

    var usersListUL = this.usersListDIV.querySelector("ul");
    usersListUL.onclick = this.usersListUlOnClickEvent.bind(this);
  }


  UserMentions.prototype.removeUsersListDiv = function removeUsersListDiv() {
    if (this.usersListDIV) {
      this.wrapper.removeChild(this.usersListDIV);
      this.usersListDIV = null;
    }
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
    // down 40, up 38
    if (evt.keyCode === 40 || evt.keyCode === 38) {
      this.field.blur();

      var usersListSelect = this.usersListDIV.querySelector("select");
      usersListSelect.focus();
      usersListSelect.selectedIndex = 0;
      usersListSelect.onchange = this.usersListSelectChangeEvent.bind(this);
      usersListSelect.onkeypress = this.usersListSelectOnKeyPress.bind(this);

      var usersListFristLI = this.usersListDIV.querySelector("ul li");
      usersListFristLI.className = "selected";
    }
  }


  UserMentions.prototype.usersListSelectChangeEvent = function usersListSelectChangeEvent(evt) {
    var searchRegex = new RegExp(evt.target.value);
    var usersListLI = this.usersListDIV.querySelectorAll("ul li");
    var currentSelectedLI = this.usersListDIV.querySelectorAll("ul li.selected");

    [].forEach.call(currentSelectedLI, li => li.className = "");

    var itens = [].filter.call(usersListLI, (li) => searchRegex.test(li.textContent));

    if (itens.length) {
      var li = itens[0];
      li.className = "selected";
    }
  }


  UserMentions.prototype.usersListSelectOnKeyPress = function usersListSelectOnKeyPress(evt) {
    // 13 -> Enter
    if (evt.keyCode === 13) {
      this.chooseMention(evt.target.value);
    }
  }


  UserMentions.prototype.usersListUlOnClickEvent = function usersListUlOnClickEvent(evt) {
    var clickedItem = evt.target;

    if (clickedItem.tagName !== "LI") {
      clickedItem = clickedItem.parentNode;
    }

    var slug = clickedItem.getAttribute("data-slug");

    this.chooseMention(slug);
  }


  UserMentions.prototype.chooseMention = function chooseMention(mention) {
    this.removeUsersListDiv();
    console.log("Selected: " + mention);
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
