"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (_, undefined) {
  "use strict";

  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g,
    variable: "rc"
  };

  var UserMentions = function () {
    function UserMentions(settup, field) {
      _classCallCheck(this, UserMentions);

      var wrapper = document.createElement("div");
      wrapper.classList.add("users-mention-wrapper");

      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);

      this.settup = this.prepareSettup(settup);
      this.field = field;
      this.wrapper = wrapper;

      this.field.addEventListener("input", this.userInputEvent.bind(this), false);
    }

    _createClass(UserMentions, [{
      key: "prepareSettup",
      value: function prepareSettup(settup) {
        _.defaults(settup, {
          requestUrl: "",
          userList: [],
          getMentionsData: null,
          searchPattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", // by default it uses the slug pattern, EX: Hey @mary-jane look here !
          triggerChar: '@',
          lengthStartSearch: 3,
          templates: {
            container: _.template("\n              <div class='users-mention-list'>\n                <%= rc.userListTemplate %>\n              </div>\n            "),
            userList: _.template("\n              <ul>\n              <% _.forEach(rc.userList, function(user) { %>\n                <li data-slug='<%= user.slug %>'>\n                  <%= user.slug %>\n                  <small><%= user.name %></small>\n                </li>\n              <% }); %>\n              </ul>\n\n              <select id='users-mention-list-select'>\n                <% _.forEach(rc.userList, (user) => { %>\n                  <option value='<%= user.slug %>'>\n                    <%= user.slug %>\n                  </option>\n                <% }); %>\n              </select>\n            ")
          }
        });

        return settup;
      }
    }, {
      key: "userInputEvent",
      value: function userInputEvent(evt) {
        var hasMention = this.verifyIfHasMention();

        if (hasMention) {
          this.searchForMentions(this.getCurrentMention());
        }
      }
    }, {
      key: "verifyIfHasMention",
      value: function verifyIfHasMention() {
        var found = false;
        var searchRegex = new RegExp(this.settup.searchPattern, 'g');
        var possibleMention = this.getCurrentMention();

        if (possibleMention.length >= this.settup.lengthStartSearch) {
          found = searchRegex.test(possibleMention);
        }

        return found;
      }
    }, {
      key: "getCurrentMention",
      value: function getCurrentMention() {
        var currentText = this.field.value;
        var cursorPosition = this.field.selectionStart;
        var triggerPosition = currentText.lastIndexOf(this.settup.triggerChar, cursorPosition);
        var currentMention = "";

        // if there is a trigger and cursor is on valid position
        if (triggerPosition !== -1 && currentText.charAt(cursorPosition - 1) !== ' ') {
          currentMention = currentText.slice(triggerPosition + 1, cursorPosition);
        }

        return currentMention;
      }
    }, {
      key: "searchForMentions",
      value: function searchForMentions(currentMention) {
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
        };

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send(params);
      }
    }, {
      key: "populateUserList",
      value: function populateUserList(userList) {
        this.settup.userList = userList;

        this.displayUserSelection();
      }
    }, {
      key: "displayUserSelection",
      value: function displayUserSelection() {
        var listTemplate = this.buildTemplates();

        this.currentMention = this.getCurrentMention();

        this.removeUsersListDiv();
        this.field.insertAdjacentHTML("afterend", listTemplate);
        this.usersListDIV = this.wrapper.querySelector(".users-mention-list");

        this.field.onkeyup = this.fieldKeyUpEvent.bind(this);

        var usersListUL = this.usersListDIV.querySelector("ul");
        usersListUL.onclick = this.usersListUlOnClickEvent.bind(this);
      }
    }, {
      key: "removeUsersListDiv",
      value: function removeUsersListDiv() {
        if (this.usersListDIV) {
          this.wrapper.removeChild(this.usersListDIV);
          this.usersListDIV = null;
        }
      }
    }, {
      key: "buildTemplates",
      value: function buildTemplates() {
        var userListTemplate = this.settup.templates.userList({
          userList: this.settup.userList
        });

        var containerTemplate = this.settup.templates.container({
          userListTemplate: userListTemplate
        });

        return containerTemplate;
      }
    }, {
      key: "fieldKeyUpEvent",
      value: function fieldKeyUpEvent(evt) {
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
    }, {
      key: "usersListSelectChangeEvent",
      value: function usersListSelectChangeEvent(evt) {
        var searchRegex = new RegExp(evt.target.value);
        var usersListLI = this.usersListDIV.querySelectorAll("ul li");
        var currentSelectedLI = this.usersListDIV.querySelectorAll("ul li.selected");

        [].forEach.call(currentSelectedLI, function (li) {
          return li.className = "";
        });

        var itens = [].filter.call(usersListLI, function (li) {
          return searchRegex.test(li.textContent);
        });

        if (itens.length) {
          var li = itens[0];
          li.className = "selected";
        }
      }
    }, {
      key: "usersListSelectOnKeyPress",
      value: function usersListSelectOnKeyPress(evt) {
        // 13 -> Enter
        if (evt.keyCode === 13) {
          this.chooseMention(evt.target.value);
        }
      }
    }, {
      key: "usersListUlOnClickEvent",
      value: function usersListUlOnClickEvent(evt) {
        var clickedItem = evt.target;

        if (clickedItem.tagName !== "LI") {
          clickedItem = clickedItem.parentNode;
        }

        var slug = clickedItem.getAttribute("data-slug");

        this.chooseMention(slug);
      }
    }, {
      key: "chooseMention",
      value: function chooseMention(mention) {
        this.removeUsersListDiv();
        console.log("Selected: " + mention, this.currentMention);
        this.field.value = this.field.value.replace("@" + this.currentMention, "@" + mention);
        this.field.focus();
      }
    }]);

    return UserMentions;
  }();

  document.addEventListener("DOMContentLoaded", function () {
    var elements = document.querySelectorAll("textarea[data-users-mention-field]");

    [].forEach.call(elements, function (el) {
      var dataAttr = [].filter.call(el.attributes, function (at) {
        return (/^data-(?!users-mention)/.test(at.name)
        );
      });

      var settup = {};
      dataAttr.forEach(function (attr) {
        var name = attr.name.replace("data-", "");
        name = name.replace(/-([a-z])/g, function (_, firstLetter) {
          return firstLetter.toUpperCase();
        });
        var value = attr.value;

        settup[name] = value;
      });

      var userMentions = new UserMentions(settup, el);
    });
  }, false);
})(_.runInContext());